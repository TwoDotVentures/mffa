# Family Members Components

Components for managing family members, schools, enrolments, fees, and extracurricular activities.

## Components

### Core Components

#### FamilyMembersList / FamilyMemberList
`family-members-list.tsx`, `family-member-list.tsx`

Grid display of family members with quick stats.

#### FamilyMemberCard
`family-member-card.tsx`

Card showing member info with age, school, and activity summary.

#### FamilyMemberDialog
`family-member-dialog.tsx`

Dialog for creating/editing family members (name, DOB, contact info, etc.).

#### AddFamilyMemberButton
`add-family-member-button.tsx`

Button to open the family member creation dialog.

#### EmptyFamilyState
`empty-family-state.tsx`

Empty state shown when no family members exist.

### Member Detail Components

#### MemberDetailClient / MemberDetailHeader
`member-detail-client.tsx`, `member-detail-header.tsx`

Detailed view of a single family member with tabs for different sections.

### School Components

#### SchoolSection
`school-section.tsx`

Section showing current school enrolment and history.

#### SchoolDialog
`school-dialog.tsx`

Dialog for adding/editing schools.

#### SchoolYearDialog
`school-year-dialog.tsx`

Dialog for managing school years.

#### SchoolTermsEditor
`school-terms-editor.tsx`

Editor for configuring term dates within a school year.

#### EnrolmentDialog
`enrolment-dialog.tsx`

Dialog for enrolling a child in a school.

### Fee Components

#### SchoolFeesList
`school-fees-list.tsx`

List of school fees with payment status.

#### SchoolFeeDialog
`school-fee-dialog.tsx`

Dialog for adding/editing school fees.

#### SchoolFeesSummary
`school-fees-summary.tsx`

Summary card showing fee totals and payment progress.

#### FeeCalendar
`fee-calendar.tsx`

Calendar view of upcoming fee due dates.

### Extracurricular Components

#### ExtracurricularList
`extracurricular-list.tsx`

List of activities for a family member.

#### ExtracurricularDialog
`extracurricular-dialog.tsx`

Dialog for adding/editing activities.

#### ExtracurricularSummary
`extracurricular-summary.tsx`

Summary showing total activity costs.

#### ActivitySchedule
`activity-schedule.tsx`

Weekly schedule view of activities.

### Lookup Table Managers

#### FeeTypesManager
`fee-types-manager.tsx`

Manage fee type definitions (Tuition, Building Levy, etc.).

#### ActivityTypesManager
`activity-types-manager.tsx`

Manage activity type definitions (Sport, Music, Art, etc.).

#### FrequenciesManager
`frequencies-manager.tsx`

Manage payment/activity frequencies (Weekly, Monthly, Per Term, etc.).

### Document Components

#### MemberDocuments
`member-documents.tsx`

List of documents linked to a family member.

#### MemberDocumentUpload
`member-document-upload.tsx`

Upload and link documents to a family member.

## Usage

```tsx
import { FamilyMembersList } from '@/components/family-members/family-members-list';
import { AddFamilyMemberButton } from '@/components/family-members/add-family-member-button';

export function FamilyMembersPage({ members }) {
  return (
    <div>
      <AddFamilyMemberButton />
      <FamilyMembersList members={members} />
    </div>
  );
}
```

## Data Model

- Family Members can be adults or children
- Children can be enrolled in Schools
- Schools have Years with Terms
- Enrolments have associated Fees
- Members can have Extracurricular activities
- Documents can be linked to any member

## Related

- `/lib/family-members/actions.ts` - Server actions for all family member operations
