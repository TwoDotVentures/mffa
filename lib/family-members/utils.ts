import type {
  FamilyMemberExtended,
  Extracurricular,
  Frequency,
  SchoolTerm,
} from '@/lib/types';

// ============================================
// Age Calculations
// ============================================

export function calculateAge(dateOfBirth: string | null | undefined): number | undefined {
  if (!dateOfBirth) return undefined;

  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function formatAge(dateOfBirth: string | null | undefined): string {
  const age = calculateAge(dateOfBirth);
  if (age === undefined) return '';
  return `${age} years old`;
}

// ============================================
// Year Level Calculations
// ============================================

const YEAR_LEVEL_ORDER = [
  'Prep',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
];

export function getNextYearLevel(currentLevel: string | undefined): string | undefined {
  if (!currentLevel) return undefined;
  const currentIndex = YEAR_LEVEL_ORDER.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex >= YEAR_LEVEL_ORDER.length - 1) {
    return undefined;
  }
  return YEAR_LEVEL_ORDER[currentIndex + 1];
}

export function estimateYearLevel(dateOfBirth: string | null | undefined): string | undefined {
  const age = calculateAge(dateOfBirth);
  if (age === undefined) return undefined;

  // Australian school age mapping (approximate, based on turning age during school year)
  // Child starts Prep in year they turn 5
  if (age < 5) return undefined;
  if (age === 5) return 'Prep';
  if (age === 6) return 'Year 1';
  if (age === 7) return 'Year 2';
  if (age === 8) return 'Year 3';
  if (age === 9) return 'Year 4';
  if (age === 10) return 'Year 5';
  if (age === 11) return 'Year 6';
  if (age === 12) return 'Year 7';
  if (age === 13) return 'Year 8';
  if (age === 14) return 'Year 9';
  if (age === 15) return 'Year 10';
  if (age === 16) return 'Year 11';
  if (age === 17) return 'Year 12';
  return undefined; // Beyond school age
}

// ============================================
// Annual Cost Calculations
// ============================================

export function calculateAnnualCost(
  amount: number | null | undefined,
  frequency: Frequency | null | undefined
): number {
  if (!amount || amount <= 0) return 0;
  if (!frequency?.per_year_multiplier) return amount; // Treat as once-off
  return amount * frequency.per_year_multiplier;
}

export function calculateActivityAnnualCost(activity: Extracurricular): number {
  // Recurring costs
  const recurringCost = calculateAnnualCost(
    activity.cost_amount,
    activity.cost_frequency as Frequency | undefined
  );

  // One-time costs (spread across the year)
  const oneTimeCosts =
    (Number(activity.registration_fee) || 0) +
    (Number(activity.equipment_cost) || 0) +
    (Number(activity.uniform_cost) || 0) +
    (Number(activity.other_costs) || 0);

  return recurringCost + oneTimeCosts;
}

export function calculateTotalActivitiesCost(activities: Extracurricular[]): number {
  return activities.reduce((total, activity) => {
    return total + calculateActivityAnnualCost(activity);
  }, 0);
}

// ============================================
// Term Date Helpers
// ============================================

export function getCurrentTerm(terms: SchoolTerm[]): SchoolTerm | undefined {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return terms.find((term) => {
    return term.start_date <= todayStr && term.end_date >= todayStr;
  });
}

export function getNextTerm(terms: SchoolTerm[]): SchoolTerm | undefined {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const futureTerms = terms
    .filter((term) => term.start_date > todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return futureTerms[0];
}

export function formatTermDates(term: SchoolTerm): string {
  const start = new Date(term.start_date);
  const end = new Date(term.end_date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };

  return `${start.toLocaleDateString('en-AU', formatOptions)} - ${end.toLocaleDateString('en-AU', formatOptions)}`;
}

export function daysUntilFeesDue(term: SchoolTerm): number | undefined {
  if (!term.fees_due_date) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(term.fees_due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// ============================================
// Formatting Helpers
// ============================================

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function formatDate(
  dateStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  return date.toLocaleDateString('en-AU', options || defaultOptions);
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';

  // timeStr is in HH:mm:ss format
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes}${ampm}`;
}

export function formatDaysOfWeek(days: string[] | null | undefined): string {
  if (!days || days.length === 0) return '';

  // Abbreviate day names
  const abbreviations: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };

  return days.map((day) => abbreviations[day] || day).join(', ');
}

export function formatMemberType(member: FamilyMemberExtended): string {
  if (member.member_type === 'adult') {
    if (member.relationship === 'self') return 'Primary';
    if (member.relationship === 'spouse') return 'Spouse';
    return 'Adult';
  }
  return 'Child';
}

export function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// Fee Status Helpers
// ============================================

export function getFeeStatus(
  dueDate: string | null | undefined,
  isPaid: boolean
): 'paid' | 'upcoming' | 'due' | 'overdue' | 'no-date' {
  if (isPaid) return 'paid';
  if (!dueDate) return 'no-date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'due';
  return 'upcoming';
}

export function getFeeStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-50';
    case 'overdue':
      return 'text-red-600 bg-red-50';
    case 'due':
      return 'text-amber-600 bg-amber-50';
    case 'upcoming':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getFeeStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'due':
      return 'Due Soon';
    case 'upcoming':
      return 'Upcoming';
    default:
      return 'Pending';
  }
}

// ============================================
// Sort/Filter Helpers
// ============================================

export function sortMembersByType(members: FamilyMemberExtended[]): FamilyMemberExtended[] {
  return [...members].sort((a, b) => {
    // Primary adults first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;

    // Then other adults
    if (a.member_type === 'adult' && b.member_type === 'child') return -1;
    if (a.member_type === 'child' && b.member_type === 'adult') return 1;

    // Then by name
    return a.name.localeCompare(b.name);
  });
}

export function filterActiveActivities(activities: Extracurricular[]): Extracurricular[] {
  return activities.filter((a) => a.is_active);
}

export function groupActivitiesByDay(
  activities: Extracurricular[]
): Record<string, Extracurricular[]> {
  const grouped: Record<string, Extracurricular[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  activities.forEach((activity) => {
    if (activity.day_of_week) {
      activity.day_of_week.forEach((day) => {
        if (grouped[day]) {
          grouped[day].push(activity);
        }
      });
    }
  });

  return grouped;
}

// ============================================
// Validation Helpers
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Australian phone number validation (simplified)
  const phoneRegex = /^(\+61|0)[2-478](\d{8}|\d{4}\s?\d{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function isValidPostcode(postcode: string): boolean {
  // Australian postcode validation
  const postcodeRegex = /^[0-9]{4}$/;
  return postcodeRegex.test(postcode);
}
