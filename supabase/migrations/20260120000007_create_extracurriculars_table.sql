-- Migration: Create extracurriculars table
-- Phase 9: Family Members Feature

CREATE TABLE extracurriculars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    activity_type_id UUID NOT NULL REFERENCES activity_types(id),
    name TEXT NOT NULL,
    provider TEXT,
    venue TEXT,
    day_of_week TEXT[],
    time_start TIME,
    time_end TIME,
    season_start DATE,
    season_end DATE,
    is_active BOOLEAN DEFAULT true,

    -- Costs with flexible frequency
    cost_amount DECIMAL(10,2),
    cost_frequency_id UUID REFERENCES frequencies(id),
    registration_fee DECIMAL(10,2),
    equipment_cost DECIMAL(10,2),
    uniform_cost DECIMAL(10,2),
    other_costs DECIMAL(10,2),
    other_costs_description TEXT,

    -- Contact info
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE extracurriculars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to extracurriculars" ON extracurriculars FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_extracurriculars_member ON extracurriculars(family_member_id);
CREATE INDEX idx_extracurriculars_active ON extracurriculars(is_active);
CREATE INDEX idx_extracurriculars_type ON extracurriculars(activity_type_id);
CREATE INDEX idx_extracurriculars_frequency ON extracurriculars(cost_frequency_id);

COMMENT ON TABLE extracurriculars IS 'Extracurricular activities with costs and schedules - Phase 9';
