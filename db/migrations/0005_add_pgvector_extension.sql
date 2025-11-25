-- Enable pgvector extension for vector similarity search
-- This extension adds support for vector data types and similarity search operations

-- Create pgvector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to leads table for semantic search
-- Using vector(1536) for OpenAI text-embedding-3-small (1536 dimensions)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast vector similarity search using HNSW (Hierarchical Navigable Small World)
-- This index enables efficient approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS leads_embedding_idx
ON leads
USING hnsw (embedding vector_cosine_ops);

-- Add comment to explain the column
COMMENT ON COLUMN leads.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
