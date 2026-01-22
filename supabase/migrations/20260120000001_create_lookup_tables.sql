-- Migration: Create lookup tables for user-definable categories
-- Phase 9: Family Members Feature

-- ===========================================
-- Fee Types (user-definable)
-- ===========================================
CREATE TABLE fee_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Seed default fee types (user_id NULL = system default)
INSERT INTO fee_types (user_id, name, description, is_system, sort_order) VALUES
    (NULL, 'Tuition', 'Regular tuition fees', true, 1),
    (NULL, 'Building Levy', 'Building and facilities levy', true, 2),
    (NULL, 'Technology Levy', 'Technology and IT levy', true, 3),
    (NULL, 'Excursion', 'Day trips and excursions', true, 4),
    (NULL, 'Camp', 'School camps and overnight trips', true, 5),
    (NULL, 'Uniform', 'School uniform purchases', true, 6),
    (NULL, 'Books & Stationery', 'Textbooks and stationery', true, 7),
    (NULL, 'Sport', 'Sport programs and equipment', true, 8),
    (NULL, 'Music', 'Music programs and instrument hire', true, 9),
    (NULL, 'Before School Care', 'Before school care program', true, 10),
    (NULL, 'After School Care', 'After school care program', true, 11),
    (NULL, 'Vacation Care', 'School holiday care', true, 12),
    (NULL, 'Swimming', 'Swimming lessons', true, 13),
    (NULL, 'Library', 'Library fees or lost books', true, 14),
    (NULL, 'Other', 'Other fees', true, 99);

-- RLS (simplified for no-auth app)
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to fee_types" ON fee_types FOR ALL USING (true);

-- ===========================================
-- Activity Types (user-definable)
-- ===========================================
CREATE TABLE activity_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Seed default activity types
INSERT INTO activity_types (user_id, name, icon, description, is_system, sort_order) VALUES
    (NULL, 'Sport', 'trophy', 'Team or individual sports', true, 1),
    (NULL, 'Music', 'music', 'Music lessons and ensembles', true, 2),
    (NULL, 'Dance', 'sparkles', 'Dance classes', true, 3),
    (NULL, 'Art', 'palette', 'Art and craft classes', true, 4),
    (NULL, 'Drama', 'theater', 'Drama and acting', true, 5),
    (NULL, 'Swimming', 'waves', 'Swimming lessons', true, 6),
    (NULL, 'Martial Arts', 'shield', 'Martial arts training', true, 7),
    (NULL, 'Tutoring', 'book-open', 'Academic tutoring', true, 8),
    (NULL, 'Language', 'globe', 'Language classes', true, 9),
    (NULL, 'Coding', 'code', 'Programming and robotics', true, 10),
    (NULL, 'Scouts/Guides', 'compass', 'Scouts, Guides, Cubs', true, 11),
    (NULL, 'Religious', 'heart', 'Religious education', true, 12),
    (NULL, 'Gymnastics', 'dumbbell', 'Gymnastics training', true, 13),
    (NULL, 'Horse Riding', 'horse', 'Equestrian activities', true, 14),
    (NULL, 'Other', 'circle', 'Other activities', true, 99);

-- RLS
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to activity_types" ON activity_types FOR ALL USING (true);

-- ===========================================
-- Frequencies (user-definable)
-- ===========================================
CREATE TABLE frequencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    per_year_multiplier DECIMAL(10,4),
    is_system BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Seed default frequencies
INSERT INTO frequencies (user_id, name, description, per_year_multiplier, is_system, sort_order) VALUES
    (NULL, 'Once Off', 'One-time payment', 1, true, 1),
    (NULL, 'Per Session', 'Per individual session', NULL, true, 2),
    (NULL, 'Weekly', 'Every week', 52, true, 3),
    (NULL, 'Fortnightly', 'Every two weeks', 26, true, 4),
    (NULL, 'Monthly', 'Every month', 12, true, 5),
    (NULL, 'Per Term', 'Once per school term', 4, true, 6),
    (NULL, 'Per Semester', 'Once per semester', 2, true, 7),
    (NULL, 'Annual', 'Once per year', 1, true, 8),
    (NULL, 'Per Quarter', 'Every 3 months', 4, true, 9);

-- RLS
ALTER TABLE frequencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to frequencies" ON frequencies FOR ALL USING (true);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX idx_fee_types_user ON fee_types(user_id);
CREATE INDEX idx_fee_types_sort ON fee_types(sort_order);
CREATE INDEX idx_activity_types_user ON activity_types(user_id);
CREATE INDEX idx_activity_types_sort ON activity_types(sort_order);
CREATE INDEX idx_frequencies_user ON frequencies(user_id);
CREATE INDEX idx_frequencies_sort ON frequencies(sort_order);

-- Comments
COMMENT ON TABLE fee_types IS 'User-definable school fee categories - Phase 9';
COMMENT ON TABLE activity_types IS 'User-definable extracurricular activity categories - Phase 9';
COMMENT ON TABLE frequencies IS 'User-definable payment/cost frequencies - Phase 9';
