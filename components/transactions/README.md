# Transactions Components

Components for managing financial transactions, including listing, filtering, bulk operations, and CSV import.

## Components

### TransactionsList
`transactions-list.tsx`

Main transactions table with filtering, sorting, selection, and bulk operations.

**Props:**
- `transactions: Transaction[]` - All transactions
- `accounts: Account[]` - For account filter dropdown
- `categories: Category[]` - For category filter dropdown

**Features:**
- Date range filtering with FY presets
- Account and category filters
- Multi-select with bulk operations
- Sortable columns
- Spending charts

### TransactionRow
`transaction-row.tsx`

Individual row in the transactions table with inline category editing.

**Props:**
- `transaction: Transaction` - The transaction to display
- `categories: Category[]` - Available categories
- `isSelected: boolean` - Selection state
- `onSelect: () => void` - Toggle selection callback
- `onClick: () => void` - Row click handler
- `showAccount: boolean` - Whether to show account column

### TransactionDialog
`transaction-dialog.tsx`

Modal for creating and editing individual transactions.

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State change callback
- `transaction?: Transaction` - For edit mode
- `accounts: Account[]` - Account options
- `categories: Category[]` - Category options
- `onSuccess?: () => void` - Success callback

### CSVImportDialog
`csv-import-dialog.tsx`

Dialog for importing transactions from CSV files (supports Westpac, ANZ, Commonwealth formats).

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State change callback
- `accounts: Account[]` - Target account options

### TransactionsPopup
`transactions-popup.tsx`

Compact popup view showing recent transactions with filtering.

**Props:**
- `transactions: Transaction[]` - Transactions to display
- `accounts: Account[]` - For filtering
- `categories: Category[]` - For filtering

### CategorisationRulesDialog
`categorisation-rules-dialog.tsx`

Manage automatic categorisation rules that apply to imported transactions.

### CreateRuleDialog
`create-rule-dialog.tsx`

Create categorisation rules from existing transactions.

### TopCategoriesChart
`top-categories-chart.tsx`

Bar chart showing spending by category.

### TopPayeesChart
`top-payees-chart.tsx`

Bar chart showing spending by payee.

### TransactionButtons
`transaction-buttons.tsx`

Action buttons for transaction operations (import, add, etc.).

## Usage

```tsx
import { TransactionsList } from '@/components/transactions/transactions-list';

export function TransactionsPage({ transactions, accounts, categories }) {
  return (
    <TransactionsList
      transactions={transactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
```

## Related Hooks

- `useTransactionFilters` - Filter state management
- `useTransactionSelection` - Selection state
- `useTransactionSorting` - Sort state
- `useBulkEdit` - Bulk operation dialogs

## Related Actions

- `/lib/transactions/actions.ts` - CRUD and bulk operations
