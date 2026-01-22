# Family Members Feature Plan

**MFFA | Phase 9 | January 2026**

---

## 1. Executive Summary

Add a comprehensive Family Members module under the Entities menu to track all family member information relevant to finances. This includes personal details, documents per member, and for dependents specifically - school fees tracking and extracurricular activities with costs.

### 1.1 Family Context
- **Adults:** Grant Moyle, Shannon Moyle (primary account holders)
- **Children:** 3 dependent children (school-aged)

### 1.2 Key Features
- **Member Profiles:** Personal info, DOB, relationships, contact details
- **Document Storage:** Per-member document uploads (IDs, medical, school docs)
- **School Fees Tracking:** School details, term dates, fee schedules, payment tracking
- **Extracurriculars:** Activities, costs, schedules, providers
- **Flexible Categories:** User-definable fee types, activity types, and frequencies

---

## 2. Database Schema

### 2.1 Lookup Tables (User-Definable Categories)

These tables allow users to add their own categories while providing sensible defaults.

```sql
-- Migration: create_lookup_tables.sql

-- Fee Types (user-definable)
CREATE TABLE fee_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- System defaults can't be deleted
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- user_id NULL = system default, available to all
    UNIQUE(user_id, name)
);

-- Seed default fee types
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

-- RLS: Users see system defaults + their own
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system and own fee types" ON fee_types
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can manage own fee types" ON fee_types
    FOR ALL USING (user_id = auth.uid());

-- Activity Types (user-definable)
CREATE TABLE activity_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT, -- Optional icon identifier
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
CREATE POLICY "Users can view system and own activity types" ON activity_types
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can manage own activity types" ON activity_types
    FOR ALL USING (user_id = auth.uid());

-- Frequencies (user-definable)
CREATE TABLE frequencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    per_year_multiplier DECIMAL(10,4), -- For annual cost calculation (e.g., weekly = 52)
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
CREATE POLICY "Users can view system and own frequencies" ON frequencies
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can manage own frequencies" ON frequencies
    FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_fee_types_user ON fee_types(user_id);
CREATE INDEX idx_activity_types_user ON activity_types(user_id);
CREATE INDEX idx_frequencies_user ON frequencies(user_id);

COMMENT ON TABLE fee_types IS 'User-definable school fee categories - Phase 9';
COMMENT ON TABLE activity_types IS 'User-definable extracurricular activity categories - Phase 9';
COMMENT ON TABLE frequencies IS 'User-definable payment/cost frequencies - Phase 9';
```

### 2.2 Enhanced Family Members Table

```sql
-- Migration: enhance_family_members_table.sql
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS relationship text,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS medicare_number text,
ADD COLUMN IF NOT EXISTS tax_file_number_encrypted text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add constraint for relationship
ALTER TABLE family_members
ADD CONSTRAINT family_members_relationship_check
CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other'));

COMMENT ON TABLE family_members IS 'Family member profiles with personal and financial information - Phase 9';
```

### 2.3 Schools Table

```sql
-- Migration: create_schools_table.sql
CREATE TABLE schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    school_type TEXT NOT NULL CHECK (school_type IN ('primary', 'secondary', 'combined', 'preschool', 'tertiary', 'other')),
    sector TEXT CHECK (sector IN ('public', 'private', 'catholic', 'independent', 'other')),
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

-- RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their schools" ON schools
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_schools_user_id ON schools(user_id);

COMMENT ON TABLE schools IS 'Schools attended by family members - Phase 9';
```

### 2.4 School Years & Terms Table

Defines the academic calendar for each school:

