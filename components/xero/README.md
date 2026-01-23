# Xero Components

Components for Xero accounting integration, including OAuth connection and transaction syncing.

## Components

### ConnectXeroButton
`connect-xero-button.tsx`

Button to initiate Xero OAuth connection flow.

**Props:**
- `variant?: 'default' | 'outline'` - Button variant
- `size?: 'default' | 'sm' | 'lg'` - Button size

**Features:**
- Initiates OAuth flow
- Loading state during redirect
- Error handling

### XeroConnectionCard
`xero-connection-card.tsx`

Card displaying Xero connection status and actions.

**Props:**
- `connection: XeroConnection` - The connection data

**Features:**
- Connection status indicator (Active, Expired, Error)
- Organisation name from Xero
- Last sync timestamp
- Account mapping count
- Sync now button
- Disconnect button
- Review accounts button

### ReviewXeroAccountsDialog
`review-xero-accounts-dialog.tsx`

Dialog for reviewing and mapping Xero bank accounts to local accounts.

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State change callback
- `connectionId: string` - The Xero connection ID
- `localAccounts: Account[]` - Available local accounts

**Features:**
- Lists all Xero bank accounts
- Shows match suggestions
- Link to existing account
- Create new account from Xero
- Auto-match based on name/number

### XeroAccountReviewRow
`xero-account-review-row.tsx`

Individual row in the account review dialog.

**Props:**
- `xeroAccount: XeroBankAccount` - The Xero account
- `comparison: XeroAccountComparisonResult` - Match result
- `localAccounts: Account[]` - For linking
- `onLink: (localAccountId: string) => void` - Link callback
- `onImport: () => void` - Import as new callback

**Features:**
- Xero account details
- Match confidence indicator
- Suggested local account
- Link/Import actions

## OAuth Flow

1. User clicks "Connect to Xero"
2. Redirected to Xero OAuth consent page
3. User authorises access
4. Xero redirects back with auth code
5. Backend exchanges code for tokens
6. Connection stored in database

## Usage

```tsx
import { ConnectXeroButton } from '@/components/xero/connect-xero-button';
import { XeroConnectionCard } from '@/components/xero/xero-connection-card';

export function BankConnectionsPage({ connections }) {
  return (
    <div>
      <ConnectXeroButton />
      {connections.map(conn => (
        <XeroConnectionCard key={conn.id} connection={conn} />
      ))}
    </div>
  );
}
```

## Account Mapping

Xero bank accounts are mapped to local MFFA accounts:
- Automatic matching by account name/number
- Manual linking via dialog
- New accounts can be created from Xero data

## Transaction Sync

- Syncs bank transactions from linked Xero accounts
- Deduplicates by external transaction ID
- Stores source reference for audit trail

## Related

- `/lib/xero/actions.ts` - Xero server actions
- `/lib/xero/client.ts` - Xero API client functions
- `/lib/xero/types.ts` - Xero type definitions
- `/lib/xero/matching.ts` - Account matching logic
