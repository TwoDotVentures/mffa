'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  FamilyMemberExtended,
  FamilyMemberFormData,
  FeeType,
  FeeTypeFormData,
  ActivityType,
  ActivityTypeFormData,
  Frequency,
  FrequencyFormData,
  School,
  SchoolFormData,
  SchoolYear,
  SchoolYearFormData,
  SchoolTerm,
  SchoolTermFormData,
  SchoolEnrolment,
  SchoolEnrolmentFormData,
  SchoolFee,
  SchoolFeeFormData,
  SchoolFeePaymentData,
  Extracurricular,
  ExtracurricularFormData,
  MemberDocument,
  MemberDocumentFormData,
} from '@/lib/types';

// ============================================
// Family Members CRUD
// ============================================

export async function getFamilyMembers(): Promise<FamilyMemberExtended[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('member_type')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as FamilyMemberExtended[];
}

export async function getFamilyMember(id: string): Promise<FamilyMemberExtended | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as FamilyMemberExtended;
}

export async function createFamilyMember(
  formData: FamilyMemberFormData
): Promise<FamilyMemberExtended> {
  const supabase = await createClient();

  // Clean up form data - convert empty strings to null for optional fields
  // No user_id required - app runs without authentication
  const cleanedData = {
    name: formData.name,
    member_type: formData.member_type,
    relationship: formData.relationship || null,
    gender: formData.gender || null,
    date_of_birth: formData.date_of_birth || null,
    email: formData.email || null,
    phone: formData.phone || null,
    medicare_number: formData.medicare_number || null,
    notes: formData.notes || null,
    is_primary: formData.is_primary ?? false,
  };

  const { data, error } = await supabase
    .from('family_members')
    .insert(cleanedData as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating family member:', error);
    throw new Error(error.message);
  }
  revalidatePath('/family-members');
  return data as unknown as FamilyMemberExtended;
}

export async function updateFamilyMember(
  id: string,
  formData: Partial<FamilyMemberFormData>
): Promise<FamilyMemberExtended> {
  const supabase = await createClient();

  // Clean up form data - convert empty strings to null for optional fields
  const cleanedData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.name !== undefined) cleanedData.name = formData.name;
  if (formData.member_type !== undefined) cleanedData.member_type = formData.member_type;
  if (formData.relationship !== undefined) cleanedData.relationship = formData.relationship || null;
  if (formData.gender !== undefined) cleanedData.gender = formData.gender || null;
  if (formData.date_of_birth !== undefined) cleanedData.date_of_birth = formData.date_of_birth || null;
  if (formData.email !== undefined) cleanedData.email = formData.email || null;
  if (formData.phone !== undefined) cleanedData.phone = formData.phone || null;
  if (formData.medicare_number !== undefined) cleanedData.medicare_number = formData.medicare_number || null;
  if (formData.notes !== undefined) cleanedData.notes = formData.notes || null;
  if (formData.is_primary !== undefined) cleanedData.is_primary = formData.is_primary;

  const { data, error } = await supabase
    .from('family_members')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating family member:', error);
    throw new Error(error.message);
  }
  revalidatePath('/family-members');
  revalidatePath(`/family-members/${id}`);
  return data as FamilyMemberExtended;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('family_members').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// Lookup Tables: Fee Types
// ============================================

export async function getFeeTypes(): Promise<FeeType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fee_types')
    .select('*')
    .order('sort_order')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as FeeType[];
}

export async function createFeeType(
  userId: string,
  formData: FeeTypeFormData
): Promise<FeeType> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fee_types')
    .insert({
      user_id: userId,
      ...formData,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FeeType;
}

export async function updateFeeType(
  id: string,
  formData: Partial<FeeTypeFormData>
): Promise<FeeType> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fee_types')
    .update(formData)
    .eq('id', id)
    .eq('is_system', false) // Can only update non-system types
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FeeType;
}

export async function deleteFeeType(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('fee_types')
    .delete()
    .eq('id', id)
    .eq('is_system', false); // Can only delete non-system types

  if (error) throw new Error(error.message);
}

// ============================================
// Lookup Tables: Activity Types
// ============================================

export async function getActivityTypes(): Promise<ActivityType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_types')
    .select('*')
    .order('sort_order')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as ActivityType[];
}

export async function createActivityType(
  userId: string,
  formData: ActivityTypeFormData
): Promise<ActivityType> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_types')
    .insert({
      user_id: userId,
      ...formData,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ActivityType;
}

export async function updateActivityType(
  id: string,
  formData: Partial<ActivityTypeFormData>
): Promise<ActivityType> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_types')
    .update(formData)
    .eq('id', id)
    .eq('is_system', false)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ActivityType;
}