```sql
-- Migration: create_school_years_table.sql

-- School Years
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

-- School Terms/Semesters
CREATE TABLE school_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    term_type TEXT NOT NULL CHECK (term_type IN ('term', 'semester', 'trimester', 'quarter')),
    term_number INTEGER NOT NULL, -- 1, 2, 3, 4
    name TEXT, -- e.g., "Term 1", "Semester 1", "Spring Term"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fees_due_date DATE, -- When fees are typically due for this term
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(school_year_id, term_number)
);

-- RLS via school join
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage school years through schools" ON school_years
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM schools s
            WHERE s.id = school_id
            AND s.user_id = auth.uid()
        )
    );

ALTER TABLE school_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage school terms through schools" ON school_terms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM school_years sy
            JOIN schools s ON s.id = sy.school_id
            WHERE sy.id = school_year_id
            AND s.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_school_years_school ON school_years(school_id);
CREATE INDEX idx_school_years_year ON school_years(year);
CREATE INDEX idx_school_terms_year ON school_terms(school_year_id);
CREATE INDEX idx_school_terms_dates ON school_terms(start_date, end_date);

COMMENT ON TABLE school_years IS 'Academic year definitions per school - Phase 9';
COMMENT ON TABLE school_terms IS 'Term/semester dates within each school year - Phase 9';
```

### 2.5 School Enrolments Table

```sql
-- Migration: create_school_enrolments_table.sql
CREATE TABLE school_enrolments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_level TEXT, -- e.g., 'Prep', 'Year 1', 'Year 12'
    enrolment_date DATE,
    expected_graduation DATE,
    student_id TEXT, -- School's student identifier
    house TEXT, -- School house if applicable
    is_current BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(family_member_id, school_id)
);

-- RLS
ALTER TABLE school_enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage enrolments through family members" ON school_enrolments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.id = family_member_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE INDEX idx_school_enrolments_member ON school_enrolments(family_member_id);
CREATE INDEX idx_school_enrolments_school ON school_enrolments(school_id);

COMMENT ON TABLE school_enrolments IS 'Family member school enrolments - Phase 9';
```

### 2.6 School Fees Table

```sql
-- Migration: create_school_fees_table.sql
CREATE TABLE school_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrolment_id UUID NOT NULL REFERENCES school_enrolments(id) ON DELETE CASCADE,
    fee_type_id UUID NOT NULL REFERENCES fee_types(id),
    frequency_id UUID NOT NULL REFERENCES frequencies(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    school_term_id UUID REFERENCES school_terms(id), -- Optional link to specific term
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
CREATE POLICY "Users can manage fees through enrolments" ON school_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM school_enrolments se
            JOIN family_members fm ON fm.id = se.family_member_id
            WHERE se.id = enrolment_id
            AND fm.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_school_fees_enrolment ON school_fees(enrolment_id);
CREATE INDEX idx_school_fees_due_date ON school_fees(due_date);
CREATE INDEX idx_school_fees_year ON school_fees(year);
CREATE INDEX idx_school_fees_paid ON school_fees(is_paid);
CREATE INDEX idx_school_fees_term ON school_fees(school_term_id);
CREATE INDEX idx_school_fees_type ON school_fees(fee_type_id);

COMMENT ON TABLE school_fees IS 'School fee tracking with due dates and payment status - Phase 9';
```

### 2.7 Extracurricular Activities Table

```sql
-- Migration: create_extracurriculars_table.sql
CREATE TABLE extracurriculars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    activity_type_id UUID NOT NULL REFERENCES activity_types(id),
    name TEXT NOT NULL, -- e.g., "Soccer - U12 Dragons"
    provider TEXT, -- Club/organization name
    venue TEXT,
    day_of_week TEXT[], -- e.g., ['Monday', 'Wednesday']
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
CREATE POLICY "Users can manage extracurriculars through family members" ON extracurriculars
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.id = family_member_id
            AND fm.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_extracurriculars_member ON extracurriculars(family_member_id);
CREATE INDEX idx_extracurriculars_active ON extracurriculars(is_active);
CREATE INDEX idx_extracurriculars_type ON extracurriculars(activity_type_id);

COMMENT ON TABLE extracurriculars IS 'Extracurricular activities with costs and schedules - Phase 9';
```

### 2.8 Member Documents Table

