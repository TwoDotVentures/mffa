-- Phase 8.2: Documents Table
-- File storage with metadata, linked to Supabase Storage

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- File info
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL, -- Bytes

  -- Categorisation
  entity_type TEXT NOT NULL CHECK (entity_type IN ('personal', 'smsf', 'trust')),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bank_statement', 'tax_return', 'receipt', 'invoice',
    'trust_deed', 'distribution_resolution', 'smsf_annual_return',
    'investment_statement', 'contract', 'insurance', 'other'
  )),

  -- Linking
  linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  financial_year TEXT, -- Format: '2024-25'

  -- Processing status for embeddings
  is_processed BOOLEAN DEFAULT false, -- Has embeddings been generated?
  processing_error TEXT,

  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}', -- Array of tags for filtering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_entity ON documents(user_id, entity_type);
CREATE INDEX idx_documents_type ON documents(user_id, document_type);
CREATE INDEX idx_documents_fy ON documents(user_id, financial_year);
CREATE INDEX idx_documents_transaction ON documents(linked_transaction_id);
CREATE INDEX idx_documents_processed ON documents(is_processed) WHERE is_processed = false;

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE documents IS 'Financial document storage metadata, linked to Supabase Storage - Phase 8.2';
