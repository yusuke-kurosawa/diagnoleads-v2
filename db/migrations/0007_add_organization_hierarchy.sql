-- ============================================================================
-- Phase 2.7: Organization Hierarchy Support
-- ============================================================================
-- Adds hierarchical organization structure for holding companies,
-- group companies, and M&A scenarios.
--
-- Features:
-- - Parent-child organization relationships
-- - Hierarchical path for efficient tree queries (ltree)
-- - Group-level identification
-- - Data sharing policies for cross-organization access
-- ============================================================================

-- Enable ltree extension for hierarchical queries
CREATE EXTENSION IF NOT EXISTS ltree;

-- Add hierarchy columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_type TEXT NOT NULL DEFAULT 'independent',
ADD COLUMN IF NOT EXISTS hierarchy_path ltree,
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS data_sharing_policy JSONB NOT NULL DEFAULT '{"allowParentAccess": false, "allowChildAccess": false, "allowSiblingAccess": false}';

-- Add constraint for organization_type
ALTER TABLE organizations
ADD CONSTRAINT organizations_type_check
CHECK (organization_type IN ('holding', 'subsidiary', 'independent'));

-- Create indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id
ON organizations(parent_organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_group_id
ON organizations(group_id);

CREATE INDEX IF NOT EXISTS idx_organizations_hierarchy_path
ON organizations USING gist (hierarchy_path);

CREATE INDEX IF NOT EXISTS idx_organizations_type
ON organizations(organization_type);

-- ============================================================================
-- Hierarchy Helper Functions
-- ============================================================================

-- Function to update hierarchy_path when parent changes
CREATE OR REPLACE FUNCTION update_organization_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_path ltree;
  parent_level INTEGER;
  parent_group UUID;
BEGIN
  IF NEW.parent_organization_id IS NULL THEN
    -- Root organization: path is just the ID, level is 0
    NEW.hierarchy_path := text2ltree(replace(NEW.id::text, '-', '_'));
    NEW.hierarchy_level := 0;
    NEW.group_id := NEW.id; -- Root is its own group

    -- If becoming independent, set type accordingly
    IF NEW.organization_type = 'subsidiary' THEN
      NEW.organization_type := 'independent';
    END IF;
  ELSE
    -- Get parent's hierarchy info
    SELECT hierarchy_path, hierarchy_level, group_id
    INTO parent_path, parent_level, parent_group
    FROM organizations
    WHERE id = NEW.parent_organization_id;

    IF parent_path IS NULL THEN
      -- Parent doesn't have a path yet, use just parent ID
      parent_path := text2ltree(replace(NEW.parent_organization_id::text, '-', '_'));
      parent_level := 0;
      parent_group := NEW.parent_organization_id;
    END IF;

    -- Set child's path as parent's path + child ID
    NEW.hierarchy_path := parent_path || text2ltree(replace(NEW.id::text, '-', '_'));
    NEW.hierarchy_level := parent_level + 1;
    NEW.group_id := parent_group;

    -- Set type to subsidiary if it was independent
    IF NEW.organization_type = 'independent' THEN
      NEW.organization_type := 'subsidiary';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update hierarchy on insert/update
DROP TRIGGER IF EXISTS trg_update_organization_hierarchy ON organizations;
CREATE TRIGGER trg_update_organization_hierarchy
BEFORE INSERT OR UPDATE OF parent_organization_id ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_organization_hierarchy();

-- Function to get all descendant organizations
CREATE OR REPLACE FUNCTION get_descendant_organizations(org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  organization_type TEXT,
  hierarchy_level INTEGER
) AS $$
DECLARE
  org_path ltree;
BEGIN
  -- Get the organization's hierarchy path
  SELECT hierarchy_path INTO org_path
  FROM organizations
  WHERE organizations.id = org_id;

  IF org_path IS NULL THEN
    RETURN;
  END IF;

  -- Return all organizations whose path starts with this org's path
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.organization_type,
    o.hierarchy_level
  FROM organizations o
  WHERE o.hierarchy_path <@ org_path
    AND o.id != org_id
  ORDER BY o.hierarchy_level, o.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all ancestor organizations
CREATE OR REPLACE FUNCTION get_ancestor_organizations(org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  organization_type TEXT,
  hierarchy_level INTEGER
) AS $$
DECLARE
  org_path ltree;
BEGIN
  -- Get the organization's hierarchy path
  SELECT hierarchy_path INTO org_path
  FROM organizations
  WHERE organizations.id = org_id;

  IF org_path IS NULL THEN
    RETURN;
  END IF;

  -- Return all organizations that are ancestors of this org
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.organization_type,
    o.hierarchy_level
  FROM organizations o
  WHERE org_path <@ o.hierarchy_path
    AND o.id != org_id
  ORDER BY o.hierarchy_level DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get organizations accessible by a user based on hierarchy
CREATE OR REPLACE FUNCTION get_accessible_organizations(
  user_id_param UUID,
  include_descendants BOOLEAN DEFAULT FALSE,
  include_group BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  organization_type TEXT,
  hierarchy_level INTEGER,
  access_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Direct memberships
  SELECT
    o.id,
    o.name,
    o.slug,
    o.organization_type,
    o.hierarchy_level,
    'direct'::TEXT AS access_type
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = user_id_param

  UNION

  -- Descendant access (for group_owner, group_admin, parent_viewer)
  SELECT
    child.id,
    child.name,
    child.slug,
    child.organization_type,
    child.hierarchy_level,
    'descendant'::TEXT AS access_type
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  INNER JOIN organizations child ON child.hierarchy_path <@ o.hierarchy_path AND child.id != o.id
  WHERE om.user_id = user_id_param
    AND include_descendants = TRUE
    AND om.role IN ('group_owner', 'group_admin', 'parent_viewer', 'owner')
    AND (child.data_sharing_policy->>'allowParentAccess')::boolean = TRUE

  UNION

  -- Group-wide access (for group_owner, group_admin)
  SELECT
    grp.id,
    grp.name,
    grp.slug,
    grp.organization_type,
    grp.hierarchy_level,
    'group'::TEXT AS access_type
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  INNER JOIN organizations grp ON grp.group_id = o.group_id AND grp.id != o.id
  WHERE om.user_id = user_id_param
    AND include_group = TRUE
    AND om.role IN ('group_owner', 'group_admin')

  ORDER BY hierarchy_level, name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN organizations.parent_organization_id IS 'Parent organization ID for hierarchical structure';
COMMENT ON COLUMN organizations.organization_type IS 'Type: holding, subsidiary, or independent';
COMMENT ON COLUMN organizations.hierarchy_path IS 'ltree path for efficient ancestor/descendant queries';
COMMENT ON COLUMN organizations.hierarchy_level IS 'Level in hierarchy: 0=root, 1=child, 2=grandchild, etc.';
COMMENT ON COLUMN organizations.group_id IS 'ID of the root organization in the group';
COMMENT ON COLUMN organizations.data_sharing_policy IS 'Cross-organization data access policy';

COMMENT ON FUNCTION update_organization_hierarchy() IS 'Trigger function to maintain hierarchy_path and hierarchy_level';
COMMENT ON FUNCTION get_descendant_organizations(UUID) IS 'Get all descendant organizations';
COMMENT ON FUNCTION get_ancestor_organizations(UUID) IS 'Get all ancestor organizations';
COMMENT ON FUNCTION get_accessible_organizations(UUID, BOOLEAN, BOOLEAN) IS 'Get organizations accessible by a user';