```sql
-- Migration: create_member_documents_table.sql
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
CREATE POLICY "Users can manage member documents through family members" ON member_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.id = family_member_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE INDEX idx_member_documents_member ON member_documents(family_member_id);
CREATE INDEX idx_member_documents_document ON member_documents(document_id);

COMMENT ON TABLE member_documents IS 'Links documents to family members - Phase 9';
```

---

## 3. Type Definitions

Add to `/lib/types.ts`:

```typescript
// ============================================
// LOOKUP TABLES (User-Definable Categories)
// ============================================

export interface FeeType {
  id: string;
  user_id: string | null; // null = system default
  name: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface ActivityType {
  id: string;
  user_id: string | null;
  name: string;
  icon?: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface Frequency {
  id: string;
  user_id: string | null;
  name: string;
  description?: string;
  per_year_multiplier?: number; // For annual cost calculation
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

// ============================================
// FAMILY MEMBERS
// ============================================

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  member_type: 'adult' | 'child';
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth?: string;
  email?: string;
  phone?: string;
  medicare_number?: string;
  notes?: string;
  avatar_url?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberFormData {
  name: string;
  member_type: 'adult' | 'child';
  relationship: string;
  gender?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  medicare_number?: string;
  notes?: string;
}

// ============================================
// SCHOOLS
// ============================================

export interface School {
  id: string;
  user_id: string;
  name: string;
  school_type: 'primary' | 'secondary' | 'combined' | 'preschool' | 'tertiary' | 'other';
  sector?: 'public' | 'private' | 'catholic' | 'independent' | 'other';
  address?: string;
  suburb?: string;
  state: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  school_years?: SchoolYear[];
}

export interface SchoolFormData {
  name: string;
  school_type: string;
  sector?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

// ============================================
// SCHOOL YEARS & TERMS
// ============================================

export interface SchoolYear {
  id: string;
  school_id: string;
  year: number;
  year_start: string;
  year_end: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  terms?: SchoolTerm[];
  school?: School;
}

export interface SchoolYearFormData {
  school_id: string;
  year: number;
  year_start: string;
  year_end: string;
  notes?: string;
}

export interface SchoolTerm {
  id: string;
  school_year_id: string;
  term_type: 'term' | 'semester' | 'trimester' | 'quarter';
  term_number: number;
  name?: string;
  start_date: string;
  end_date: string;
  fees_due_date?: string;
  notes?: string;
  created_at: string;
  // Joined data
  school_year?: SchoolYear;
}

export interface SchoolTermFormData {
  school_year_id: string;
  term_type: string;
  term_number: number;
  name?: string;
  start_date: string;
  end_date: string;
  fees_due_date?: string;
  notes?: string;
}

// ============================================
// SCHOOL ENROLMENTS
// ============================================

export interface SchoolEnrolment {
  id: string;
  family_member_id: string;
  school_id: string;
  year_level?: string;
  enrolment_date?: string;
  expected_graduation?: string;
  student_id?: string;
  house?: string;
  is_current: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  school?: School;
  family_member?: FamilyMember;
}

export interface SchoolEnrolmentFormData {
  family_member_id: string;
  school_id: string;
  year_level?: string;
  enrolment_date?: string;
  expected_graduation?: string;
  student_id?: string;
  house?: string;
  is_current?: boolean;
  notes?: string;
}

// ============================================
// SCHOOL FEES
// ============================================

export interface SchoolFee {
  id: string;
  enrolment_id: string;
  fee_type_id: string;
  frequency_id: string;
  description: string;
  amount: number;
  due_date?: string;
  school_term_id?: string;
  year: number;
  is_paid: boolean;
  paid_date?: string;
  paid_amount?: number;
  payment_method?: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  fee_type?: FeeType;
  frequency?: Frequency;
  school_term?: SchoolTerm;
  enrolment?: SchoolEnrolment;
}

export interface SchoolFeeFormData {
  enrolment_id: string;
  fee_type_id: string;
  frequency_id: string;
  description: string;
  amount: number;
  due_date?: string;
  school_term_id?: string;
  year?: number;
  notes?: string;
}

// ============================================
// EXTRACURRICULARS
// ============================================

export interface Extracurricular {
  id: string;
  family_member_id: string;
  activity_type_id: string;
  name: string;
  provider?: string;
  venue?: string;
  day_of_week?: string[];
  time_start?: string;
  time_end?: string;
  season_start?: string;
  season_end?: string;
  is_active: boolean;
  cost_amount?: number;
  cost_frequency_id?: string;
  registration_fee?: number;
  equipment_cost?: number;
  uniform_cost?: number;
  other_costs?: number;
  other_costs_description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  activity_type?: ActivityType;
  cost_frequency?: Frequency;
  family_member?: FamilyMember;
}

export interface ExtracurricularFormData {
  family_member_id: string;
  activity_type_id: string;
  name: string;
  provider?: string;
  venue?: string;
  day_of_week?: string[];
  time_start?: string;
  time_end?: string;
  season_start?: string;
  season_end?: string;
  cost_amount?: number;
  cost_frequency_id?: string;
  registration_fee?: number;
  equipment_cost?: number;
  uniform_cost?: number;
  other_costs?: number;
  other_costs_description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  notes?: string;
}

// ============================================
// MEMBER DOCUMENTS
// ============================================

export interface MemberDocument {
  id: string;
  family_member_id: string;
  document_id: string;
  document_category: 'identification' | 'medical' | 'school' | 'certificate' | 'legal' | 'insurance' | 'financial' | 'other';
  notes?: string;
  created_at: string;
  // Joined data
  document?: Document;
  family_member?: FamilyMember;
}

// ============================================
// SUMMARY TYPES
// ============================================

export interface FamilyMemberSummary extends FamilyMember {
  age?: number;
  current_school?: School;
  current_year_level?: string;
  total_school_fees_year?: number;
  unpaid_fees_count?: number;
  active_activities_count?: number;
  total_activities_cost_year?: number;
}

export interface SchoolFeesSummary {
  total_fees: number;
  paid_amount: number;
  remaining_amount: number;
  overdue_count: number;
  upcoming_count: number;
  fees_by_type: { fee_type: FeeType; total: number }[];
  fees_by_term: { term: SchoolTerm; total: number }[];
}

export interface ExtracurricularSummary {
  total_activities: number;
  active_activities: number;
  total_annual_cost: number;
  weekly_hours: number;
  by_type: { activity_type: ActivityType; count: number; cost: number }[];
}
```

