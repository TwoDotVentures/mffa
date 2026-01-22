-- Migration: Create school_years and school_terms tables
-- Phase 9: Family Members Feature

-- ===========================================
-- School Years
-- ===========================================
CREATE TABLE school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    year_start DATE NOT NULL,
    year_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(school_id, year)
);

-- RLS
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to school_years" ON school_years FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_school_years_school ON school_years(school_id);
CREATE INDEX idx_school_years_year ON school_years(year);

-- ===========================================
-- School Terms/Semesters
-- ===========================================
CREATE TABLE school_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    term_type TEXT NOT NULL CHECK (term_type IN ('term', 'semester', 'trimester', 'quarter')),
    term_number INTEGER NOT NULL,
    name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fees_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(school_year_id, term_number)
);

-- RLS
ALTER TABLE school_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to school_terms" ON school_terms FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_school_terms_year ON school_terms(school_year_id);
CREATE INDEX idx_school_terms_dates ON school_terms(start_date, end_date);
CREATE INDEX idx_school_terms_type ON school_terms(term_type);

-- Comments
COMMENT ON TABLE school_years IS 'Academic year definitions per school - Phase 9';
COMMENT ON TABLE school_terms IS 'Term/semester dates within each school year - Phase 9';
