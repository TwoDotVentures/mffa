# Trust Components

Components for managing family trusts, including income allocation and distribution modelling.

## Components

### TrustDashboard
`trust-dashboard.tsx`

Main trust management dashboard.

**Props:**
- `trust?: Trust` - The family trust data
- `beneficiaries?: Beneficiary[]` - Trust beneficiaries
- `income?: TrustIncome[]` - Trust income records
- `distributions?: Distribution[]` - Distribution records

**Features:**
- Trust setup for new users
- Income summary
- Distribution deadline tracking
- Beneficiary overview

### TrustSetupDialog
`trust-setup-dialog.tsx`

Dialog for initial trust setup.

**Features:**
- Trust name and ABN
- Trust type (Discretionary, Unit, Hybrid)
- Establishment date
- Trustee details

### BeneficiaryCards
`beneficiary-cards.tsx`

Grid of beneficiary cards showing allocation status.

**Props:**
- `beneficiaries: Beneficiary[]` - Trust beneficiaries
- `distributions: Distribution[]` - Current FY distributions

**Features:**
- Beneficiary name and relationship
- Current year allocation
- Tax bracket indicator
- Edit beneficiary action

### DistributionModeller
`distribution-modeller.tsx`

Interactive tool for modelling trust distributions.

**Features:**
- Drag-and-drop allocation
- Tax impact preview
- Optimal distribution suggestions
- EOFY deadline warning

### TrustIncomeList
`trust-income-list.tsx`

List of trust income sources.

**Props:**
- `income: TrustIncome[]` - Income records
- `onEdit: (income: TrustIncome) => void` - Edit callback
- `onDelete: (id: string) => void` - Delete callback

**Features:**
- Income type grouping
- Year-to-date totals
- Net and gross amounts

### TrustIncomeDialog
`trust-income-dialog.tsx`

Dialog for adding/editing trust income.

**Features:**
- Income type (Rental, Dividends, Interest, Capital Gains)
- Gross amount
- Expenses/deductions
- Date received

### AddIncomeButton
`add-income-button.tsx`

Button to open trust income dialog.

### DistributionList
`distribution-list.tsx`

List of distributions made to beneficiaries.

**Props:**
- `distributions: Distribution[]` - Distribution records
- `beneficiaries: Beneficiary[]` - For beneficiary lookup

**Features:**
- Beneficiary name
- Amount and date
- Distribution type
- Resolution reference

### DistributionDialog
`distribution-dialog.tsx`

Dialog for recording distributions.

**Features:**
- Beneficiary selection
- Amount
- Distribution date
- Income type allocation
- Resolution number

### AddDistributionButton
`add-distribution-button.tsx`

Button to open distribution dialog.

## Usage

```tsx
import { TrustDashboard } from '@/components/trust/trust-dashboard';

export function TrustPage({ trust, beneficiaries, income, distributions }) {
  return (
    <TrustDashboard
      trust={trust}
      beneficiaries={beneficiaries}
      income={income}
      distributions={distributions}
    />
  );
}
```

## Important Notes

- Trust distributions must be made by June 30 each year
- The distribution modeller helps optimise allocations based on beneficiary tax rates
- All trust income must be distributed (or taxed at highest marginal rate)

## Related

- `/lib/trust/actions.ts` - Trust server actions
- `/lib/trust/utils.ts` - Trust calculation utilities