---

## 4. Directory Structure

```
/app
└── /family-members
    ├── page.tsx                    (Main page - member list/grid)
    └── /[id]
        └── page.tsx                (Member detail page with tabs)

/lib
└── /family-members
    ├── actions.ts                  (Server actions)
    └── utils.ts                    (Utilities)

/components
└── /family-members
    ├── family-member-list.tsx      (Grid of member cards)
    ├── family-member-card.tsx      (Individual member card)
    ├── family-member-dialog.tsx    (Create/edit member form)
    ├── member-detail-header.tsx    (Profile header on detail page)
    ├── empty-family-state.tsx      (No members yet)
    │
    │── # School Components
    ├── school-section.tsx          (School info section)
    ├── school-dialog.tsx           (Add/edit school)
    ├── school-year-dialog.tsx      (Add/edit school year)
    ├── school-terms-editor.tsx     (Bulk edit terms for a year)
    ├── enrolment-dialog.tsx        (Enrol child in school)
    │
    │── # Fee Components
    ├── school-fees-list.tsx        (Fee tracking table)
    ├── school-fee-dialog.tsx       (Add/edit fee)
    ├── school-fees-summary.tsx     (Fee totals and upcoming)
    ├── fee-calendar.tsx            (Visual calendar of due dates)
    │
    │── # Activity Components
    ├── extracurricular-list.tsx    (Activities list)
    ├── extracurricular-dialog.tsx  (Add/edit activity)
    ├── extracurricular-summary.tsx (Cost summary)
    ├── activity-schedule.tsx       (Weekly schedule view)
    │
    │── # Document Components
    ├── member-documents.tsx        (Documents section)
    ├── member-document-upload.tsx  (Upload linked to member)
    │
    │── # Settings/Category Components
    ├── fee-types-manager.tsx       (Manage custom fee types)
    ├── activity-types-manager.tsx  (Manage custom activity types)
    └── frequencies-manager.tsx     (Manage custom frequencies)
```

