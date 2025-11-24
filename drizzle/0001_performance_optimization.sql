-- Performance Optimization: Additional indexes for common queries
-- Migration: 0001_performance_optimization
-- Created: 2025-11-24
-- Purpose: Add composite indexes to optimize frequently used queries

-- Composite index for filtering leads by organization and status
-- Optimizes queries like: SELECT * FROM leads WHERE organization_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS "leads_organization_status_idx"
ON "leads"("organization_id", "status");

-- Composite index for sorting leads by creation date within an organization
-- Optimizes queries like: SELECT * FROM leads WHERE organization_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS "leads_organization_created_at_idx"
ON "leads"("organization_id", "created_at" DESC);

-- Index for email searches within an organization (case-insensitive search support)
-- Optimizes queries like: SELECT * FROM leads WHERE organization_id = ? AND email ILIKE ?
CREATE INDEX IF NOT EXISTS "leads_organization_email_idx"
ON "leads"("organization_id", LOWER("email"));

-- Index for score-based queries (for lead scoring features)
-- Optimizes queries like: SELECT * FROM leads WHERE organization_id = ? ORDER BY score DESC
CREATE INDEX IF NOT EXISTS "leads_organization_score_idx"
ON "leads"("organization_id", "score" DESC NULLS LAST);

-- Index for source-based analytics
-- Optimizes queries like: SELECT source, COUNT(*) FROM leads WHERE organization_id = ? GROUP BY source
CREATE INDEX IF NOT EXISTS "leads_organization_source_idx"
ON "leads"("organization_id", "source");

-- Index for updated_at to support "recently updated" queries
CREATE INDEX IF NOT EXISTS "leads_organization_updated_at_idx"
ON "leads"("organization_id", "updated_at" DESC);

-- Partial index for active leads (not converted)
-- Reduces index size by excluding converted leads from the index
CREATE INDEX IF NOT EXISTS "leads_active_leads_idx"
ON "leads"("organization_id", "status")
WHERE "status" != 'converted';

-- Comment: Performance Impact
-- - Composite indexes reduce query execution time from O(n) to O(log n) for filtered queries
-- - Partial indexes reduce index size and improve write performance
-- - NULLS LAST in score index ensures consistent sorting behavior
