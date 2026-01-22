-- Migration: Create member_documents table
-- Phase 9: Family Members Feature

CREATE TABLE member_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_category TEXT NOT NULL CHECK (document_category IN (
        'identification', 'medical', 'school', 'certificate',
        'legal', 'insurance', 'financial', 'other'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(family_member_id, document_id)
);

-- RLS
ALTER TABLE member_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to member_documents" ON member_documents FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_member_documents_member ON member_documents(family_member_id);
CREATE INDEX idx_member_documents_document ON member_documents(document_id);
CREATE INDEX idx_member_documents_category ON member_documents(document_category);

COMMENT ON TABLE member_documents IS 'Links documents to family members - Phase 9';