---

## 5. Key UI Features

### 5.1 School Year & Term Setup

When adding a school, users can set up the academic calendar:

```
┌─────────────────────────────────────────────────────────────┐
│ School Year Setup - Brisbane Grammar School                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Year: [2026 ▼]                                              │
│                                                              │
│ Year Dates:                                                  │
│ Start: [29/01/2026]    End: [10/12/2026]                    │
│                                                              │
│ Term Structure: [4 Terms ▼]                                  │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Term 1                                                  │ │
│ │ Start: [29/01/2026]  End: [04/04/2026]                 │ │
│ │ Fees Due: [15/01/2026]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Term 2                                                  │ │
│ │ Start: [21/04/2026]  End: [26/06/2026]                 │ │
│ │ Fees Due: [01/04/2026]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Term 3                                                  │ │
│ │ Start: [13/07/2026]  End: [18/09/2026]                 │ │
│ │ Fees Due: [01/07/2026]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Term 4                                                  │ │
│ │ Start: [05/10/2026]  End: [10/12/2026]                 │ │
│ │ Fees Due: [15/09/2026]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Copy from 2025]                          [Save Year Setup] │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Fee Type & Category Management

Settings section to manage custom categories:

```
┌─────────────────────────────────────────────────────────────┐
│ Manage Fee Types                              [+ Add Type]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ System Defaults (cannot delete):                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Tuition          ✓ Building Levy    ✓ Technology     │ │
│ │ ✓ Excursion        ✓ Camp             ✓ Uniform        │ │
│ │ ✓ Books            ✓ Sport            ✓ Music          │ │
│ │ ✓ Before School    ✓ After School     ✓ Vacation Care  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Your Custom Types:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Bus Transport         Monthly school bus fee    [Edit]  │ │
│ │ Instrumental Hire     Instrument rental         [Edit]  │ │
│ │ iPad Lease            Device leasing program    [Edit]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add Custom Fee Type]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Fee Entry with Term Selection

