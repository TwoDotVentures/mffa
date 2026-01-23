# Tax Components

Components for tracking income, deductions, and super contributions for tax purposes.

## Components

### TaxDashboard
`tax-dashboard.tsx`

Main tax summary dashboard with totals and projections.

**Props:**
- `financialYear: string` - Current FY (e.g., "2024-25")
- `persons: Person[]` - Family members with tax data
- `income: Income[]` - All income records
- `deductions: Deduction[]` - All deduction records
- `superContributions: SuperContribution[]` - Super contribution records

**Features:**
- Summary cards for income, deductions, super
- Estimated tax payable
- Person-by-person breakdown

### PersonTabs
`person-tabs.tsx`

Tab navigation for switching between family members.

**Props:**
- `persons: Person[]` - Available persons
- `activePerson: string` - Currently selected person ID
- `onPersonChange: (personId: string) => void` - Selection callback

### IncomeList
`income-list.tsx`

List of income sources with totals.

**Props:**
- `income: Income[]` - Income records to display
- `onEdit: (income: Income) => void` - Edit callback
- `onDelete: (id: string) => void` - Delete callback

**Features:**
- Grouped by income type
- Year-to-date totals
- Edit and delete actions

### IncomeDialog
`income-dialog.tsx`

Dialog for adding/editing income records.

**Features:**
- Income type (Salary, Interest, Dividends, etc.)
- Amount and date
- Employer/source name
- Tax withheld

### AddIncomeButton
`add-income-button.tsx`

Button to open income creation dialog.

### DeductionList
`deduction-list.tsx`

List of tax deductions with totals.

**Props:**
- `deductions: Deduction[]` - Deduction records
- `onEdit: (deduction: Deduction) => void` - Edit callback
- `onDelete: (id: string) => void` - Delete callback

**Features:**
- Grouped by deduction type
- Year-to-date totals
- Linked document indicators

### DeductionDialog
`deduction-dialog.tsx`

Dialog for adding/editing deductions.

**Features:**
- Deduction type (Work Expenses, Home Office, etc.)
- Amount and date
- Description
- Receipt attachment

### AddDeductionButton
`add-deduction-button.tsx`

Button to open deduction creation dialog.

### WFHCalculator
`wfh-calculator.tsx`

Work from home deduction calculator using ATO methods.

**Features:**
- Fixed rate method (67c/hour)
- Actual cost method
- Hours worked tracking
- Automatic calculation

### SuperContributionList
`super-contribution-list.tsx`

List of super contributions with cap tracking.

**Props:**
- `contributions: SuperContribution[]` - Contribution records
- `caps: { concessional: number; nonConcessional: number }` - Current caps

### SuperDialog
`super-dialog.tsx`

Dialog for recording super contributions.

### AddSuperButton
`add-super-button.tsx`

Button to open super contribution dialog.

## Usage

```tsx
import { TaxDashboard } from '@/components/tax/tax-dashboard';

export function TaxPage({ financialYear, persons, income, deductions, super }) {
  return (
    <TaxDashboard
      financialYear={financialYear}
      persons={persons}
      income={income}
      deductions={deductions}
      superContributions={super}
    />
  );
}
```

## Related

- `/lib/income/actions.ts` - Income server actions
- `/lib/deductions/actions.ts` - Deduction server actions
- `/lib/super/actions.ts` - Super contribution server actions
- Australian FY runs July 1 - June 30
