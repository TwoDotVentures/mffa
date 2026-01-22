-- Migration: Create school_enrolments table
-- Phase 9: Family Members Feature

CREATE TABLE school_enrolments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_level TEXT,
    enrolment_date DATE,
    expected_graduation DATE,
    student_id TEXT,
    house TEXT,
    is_current BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(family_member_id, school_id)
);

-- RLS
ALTER TABLE school_enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to school_enrolments" ON school_enrolments FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_school_enrolments_member ON school_enrolments(family_member_id);
CREATE INDEX idx_school_enrolments_school ON school_enrolments(school_id);
CREATE INDEX idx_school_enrolments_current ON school_enrolments(is_current);

COMMENT ON TABLE school_enrolments IS 'Family member school enrolments - Phase 9';