```
┌─────────────────────────────────────────────────────────────┐
│ Add School Fee                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Fee Type:     [Tuition ▼]                                   │
│                                                              │
│ Description:  [Term 1 Tuition 2026                    ]     │
│                                                              │
│ Amount:       [$] [4,500.00]                                │
│                                                              │
│ Frequency:    [Per Term ▼]                                  │
│                                                              │
│ ○ Set specific due date                                     │
│   Due Date:   [15/01/2026]                                  │
│                                                              │
│ ● Link to school term                                       │
│   Term:       [Term 1 (29 Jan - 4 Apr) ▼]                   │
│   (Due date auto-set to: 15/01/2026)                        │
│                                                              │
│ Invoice #:    [INV-2026-001                          ]      │
│                                                              │
│ Notes:        [                                       ]     │
│                                                              │
│                              [Cancel]  [Save Fee]           │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Annual Cost Calculator for Activities

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Cost Summary - Child Name                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚽ Soccer - U15 Dragons                                 │ │
│ │ $45/week × 40 weeks                      = $1,800      │ │
│ │ Registration                             = $150        │ │
│ │ Equipment (boots, shin pads)             = $200        │ │
│ │ Uniform                                  = $120        │ │
│ │                                   Total: $2,270/year   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎸 Guitar Lessons                                       │ │
│ │ $60/week × 48 weeks                      = $2,880      │ │
│ │ Book/materials (annual)                  = $80         │ │
│ │                                   Total: $2,960/year   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ══════════════════════════════════════════════════════════ │
│ Total Annual Activities Cost:              $5,230           │
│ Average Monthly Cost:                      $436             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Tasks

### Phase 9.1: Database & Types (3-4 hours)
- [ ] Create migration: create_lookup_tables.sql (fee_types, activity_types, frequencies with seeds)
- [ ] Create migration: enhance_family_members_table.sql
- [ ] Create migration: create_schools_table.sql
- [ ] Create migration: create_school_years_table.sql (includes school_terms)
- [ ] Create migration: create_school_enrolments_table.sql
- [ ] Create migration: create_school_fees_table.sql
- [ ] Create migration: create_extracurriculars_table.sql
- [ ] Create migration: create_member_documents_table.sql
- [ ] Apply all migrations to Supabase
- [ ] Add all types to lib/types.ts

### Phase 9.2: Server Actions (3-4 hours)
- [ ] Create lib/family-members/actions.ts
  - [ ] CRUD for family members
  - [ ] CRUD for fee_types, activity_types, frequencies (custom ones)
  - [ ] CRUD for schools
  - [ ] CRUD for school_years and school_terms
  - [ ] CRUD for school enrolments
  - [ ] CRUD for school fees
  - [ ] CRUD for extracurriculars
  - [ ] Member document linking
  - [ ] Summary/aggregation functions
  - [ ] Annual cost calculations
- [ ] Create lib/family-members/utils.ts
  - [ ] Age calculation from DOB
  - [ ] Year level calculation
  - [ ] Annual cost calculation from frequency
  - [ ] Term date helpers
  - [ ] Formatters

### Phase 9.3: Core Components (3-4 hours)
- [ ] family-member-card.tsx
- [ ] family-member-list.tsx
- [ ] family-member-dialog.tsx (create/edit)
- [ ] empty-family-state.tsx
- [ ] member-detail-header.tsx

### Phase 9.4: School & Calendar Components (3-4 hours)
- [ ] school-section.tsx
- [ ] school-dialog.tsx
- [ ] school-year-dialog.tsx
- [ ] school-terms-editor.tsx
- [ ] enrolment-dialog.tsx

### Phase 9.5: Fee Components (3-4 hours)
- [ ] school-fees-list.tsx
- [ ] school-fee-dialog.tsx
- [ ] school-fees-summary.tsx
- [ ] fee-calendar.tsx

### Phase 9.6: Activity Components (2-3 hours)
- [ ] extracurricular-list.tsx
- [ ] extracurricular-dialog.tsx
- [ ] extracurricular-summary.tsx
- [ ] activity-schedule.tsx

### Phase 9.7: Category Management (2-3 hours)
- [ ] fee-types-manager.tsx
- [ ] activity-types-manager.tsx
- [ ] frequencies-manager.tsx

### Phase 9.8: Documents Integration (1-2 hours)
- [ ] member-documents.tsx
- [ ] member-document-upload.tsx

### Phase 9.9: Pages (2-3 hours)
- [ ] /app/family-members/page.tsx (list view)
- [ ] /app/family-members/[id]/page.tsx (detail view with tabs)

### Phase 9.10: Navigation & Polish (1-2 hours)
- [ ] Add "Family Members" to sidebar under Entities
- [ ] Add member count badge
- [ ] Test all flows
- [ ] Mobile responsiveness
- [ ] Empty states

---

## 7. Future Enhancements

- **Notifications**: Reminders for upcoming fees (3 days, 1 week before)
- **Recurring fees**: Auto-generate term fees each year from template
- **Calendar export**: Export activities/fees to Google Calendar
- **Budget integration**: Link school fees to budget categories
- **AI integration**: "How much are we spending on each child's education?"
- **Bulk fee entry**: Add all term fees at once for a year
- **Fee payment tracking**: Integration with bank transactions
- **Report generation**: End of year education expense summary for tax

---

*Plan updated: January 2026 - Added flexible user-definable categories and school term dates*