export async function deleteActivityType(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('activity_types')
    .delete()
    .eq('id', id)
    .eq('is_system', false);

  if (error) throw new Error(error.message);
}

// ============================================
// Lookup Tables: Frequencies
// ============================================

export async function getFrequencies(): Promise<Frequency[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('frequencies')
    .select('*')
    .order('sort_order')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as Frequency[];
}

export async function createFrequency(
  userId: string,
  formData: FrequencyFormData
): Promise<Frequency> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('frequencies')
    .insert({
      user_id: userId,
      ...formData,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Frequency;
}

export async function updateFrequency(
  id: string,
  formData: Partial<FrequencyFormData>
): Promise<Frequency> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('frequencies')
    .update(formData)
    .eq('id', id)
    .eq('is_system', false)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Frequency;
}

export async function deleteFrequency(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('frequencies')
    .delete()
    .eq('id', id)
    .eq('is_system', false);

  if (error) throw new Error(error.message);
}

// ============================================
// Schools CRUD
// ============================================

export async function getSchools(): Promise<School[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as School[];
}

export async function getSchool(id: string): Promise<School | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select(`
      *,
      school_years (
        *,
        terms:school_terms (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as School;
}

export async function createSchool(
  formData: SchoolFormData
): Promise<School> {
  const supabase = await createClient();
  // No user_id required - app runs without authentication
  const { data, error } = await supabase
    .from('schools')
    .insert({
      ...formData,
      state: formData.state || 'QLD',
    } as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as School;
}

export async function updateSchool(
  id: string,
  formData: Partial<SchoolFormData>
): Promise<School> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as School;
}

export async function deleteSchool(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('schools').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// School Years CRUD
// ============================================

export async function getSchoolYears(schoolId: string): Promise<SchoolYear[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_years')
    .select(`
      *,
      terms:school_terms (*)
    `)
    .eq('school_id', schoolId)
    .order('year', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolYear[];
}

export async function createSchoolYear(formData: SchoolYearFormData): Promise<SchoolYear> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_years')
    .insert(formData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolYear;
}

export async function updateSchoolYear(
  id: string,
  formData: Partial<SchoolYearFormData>
): Promise<SchoolYear> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_years')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolYear;
}

export async function deleteSchoolYear(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('school_years').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// School Terms CRUD
// ============================================

export async function getSchoolTerms(schoolYearId: string): Promise<SchoolTerm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_terms')
    .select('*')
    .eq('school_year_id', schoolYearId)
    .order('term_number');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolTerm[];
}

export async function createSchoolTerm(formData: SchoolTermFormData): Promise<SchoolTerm> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_terms')
    .insert(formData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolTerm;
}

export async function createSchoolTermsBulk(
  terms: SchoolTermFormData[]
): Promise<SchoolTerm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_terms')
    .insert(terms)
    .select();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return (data || []) as unknown as SchoolTerm[];
}

export async function updateSchoolTerm(
  id: string,
  formData: Partial<SchoolTermFormData>
): Promise<SchoolTerm> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_terms')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolTerm;
}

export async function deleteSchoolTerm(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('school_terms').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// School Enrolments CRUD
// ============================================

export async function getEnrolmentsByMember(
  familyMemberId: string
): Promise<SchoolEnrolment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_enrolments')
    .select(`
      *,
      school:schools (*)
    `)
    .eq('family_member_id', familyMemberId)
    .order('is_current', { ascending: false })
    .order('enrolment_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolEnrolment[];
}

export async function getEnrolmentsBySchool(schoolId: string): Promise<SchoolEnrolment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_enrolments')
    .select(`
      *,
      family_member:family_members (*)
    `)
    .eq('school_id', schoolId)
    .order('is_current', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolEnrolment[];
}

export async function createEnrolment(
  formData: SchoolEnrolmentFormData
): Promise<SchoolEnrolment> {
  const supabase = await createClient();

  // Clean up form data - convert empty strings to null for optional fields
  const cleanedData = {
    family_member_id: formData.family_member_id,
    school_id: formData.school_id,
    year_level: formData.year_level || null,
    enrolment_date: formData.enrolment_date || null,
    expected_graduation: formData.expected_graduation || null,
    student_id: formData.student_id || null,
    house: formData.house || null,
    is_current: formData.is_current ?? true,
    notes: formData.notes || null,
  };

  const { data, error } = await supabase
    .from('school_enrolments')
    .insert(cleanedData)
    .select(`
      *,
      school:schools (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  revalidatePath(`/family-members/${formData.family_member_id}`);
  return data as unknown as SchoolEnrolment;
}

export async function updateEnrolment(
  id: string,
  formData: Partial<SchoolEnrolmentFormData>
): Promise<SchoolEnrolment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_enrolments')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      school:schools (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolEnrolment;
}

