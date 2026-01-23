# SMSF Components

Components for managing Self-Managed Super Funds (SMSF).

## Components

### SMSFDashboard
`smsf-dashboard.tsx`

Main dashboard showing fund overview, members, contributions, and investments.

**Props:**
- `fund?: SMSFFund` - The SMSF fund data
- `members?: SMSFMember[]` - Fund members
- `investments?: SMSFInvestment[]` - Fund investments
- `contributions?: SuperContribution[]` - Member contributions

**Features:**
- Fund setup wizard for new users
- Member list with balances
- Investment register
- Contribution tracker
- Compliance checklist

### EmptySmsfState
`empty-smsf-state.tsx`

Empty state shown when no SMSF has been set up.

### FundSetupDialog
`fund-setup-dialog.tsx`

Wizard dialog for initial SMSF setup.

**Features:**
- Fund name and ABN
- Corporate trustee details
- Fund establishment date
- Auditor information

### MemberDialog
`member-dialog.tsx`

Dialog for adding/editing fund members.

**Features:**
- Member name and TFN
- Member type (Individual/Corporate)
- Joining date
- Member balance

### ContributionTracker
`contribution-tracker.tsx`

Displays contribution caps and usage for each member.

**Features:**
- Concessional and non-concessional contributions
- Cap progress bars
- Carry-forward amounts
- Member-by-member breakdown

### ContributionDialog
`contribution-dialog.tsx`

Dialog for recording super contributions.

**Features:**
- Amount and date
- Contribution type (Concessional/Non-concessional)
- Source (Employer/Personal/Other)
- Member allocation

### InvestmentRegister
`investment-register.tsx`

List of fund investments with current values.

**Features:**
- Investment categories (Shares, Property, Cash, etc.)
- Purchase price and current value
- Unrealised gains/losses

### InvestmentDialog
`investment-dialog.tsx`

Dialog for adding/editing investments.

**Features:**
- Investment name and type
- Purchase date and price
- Current market value
- Notes

### ComplianceChecklist
`compliance-checklist.tsx`

Annual compliance checklist for SMSF requirements.

**Features:**
- Investment strategy review
- Member statements
- Audit preparation
- ATO reporting
- Insurance requirements

## Usage

```tsx
import { SMSFDashboard } from '@/components/smsf/smsf-dashboard';

export function SMSFPage({ fund, members, investments, contributions }) {
  return (
    <SMSFDashboard
      fund={fund}
      members={members}
      investments={investments}
      contributions={contributions}
    />
  );
}
```

## Related

- `/lib/smsf/actions.ts` - Server actions for SMSF operations
- SMSF contribution caps are Australian FY based (July-June)
