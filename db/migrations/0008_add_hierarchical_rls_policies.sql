-- ============================================================================
-- Phase 2.7: Hierarchical Row-Level Security Policies
-- ============================================================================
-- Extends RLS to support hierarchical organization access:
-- - Parent organizations can access child data (if allowed)
-- - Group owners/admins can access all group data
-- - Maintains existing single-organization isolation as default
-- ============================================================================

-- Enable RLS on leads table (if not already enabled)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to recreate with hierarchy support)
DROP POLICY IF EXISTS leads_select_policy ON leads;
DROP POLICY IF EXISTS leads_insert_policy ON leads;
DROP POLICY IF EXISTS leads_update_policy ON leads;
DROP POLICY IF EXISTS leads_delete_policy ON leads;

-- ============================================================================
-- Helper Function: Check hierarchical access
-- ============================================================================

-- Function to check if current user can access an organization's data
CREATE OR REPLACE FUNCTION can_access_organization(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_org_id UUID;
  current_role TEXT;
  target_org RECORD;
  current_org RECORD;
  has_access BOOLEAN := FALSE;
BEGIN
  -- Get current user and organization from session settings
  current_user_id := NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
  current_org_id := NULLIF(current_setting('app.current_org_id', TRUE), '')::UUID;
  current_role := NULLIF(current_setting('app.current_role', TRUE), '');

  -- If no user context, deny access
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check direct membership
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = target_org_id
      AND user_id = current_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Get target organization info
  SELECT id, group_id, parent_organization_id, hierarchy_path,
         (data_sharing_policy->>'allowParentAccess')::boolean AS allow_parent
  INTO target_org
  FROM organizations
  WHERE id = target_org_id;

  IF target_org IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current organization info (where user has membership)
  SELECT o.id, o.group_id, o.hierarchy_path, om.role
  INTO current_org
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = current_user_id
    AND (current_org_id IS NULL OR o.id = current_org_id)
  LIMIT 1;

  IF current_org IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check group_owner/group_admin access (same group)
  IF current_org.role IN ('group_owner', 'group_admin')
     AND current_org.group_id = target_org.group_id THEN
    RETURN TRUE;
  END IF;

  -- Check parent access (if target allows parent access)
  IF target_org.allow_parent
     AND current_org.hierarchy_path IS NOT NULL
     AND target_org.hierarchy_path IS NOT NULL
     AND target_org.hierarchy_path <@ current_org.hierarchy_path THEN
    -- Current org is ancestor of target org
    IF current_org.role IN ('owner', 'admin', 'group_owner', 'parent_viewer') THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- Session Configuration Functions
-- ============================================================================

-- Function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_rls_context(
  user_id UUID,
  org_id UUID DEFAULT NULL,
  role TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', COALESCE(user_id::text, ''), TRUE);
  PERFORM set_config('app.current_org_id', COALESCE(org_id::text, ''), TRUE);
  PERFORM set_config('app.current_role', COALESCE(role, ''), TRUE);
END;
$$ LANGUAGE plpgsql;

-- Function to clear RLS context
CREATE OR REPLACE FUNCTION clear_rls_context()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', '', TRUE);
  PERFORM set_config('app.current_org_id', '', TRUE);
  PERFORM set_config('app.current_role', '', TRUE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies for Leads
-- ============================================================================

-- SELECT: Users can view leads from organizations they have access to
CREATE POLICY leads_hierarchical_select ON leads
FOR SELECT
USING (
  -- Direct membership check (fast path)
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
  )
  OR
  -- Hierarchical access check (slower, for cross-org access)
  can_access_organization(leads.organization_id)
);

-- INSERT: Users can only insert into organizations they directly belong to with appropriate role
CREATE POLICY leads_hierarchical_insert ON leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'member', 'group_owner')
  )
);

-- UPDATE: Users can update leads in organizations they have write access to
CREATE POLICY leads_hierarchical_update ON leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'member', 'group_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'member', 'group_owner')
  )
);

-- DELETE: Only owners and admins can delete
CREATE POLICY leads_hierarchical_delete ON leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'group_owner')
  )
);

-- ============================================================================
-- RLS Policies for Organizations
-- ============================================================================

-- Enable RLS on organizations (if not already)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS organizations_select_policy ON organizations;
DROP POLICY IF EXISTS organizations_update_policy ON organizations;

-- SELECT: Users can see organizations they belong to + descendants (if appropriate role)
CREATE POLICY organizations_hierarchical_select ON organizations
FOR SELECT
USING (
  -- Direct membership
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
  )
  OR
  -- Can access through hierarchy
  can_access_organization(organizations.id)
);

-- UPDATE: Only owners/admins can update their organization
CREATE POLICY organizations_hierarchical_update ON organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'group_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'group_owner')
  )
);

-- ============================================================================
-- RLS Policies for Organization Members
-- ============================================================================

-- Enable RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS organization_members_select_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON organization_members;

-- SELECT: Users can see members of organizations they have access to
CREATE POLICY organization_members_hierarchical_select ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
  )
  OR
  can_access_organization(organization_members.organization_id)
);

-- INSERT: Only owners/admins can add members
CREATE POLICY organization_members_hierarchical_insert ON organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'group_owner')
  )
);

-- UPDATE: Only owners can update member roles
CREATE POLICY organization_members_hierarchical_update ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'group_owner')
  )
);

-- DELETE: Only owners can remove members
CREATE POLICY organization_members_hierarchical_delete ON organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
      AND om.role IN ('owner', 'admin', 'group_owner')
  )
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION can_access_organization(UUID) IS 'Check if current user can access an organization through hierarchy';
COMMENT ON FUNCTION set_rls_context(UUID, UUID, TEXT) IS 'Set RLS context for current session';
COMMENT ON FUNCTION clear_rls_context() IS 'Clear RLS context for current session';

COMMENT ON POLICY leads_hierarchical_select ON leads IS 'Hierarchical read access to leads';
COMMENT ON POLICY leads_hierarchical_insert ON leads IS 'Insert leads in directly-owned organizations';
COMMENT ON POLICY leads_hierarchical_update ON leads IS 'Update leads in directly-owned organizations';
COMMENT ON POLICY leads_hierarchical_delete ON leads IS 'Delete leads (owners/admins only)';
