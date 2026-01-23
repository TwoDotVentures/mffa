# Accounts Components

Components for managing financial accounts in the MFFA application.

## Components

### AccountDialog
`account-dialog.tsx`

Modal dialog for creating and editing accounts. Handles form state and submission.

**Props:**
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Callback when dialog state changes
- `account?: Account` - Optional account for edit mode
- `onSuccess?: () => void` - Callback after successful save

### AccountsList
`accounts-list.tsx`

Displays a list of accounts with calculated balances, Xero sync status, and action buttons.

**Props:**
- `accounts: Account[]` - Array of accounts to display

**Features:**
- Shows current and calculated balances
- Xero connection status indicators
- Sync transactions action
- Edit and delete actions

### AddAccountButton
`add-account-button.tsx`

Button that opens the account creation dialog.

**Props:**
- None (self-contained with dialog state)

## Usage

```tsx
import { AccountsList } from '@/components/accounts/accounts-list';
import { AddAccountButton } from '@/components/accounts/add-account-button';

export function AccountsPage({ accounts }) {
  return (
    <div>
      <AddAccountButton />
      <AccountsList accounts={accounts} />
    </div>
  );
}
```

## Related

- `/lib/accounts/actions.ts` - Server actions for account operations
- `/lib/xero/actions.ts` - Xero integration for syncing
