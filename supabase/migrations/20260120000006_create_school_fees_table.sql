-- Migration: Create school_fees table
-- Phase 9: Family Members Feature

CREATE TABLE school_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrolment_id UUID NOT NULL REFERENCES school_enrolments(id) ON DELETE CASCADE,
    fee_type_id UUID NOT NULL REFERENCES fee_types(id),
    frequency_id UUID NOT NULL REFERENCES frequencies(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    school_term_id UUID REFERENCES school_terms(id),
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    payment_method TEXT,
    invoice_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE school_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to school_fees" ON school_fees FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_school_fees_enrolment ON school_fees(enrolment_id);
CREATE INDEX idx_school_fees_due_date ON school_fees(due_date);
CREATE INDEX idx_school_fees_year ON school_fees(year);
CREATE INDEX idx_school_fees_paid ON school_fees(is_paid);
CREATE INDEX idx_school_fees_term ON school_fees(school_term_id);
CREATE INDEX idx_school_fees_type ON school_fees(fee_type_id);
CREATE INDEX idx_school_fees_frequency ON school_fees(frequency_id);

COMMENT ON TABLE school_fees IS 'School fee tracking with due dates and payment status - Phase 9';