export async function deleteEnrolment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('school_enrolments').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// School Fees CRUD
// ============================================

export async function getFeesByEnrolment(enrolmentId: string): Promise<SchoolFee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_fees')
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*),
      school_term:school_terms (*)
    `)
    .eq('enrolment_id', enrolmentId)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolFee[];
}

export async function getFeesByYear(year: number): Promise<SchoolFee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_fees')
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*),
      school_term:school_terms (*),
      enrolment:school_enrolments (
        *,
        family_member:family_members (*),
        school:schools (*)
      )
    `)
    .eq('year', year)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolFee[];
}

export async function getUpcomingFees(days: number = 30): Promise<SchoolFee[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('school_fees')
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*),
      enrolment:school_enrolments (
        *,
        family_member:family_members (*),
        school:schools (*)
      )
    `)
    .eq('is_paid', false)
    .gte('due_date', today)
    .lte('due_date', futureDate)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolFee[];
}

export async function getOverdueFees(): Promise<SchoolFee[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('school_fees')
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*),
      enrolment:school_enrolments (
        *,
        family_member:family_members (*),
        school:schools (*)
      )
    `)
    .eq('is_paid', false)
    .lt('due_date', today)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SchoolFee[];
}

export async function createSchoolFee(formData: SchoolFeeFormData): Promise<SchoolFee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_fees')
    .insert({
      ...formData,
      year: formData.year || new Date().getFullYear(),
    })
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolFee;
}

export async function updateSchoolFee(
  id: string,
  formData: Partial<SchoolFeeFormData>
): Promise<SchoolFee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_fees')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolFee;
}

