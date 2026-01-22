-- Migration: Enhance family_members table with additional fields
-- Phase 9: Family Members Feature

-- Add new columns to existing family_members table
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS relationship TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS medicare_number TEXT,
ADD COLUMN IF NOT EXISTS tax_file_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add constraints
ALTER TABLE family_members
ADD CONSTRAINT family_members_relationship_check
CHECK (relationship IS NULL OR relationship IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other'));

ALTER TABLE family_members
ADD CONSTRAINT family_members_gender_check
CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_family_members_member_type ON family_members(member_type);

COMMENT ON TABLE family_members IS 'Family member profiles with personal and financial information - Phase 9';
