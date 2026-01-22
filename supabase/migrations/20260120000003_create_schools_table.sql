-- Migration: Create schools table
-- Phase 9: Family Members Feature

CREATE TABLE schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    school_type TEXT NOT NULL CHECK (school_type IN ('primary', 'secondary', 'combined', 'preschool', 'tertiary', 'other')),
    sector TEXT CHECK (sector IS NULL OR sector IN ('public', 'private', 'catholic', 'independent', 'other')),
    address TEXT,
    suburb TEXT,
    state TEXT DEFAULT 'QLD',
    postcode TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (simplified for no-auth app)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to schools" ON schools FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_schools_user_id ON schools(user_id);
CREATE INDEX idx_schools_type ON schools(school_type);

COMMENT ON TABLE schools IS 'Schools attended by family members - Phase 9';
