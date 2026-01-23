# Moyle Family Finance Application (MFFA)

A comprehensive personal finance management application built for the Moyle family. This Next.js application provides a unified dashboard for tracking accounts, transactions, budgets, taxes, SMSF (Self-Managed Super Fund), family trust, and family member expenses.

## Features

### Core Financial Management
- **Dashboard** - Overview of all financial data with summary cards and quick actions
- **Accounts** - Track bank accounts, credit cards, and investment accounts
- **Transactions** - View, categorize, and manage all transactions with bulk editing
- **Budgets** - Set spending limits and track progress with visual indicators
- **Net Worth** - Track overall financial position (in sidebar navigation)

### Tax & Superannuation
- **Tax Tracking** - Income, deductions, and tax estimates for Grant and Shannon
- **Super Contributions** - Track concessional and non-concessional contributions
- **WFH Calculator** - Calculate work from home deductions

### Entity Management
- **SMSF** - Self-Managed Super Fund dashboard with compliance tracking
- **Family Trust** - Trust income, distributions, and franking credits management
- **Distribution Modeller** - Plan and optimize trust distributions

### Family Features
- **Family Members** - Manage family profiles for adults and children
- **School Fees** - Track enrollment, fees, and fee schedules
- **Extracurricular Activities** - Manage activities, costs, and schedules
- **Documents** - Upload and organize financial documents with AI search

### Integrations
- **Xero Integration** - Sync transactions automatically from Xero
- **AI Chat** - AI-powered financial assistant for questions and insights

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom theme
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Vercel AI SDK with Anthropic, OpenAI, and Google support
- **Forms**: React Hook Form with Zod validation
- **Charts**: Custom implementations with Tailwind

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm, npm, or yarn
- Supabase account and project

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (choose one or more)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# Xero Integration (optional)
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
/app                    # Next.js App Router pages
  /accounts            # Account management
  /budgets             # Budget tracking
  /chat                # AI chat interface
  /dashboard           # Main dashboard
  /documents           # Document management
  /family-members      # Family member profiles
  /settings            # App configuration
  /smsf                # SMSF management
  /tax                 # Tax and super tracking
  /transactions        # Transaction management
  /trust               # Family trust management

/components            # React components
  /accounts            # Account-specific components
  /budgets             # Budget components
  /chat                # AI chat interface
  /dashboard           # Dashboard widgets
  /documents           # Document components
  /family-members      # Family member components
  /notifications       # Notification system
  /smsf                # SMSF components
  /tax                 # Tax tracking components
  /transactions        # Transaction components
  /trust               # Trust management components
  /ui                  # Reusable UI primitives

/hooks                 # Custom React hooks
  use-mobile.ts        # Mobile/responsive detection
  use-bulk-edit.ts     # Bulk transaction operations
  use-dialog.ts        # Dialog state management
  use-transaction-filters.ts   # Transaction filtering
  use-transaction-selection.ts # Multi-select handling
  use-transaction-sorting.ts   # Column sorting

/lib                   # Utility functions and server actions
  /accounts            # Account CRUD and balance calculations
  /ai                  # AI provider configuration
  /banking             # Banking utilities and parsers
  /budgets             # Budget CRUD and progress tracking
  /deductions          # Tax deduction management
  /documents           # Document upload and vector search
  /family-members      # Family member, school, fee actions
  /income              # Income tracking actions
  /notifications       # Notification CRUD and auto-reminders
  /smsf                # SMSF fund management
  /supabase            # Supabase client configuration
  /super               # Superannuation contribution tracking
  /transactions        # Transaction CRUD and categorisation
  /trust               # Trust income and distributions
  /xero                # Xero OAuth and sync integration
  constants.ts         # App-wide constants (locale, FY dates)
  utils.ts             # Utility functions (cn, formatCurrency)

/docs                  # Project documentation
/supabase              # Database migrations
/public                # Static assets
```

## Documentation

Each major component directory contains a README.md with:
- Component descriptions and props
- Usage examples
- Related files and actions

Key documentation files:
- `components/accounts/README.md` - Account management components
- `components/transactions/README.md` - Transaction handling
- `components/budgets/README.md` - Budget tracking
- `components/documents/README.md` - Document management
- `components/family-members/README.md` - Family and school management
- `components/smsf/README.md` - SMSF components
- `components/tax/README.md` - Tax tracking
- `components/trust/README.md` - Trust management
- `components/xero/README.md` - Xero integration
- `components/ui/README.md` - UI component library

## Design Principles

### Mobile-First Responsive Design
- All pages optimized for mobile devices (iPhone 17 Pro and similar)
- Touch-friendly targets (minimum 44px)
- Responsive grids: 1 column mobile, 2 columns tablet, 4 columns desktop
- Collapsible sections on mobile
- Safe area handling for notched devices

### Accessibility
- Proper ARIA labels throughout
- Keyboard navigation support
- Screen reader compatible
- Sufficient color contrast

### Performance
- Server components for data fetching
- Suspense boundaries with skeleton loaders
- Parallel data fetching where possible
- Optimized font loading with next/font

### Theming
- Light and dark mode support
- System preference detection
- Consistent color variables via CSS custom properties
- OKLCH color space for perceptually uniform colors

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |

## Database Schema

The application uses Supabase with the following main tables:
- `accounts` - Financial accounts
- `transactions` - Transaction records
- `categories` - Transaction categories
- `budgets` - Budget definitions
- `family_members` - Family profiles
- `school_enrolments` - School enrollment records
- `school_fees` - Fee tracking
- `extracurriculars` - Activity records
- `documents` - Document metadata
- `smsf_funds` - SMSF fund details
- `smsf_members` - SMSF member records
- `smsf_contributions` - Contribution tracking
- `smsf_investments` - Investment register
- `trusts` - Trust entities
- `trust_beneficiaries` - Beneficiary records
- `trust_income` - Trust income
- `trust_distributions` - Distribution records
- `income` - Personal income records
- `deductions` - Tax deductions
- `super_contributions` - Super contribution tracking
- `notifications` - User notifications
- `xero_connections` - Xero OAuth connections

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code patterns
3. Ensure all TypeScript types are correct
4. Test on mobile and desktop viewports
5. Run linting before committing
6. Create a pull request with a clear description

## Architecture Notes

- **Server Actions**: All database operations use Next.js server actions in `/lib/*/actions.ts`
- **Type Safety**: Comprehensive TypeScript types in `/lib/types.ts`
- **Form Handling**: React Hook Form with Zod validation schemas
- **State Management**: React state with server components for data
- **Notifications**: Real-time notification system with polling
- **Theming**: next-themes with CSS custom properties

## License

Private - Moyle Family Use Only
