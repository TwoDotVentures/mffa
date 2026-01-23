# Budgets Components

Components for creating and tracking spending budgets.

## Components

### BudgetDashboard
`budget-dashboard.tsx`

Overview dashboard showing all budgets with progress indicators and alerts.

**Props:**
- `budgets: Budget[]` - Array of budgets to display
- `categories: Category[]` - For creating new budgets

**Features:**
- Summary statistics (total budgeted, spent, remaining)
- Alert counts for over-budget items
- Grid of budget cards

### BudgetList
`budget-list.tsx`

List view of budgets with detailed progress information.

**Props:**
- `budgets: Budget[]` - Budgets to display
- `categories: Category[]` - Category options

### BudgetCard
`budget-card.tsx`

Individual budget card showing name, amount, and progress bar.

**Props:**
- `budget: Budget` - The budget to display
- `onEdit?: () => void` - Edit callback
- `onDelete?: () => void` - Delete callback

**Features:**
- Progress bar with color coding (green/yellow/red)
- Spent vs budgeted display
- Remaining amount
- Edit and delete actions

### BudgetDialog
`budget-dialog.tsx`

Modal dialog for creating and editing budgets.

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State change callback
- `budget?: Budget` - For edit mode
- `categories: Category[]` - Category options
- `onSuccess?: () => void` - Success callback

**Features:**
- Name and amount fields
- Period selection (weekly, fortnightly, monthly, quarterly, yearly)
- Category linking
- Alert threshold setting

### AddBudgetButton
`add-budget-button.tsx`

Button that opens budget creation dialog.

**Props:**
- `categories: Category[]` - Available categories

## Usage

```tsx
import { BudgetDashboard } from '@/components/budgets/budget-dashboard';

export function BudgetsPage({ budgets, categories }) {
  return (
    <BudgetDashboard
      budgets={budgets}
      categories={categories}
    />
  );
}
```

## Related

- `/lib/budgets/actions.ts` - Server actions for budget operations
- Budget progress is calculated based on linked category transactions