export async function markFeeAsPaid(
  id: string,
  paymentData: SchoolFeePaymentData
): Promise<SchoolFee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_fees')
    .update({
      ...paymentData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      fee_type:fee_types (*),
      frequency:frequencies (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as SchoolFee;
}

export async function deleteSchoolFee(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('school_fees').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// Extracurricular Activities CRUD
// ============================================

export async function getActivitiesByMember(
  familyMemberId: string
): Promise<Extracurricular[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('extracurriculars')
    .select(`
      *,
      activity_type:activity_types (*),
      cost_frequency:frequencies (*)
    `)
    .eq('family_member_id', familyMemberId)
    .order('is_active', { ascending: false })
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as Extracurricular[];
}

export async function getAllActiveActivities(): Promise<Extracurricular[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('extracurriculars')
    .select(`
      *,
      activity_type:activity_types (*),
      cost_frequency:frequencies (*),
      family_member:family_members (*)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as Extracurricular[];
}

export async function createExtracurricular(
  formData: ExtracurricularFormData
): Promise<Extracurricular> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('extracurriculars')
    .insert(formData)
    .select(`
      *,
      activity_type:activity_types (*),
      cost_frequency:frequencies (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  revalidatePath(`/family-members/${formData.family_member_id}`);
  return data as unknown as Extracurricular;
}

export async function updateExtracurricular(
  id: string,
  formData: Partial<ExtracurricularFormData>
): Promise<Extracurricular> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('extracurriculars')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      activity_type:activity_types (*),
      cost_frequency:frequencies (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  return data as unknown as Extracurricular;
}

export async function deleteExtracurricular(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('extracurriculars').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// Member Documents CRUD
// ============================================

export async function getMemberDocuments(
  familyMemberId: string
): Promise<MemberDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_documents')
    .select(`
      *,
      document:documents (*)
    `)
    .eq('family_member_id', familyMemberId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as MemberDocument[];
}

export async function linkDocumentToMember(
  formData: MemberDocumentFormData
): Promise<MemberDocument> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_documents')
    .insert(formData)
    .select(`
      *,
      document:documents (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
  revalidatePath(`/family-members/${formData.family_member_id}`);
  return data as unknown as MemberDocument;
}

export async function unlinkDocumentFromMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('member_documents').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/family-members');
}

// ============================================
// Summary & Aggregation Functions
// ============================================

export async function getFamilyMemberSummary(familyMemberId: string) {
  const supabase = await createClient();

  // Get member with enrolments and activities
  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', familyMemberId)
    .single();

  if (memberError) throw new Error(memberError.message);

  // Get current enrolment
  const { data: enrolments } = await supabase
    .from('school_enrolments')
    .select(`
      *,
      school:schools (*)
    `)
    .eq('family_member_id', familyMemberId)
    .eq('is_current', true)
    .limit(1);

  // Get fees for current year
  const currentYear = new Date().getFullYear();
  const { data: fees } = await supabase
    .from('school_fees')
    .select('amount, is_paid')
    .eq('year', currentYear)
    .in(
      'enrolment_id',
      (enrolments || []).map((e) => e.id)
    );

  // Get active activities with costs
  const { data: activities } = await supabase
    .from('extracurriculars')
    .select(`
      *,
      cost_frequency:frequencies (per_year_multiplier)
    `)
    .eq('family_member_id', familyMemberId)
    .eq('is_active', true);

  // Get document count
  const { count: documentCount } = await supabase
    .from('member_documents')
    .select('*', { count: 'exact', head: true })
    .eq('family_member_id', familyMemberId);

  // Calculate totals
  const totalSchoolFees = (fees || []).reduce((sum, f) => sum + Number(f.amount), 0);
  const unpaidFeesCount = (fees || []).filter((f) => !f.is_paid).length;

  const totalActivitiesCost = (activities as Array<{ cost_amount?: number | null; cost_frequency?: { per_year_multiplier?: number | null } | null; registration_fee?: number | null; equipment_cost?: number | null; uniform_cost?: number | null; other_costs?: number | null }> || []).reduce((sum, a) => {
    const multiplier = a.cost_frequency?.per_year_multiplier || 1;
    const recurring = (Number(a.cost_amount) || 0) * multiplier;
    const oneTime =
      (Number(a.registration_fee) || 0) +
      (Number(a.equipment_cost) || 0) +
      (Number(a.uniform_cost) || 0) +
      (Number(a.other_costs) || 0);
    return sum + recurring + oneTime;
  }, 0);

  // Calculate age
  let age: number | undefined;
  if (member.date_of_birth) {
    const dob = new Date(member.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
  }

  return {
    ...member,
    age,
    current_school: enrolments?.[0]?.school,
    current_year_level: enrolments?.[0]?.year_level,
    total_school_fees_year: totalSchoolFees,
    unpaid_fees_count: unpaidFeesCount,
    active_activities_count: (activities || []).length,
    total_activities_cost_year: totalActivitiesCost,
    document_count: documentCount || 0,
  };
}

export async function getFamilyFeesOverview(year?: number) {
  const supabase = await createClient();
  const currentYear = year || new Date().getFullYear();

  // Get all children
  const { data: children } = await supabase
    .from('family_members')
    .select('*')
    .eq('member_type', 'child');

  const overview = {
    total_school_fees: 0,
    total_paid: 0,
    total_remaining: 0,
    total_activities_cost: 0,
    by_child: [] as {
      family_member: FamilyMemberExtended;
      school_fees: number;
      paid_fees: number;
      activities_cost: number;
    }[],
  };

  for (const child of children || []) {
    // Get enrolments for child
    const { data: enrolments } = await supabase
      .from('school_enrolments')
      .select('id')
      .eq('family_member_id', child.id);

    const enrolmentIds = (enrolments || []).map((e) => e.id);

    // Get fees
    const { data: fees } = await supabase
      .from('school_fees')
      .select('amount, is_paid, paid_amount')
      .eq('year', currentYear)
      .in('enrolment_id', enrolmentIds);

    const schoolFees = (fees || []).reduce((sum, f) => sum + Number(f.amount), 0);
    const paidFees = (fees || [])
      .filter((f) => f.is_paid)
      .reduce((sum, f) => sum + (Number(f.paid_amount) || Number(f.amount)), 0);

    // Get activities cost
    const { data: activities } = await supabase
      .from('extracurriculars')
      .select(`
        *,
        cost_frequency:frequencies (per_year_multiplier)
      `)
      .eq('family_member_id', child.id)
      .eq('is_active', true);

    const activitiesCost = (activities as Array<{ cost_amount?: number | null; cost_frequency?: { per_year_multiplier?: number | null } | null; registration_fee?: number | null; equipment_cost?: number | null; uniform_cost?: number | null; other_costs?: number | null }> || []).reduce((sum, a) => {
      const multiplier = a.cost_frequency?.per_year_multiplier || 1;
      const recurring = (Number(a.cost_amount) || 0) * multiplier;
      const oneTime =
        (Number(a.registration_fee) || 0) +
        (Number(a.equipment_cost) || 0) +
        (Number(a.uniform_cost) || 0) +
        (Number(a.other_costs) || 0);
      return sum + recurring + oneTime;
    }, 0);

    overview.total_school_fees += schoolFees;
    overview.total_paid += paidFees;
    overview.total_activities_cost += activitiesCost;

    overview.by_child.push({
      family_member: child as FamilyMemberExtended,
      school_fees: schoolFees,
      paid_fees: paidFees,
      activities_cost: activitiesCost,
    });
  }

  overview.total_remaining = overview.total_school_fees - overview.total_paid;

  return overview;
}
