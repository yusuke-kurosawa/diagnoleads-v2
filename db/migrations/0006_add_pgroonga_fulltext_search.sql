-- Enable full-text search capabilities for leads
-- PostgreSQL built-in full-text search with GIN indexes

-- Add tsvector column for full-text search
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(company, '') || ' ' ||
    coalesce(notes, '')
  )
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS leads_search_vector_idx
ON leads
USING gin (search_vector);

-- Add comment to explain the column
COMMENT ON COLUMN leads.search_vector IS 'Full-text search vector for name, email, company, and notes';

-- Create function for weighted full-text search
CREATE OR REPLACE FUNCTION search_leads(
  search_query text,
  org_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  company text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    leads.id,
    leads.name,
    leads.email,
    leads.company,
    ts_rank(leads.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM leads
  WHERE
    leads.organization_id = org_id
    AND leads.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_leads(text, uuid) IS 'Full-text search function for leads with ranking';
