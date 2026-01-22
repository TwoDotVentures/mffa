-- Phase 8.2: Document Embeddings Table
-- Vector storage for RAG (Retrieval Augmented Generation) search

-- Enable vector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,

  -- Chunk info
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL, -- The actual text chunk

  -- Embedding vector (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),

  -- Metadata
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy (via document ownership)
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access embeddings of their documents"
  ON document_embeddings FOR ALL USING (
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- Indexes for vector similarity search
CREATE INDEX idx_document_embeddings_document ON document_embeddings(document_id);

-- IVFFlat index for vector similarity search (better performance for large datasets)
CREATE INDEX idx_document_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Unique constraint to prevent duplicate chunks
CREATE UNIQUE INDEX idx_document_embeddings_unique_chunk
  ON document_embeddings(document_id, chunk_index);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION search_document_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_user_id uuid DEFAULT NULL,
  filter_entity_type text DEFAULT NULL,
  filter_document_type text DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  document_name text,
  entity_type text,
  document_type text,
  financial_year text,
  chunk_index int,
  chunk_content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS document_id,
    d.name AS document_name,
    d.entity_type,
    d.document_type,
    d.financial_year,
    de.chunk_index,
    de.content AS chunk_content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  JOIN documents d ON d.id = de.document_id
  WHERE
    1 - (de.embedding <=> query_embedding) > match_threshold
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (filter_entity_type IS NULL OR d.entity_type = filter_entity_type)
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE document_embeddings IS 'Vector embeddings for document chunks, enables semantic search - Phase 8.2';
COMMENT ON FUNCTION search_document_embeddings IS 'Semantic search across document embeddings with filtering';
