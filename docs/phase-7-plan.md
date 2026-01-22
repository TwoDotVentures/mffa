# Phase 7: Assets & Net Worth - Implementation Plan

## Overview

Phase 7 adds a comprehensive assets and liabilities register with net worth tracking across all entities (Personal, SMSF, Trust). This enables consolidated financial position reporting and CGT cost base tracking.

---

## 1. Database Schema

### 1.1 Assets Table

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'property' | 'vehicle' | 'shares' | 'managed_fund' | 'crypto' | 'collectibles' | 'cash' | 'other'
  description TEXT,
  owner TEXT NOT NULL, -- 'Grant' | 'Shannon' | 'Joint' | 'Trust' | 'SMSF'

  -- Valuation
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_valued_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- CGT tracking
  cost_base DECIMAL(15,2), -- Original cost + improvements + acquisition costs
  improvement_costs DECIMAL(15,2) DEFAULT 0,

  -- Property-specific
  address TEXT,
  is_primary_residence BOOLEAN DEFAULT FALSE,

  -- Investment-specific
  units DECIMAL(15,6),
  ticker_symbol TEXT,

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own assets"
  ON assets FOR ALL USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_assets_user_type ON assets(user_id, asset_type);
CREATE INDEX idx_assets_owner ON assets(user_id, owner);
```

### 1.2 Liabilities Table

```sql
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  liability_type TEXT NOT NULL, -- 'mortgage' | 'car_loan' | 'personal_loan' | 'credit_card' | 'hecs' | 'margin_loan' | 'other'
  description TEXT,
  owner TEXT NOT NULL, -- 'Grant' | 'Shannon' | 'Joint'

  -- Loan details
  original_amount DECIMAL(15,2),
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5,4), -- e.g., 0.0650 for 6.50%

  -- Payment details
  minimum_payment DECIMAL(15,2),
  payment_frequency TEXT, -- 'weekly' | 'fortnightly' | 'monthly'
  next_payment_date DATE,

  -- Term
  start_date DATE,
  end_date DATE, -- Maturity date for loans

  -- Links
  linked_account_id UUID REFERENCES accounts(id),
  linked_asset_id UUID REFERENCES assets(id), -- e.g., link mortgage to property

  -- HECS specific
  hecs_balance DECIMAL(15,2),
  hecs_repayment_threshold DECIMAL(15,2) DEFAULT 54435, -- 2024-25 threshold

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own liabilities"
  ON liabilities FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_liabilities_user_type ON liabilities(user_id, liability_type);
CREATE INDEX idx_liabilities_owner ON liabilities(user_id, owner);
```

### 1.3 Net Worth Snapshots Table (Historical Tracking)

```sql
CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  snapshot_date DATE NOT NULL,

  -- Personal position
  personal_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
  personal_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0,
  personal_net_worth DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Entity positions
  smsf_balance DECIMAL(15,2) DEFAULT 0,
  trust_assets DECIMAL(15,2) DEFAULT 0,

  -- Consolidated
  consolidated_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
  consolidated_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0,
  consolidated_net_worth DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Breakdown by asset type (JSON for flexibility)
  asset_breakdown JSONB,
  liability_breakdown JSONB,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own snapshots"
  ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);

-- Unique constraint to prevent duplicate snapshots per day
CREATE UNIQUE INDEX idx_net_worth_snapshots_unique ON net_worth_snapshots(user_id, snapshot_date);

-- Index for historical queries
CREATE INDEX idx_net_worth_snapshots_date ON net_worth_snapshots(user_id, snapshot_date DESC);
```

---

## 2. TypeScript Types

Add to `lib/types.ts`:

```typescript
// ============================================
// Assets & Liabilities Types (Phase 7)
// ============================================

export type AssetType = 'property' | 'vehicle' | 'shares' | 'managed_fund' | 'crypto' | 'collectibles' | 'cash' | 'other';
export type LiabilityType = 'mortgage' | 'car_loan' | 'personal_loan' | 'credit_card' | 'hecs' | 'margin_loan' | 'other';
export type OwnerType = 'Grant' | 'Shannon' | 'Joint' | 'Trust' | 'SMSF';
export type PaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_type: AssetType;
  description: string | null;
  owner: OwnerType;
  purchase_price: number | null;
  purchase_date: string | null;
  current_value: number;
  last_valued_date: string;
  cost_base: number | null;
  improvement_costs: number;
  address: string | null;
  is_primary_residence: boolean;
  units: number | null;
  ticker_symbol: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  liability_type: LiabilityType;
  description: string | null;
  owner: OwnerType;
  original_amount: number | null;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  payment_frequency: PaymentFrequency | null;
  next_payment_date: string | null;
  start_date: string | null;
  end_date: string | null;
  linked_account_id: string | null;
  linked_asset_id: string | null;
  hecs_balance: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  linked_account?: Account;
  linked_asset?: Asset;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  personal_assets: number;
  personal_liabilities: number;
  personal_net_worth: number;
  smsf_balance: number;
  trust_assets: number;
  consolidated_assets: number;
  consolidated_liabilities: number;
  consolidated_net_worth: number;
  asset_breakdown: Record<string, number> | null;
  liability_breakdown: Record<string, number> | null;
  notes: string | null;
  created_at: string;
}

// Form Data Types
export interface AssetFormData {
  name: string;
  asset_type: AssetType;
  description?: string;
  owner: OwnerType;
  purchase_price?: number;
  purchase_date?: string;
  current_value: number;
  cost_base?: number;
  improvement_costs?: number;
  address?: string;
  is_primary_residence?: boolean;
  units?: number;
  ticker_symbol?: string;
  notes?: string;
}

export interface LiabilityFormData {
  name: string;
  liability_type: LiabilityType;
  description?: string;
  owner: OwnerType;
  original_amount?: number;
  current_balance: number;
  interest_rate?: number;
  minimum_payment?: number;
  payment_frequency?: PaymentFrequency;
  next_payment_date?: string;
  start_date?: string;
  end_date?: string;
  linked_account_id?: string;
  linked_asset_id?: string;
  notes?: string;
}

export interface AssetUpdateData {
  current_value: number;
  last_valued_date?: string;
  notes?: string;
}

// Net Worth Summary
export interface NetWorthSummary {
  // Personal
  personal: {
    assets: number;
    liabilities: number;
    netWorth: number;
    byAssetType: Record<AssetType, number>;
    byLiabilityType: Record<LiabilityType, number>;
    byOwner: Record<OwnerType, { assets: number; liabilities: number }>;
  };
  // SMSF (optional - from SMSF module)
  smsf?: {
    balance: number;
    note?: string;
  };
  // Trust (optional - from Trust module)
  trust?: {
    assets: number;
    note?: string;
  };
  // Consolidated
  consolidated: {
    assets: number;
    liabilities: number;
    netWorth: number;
  };
  // Historical
  previousMonth?: NetWorthSnapshot;
  monthlyChange?: number;
  monthlyChangePercent?: number;
}
```

---

## 3. Server Actions (`lib/assets/actions.ts`)

### Core Functions

```typescript
// Asset CRUD
- getAssets(filters?: AssetFilters): Promise<Asset[]>
- getAsset(id: string): Promise<Asset | null>
- createAsset(data: AssetFormData): Promise<{ success: boolean; data?: Asset; error?: string }>
- updateAsset(id: string, data: Partial<AssetFormData>): Promise<{ success: boolean; error?: string }>
- updateAssetValue(id: string, data: AssetUpdateData): Promise<{ success: boolean; error?: string }>
- deleteAsset(id: string): Promise<{ success: boolean; error?: string }>

// Liability CRUD
- getLiabilities(filters?: LiabilityFilters): Promise<Liability[]>
- getLiability(id: string): Promise<Liability | null>
- createLiability(data: LiabilityFormData): Promise<{ success: boolean; data?: Liability; error?: string }>
- updateLiability(id: string, data: Partial<LiabilityFormData>): Promise<{ success: boolean; error?: string }>
- deleteLiability(id: string): Promise<{ success: boolean; error?: string }>

// Net Worth
- getNetWorthSummary(includeSmsf?: boolean, includeTrust?: boolean): Promise<NetWorthSummary>
- getNetWorthHistory(months?: number): Promise<NetWorthSnapshot[]>
- createNetWorthSnapshot(): Promise<{ success: boolean; error?: string }>

// CGT Calculations
- calculateUnrealisedGain(assetId: string): Promise<{ gain: number; eligible50Discount: boolean }>
```

---

## 4. UI Components

### 4.1 Asset Components (`components/assets/`)

| Component | Description |
|-----------|-------------|
| `asset-dashboard.tsx` | Summary cards for total assets by type |
| `asset-list.tsx` | Sortable/filterable asset table |
| `asset-dialog.tsx` | Add/edit asset form dialog |
| `asset-card.tsx` | Individual asset summary card |
| `asset-value-update.tsx` | Quick update asset value dialog |
| `add-asset-button.tsx` | Button to open asset dialog |

### 4.2 Liability Components (`components/liabilities/`)

| Component | Description |
|-----------|-------------|
| `liability-dashboard.tsx` | Summary cards for total debt |
| `liability-list.tsx` | Sortable/filterable liability table |
| `liability-dialog.tsx` | Add/edit liability form dialog |
| `liability-card.tsx` | Individual liability card with progress |
| `add-liability-button.tsx` | Button to open liability dialog |

### 4.3 Net Worth Components (`components/net-worth/`)

| Component | Description |
|-----------|-------------|
| `net-worth-dashboard.tsx` | Main consolidated view |
| `net-worth-chart.tsx` | Historical line chart |
| `asset-allocation-chart.tsx` | Pie chart by asset type |
| `entity-breakdown.tsx` | Personal vs SMSF vs Trust |
| `net-worth-summary-cards.tsx` | Quick stats cards |
| `month-over-month.tsx` | Change indicators |

---

## 5. Pages

### 5.1 `/net-worth` (Main Page)

```tsx
- PageHeader: "Net Worth"
- NetWorthDashboard (consolidated summary)
- NetWorthChart (historical trend)
- EntityBreakdown (Personal | SMSF | Trust tabs)
- AssetAllocationChart
```

### 5.2 Updates to Existing Pages

- **Sidebar**: Add "Net Worth" link with TrendingUp icon
- **Dashboard**: Add net worth summary widget
- **Accounts**: Link credit cards to liabilities

---

## 6. AI Tools (Update `lib/ai/tools.ts`)

### New/Updated Tools

```typescript
// Already exists, needs enhancement:
get_assets: Update to query from assets table instead of accounts
get_liabilities: Update to query from liabilities table
get_net_worth: Enhance with proper asset/liability breakdown

// New tool:
get_net_worth_history: Get historical snapshots for trend analysis
```

---

## 7. Implementation Order

1. **Database Tables** (Supabase migrations)
   - assets table with RLS
   - liabilities table with RLS
   - net_worth_snapshots table with RLS

2. **TypeScript Types**
   - Add all types to lib/types.ts

3. **Server Actions**
   - Create lib/assets/actions.ts
   - Create lib/assets/utils.ts

4. **UI Components**
   - Asset management components
   - Liability management components
   - Net worth dashboard components

5. **Pages**
   - Create /net-worth page
   - Update sidebar navigation

6. **AI Tools**
   - Update existing tools
   - Add new tools

7. **Testing & Verification**
   - Build verification
   - Manual testing

---

## 8. Checkpoint Criteria

> **CHECKPOINT:** Full net worth view across all entities

- [ ] Asset register with property, vehicles, investments, collectibles
- [ ] Manual valuation updates working
- [ ] CGT cost base tracking
- [ ] Liability register with mortgages, loans, credit cards, HECS
- [ ] Link liabilities to accounts
- [ ] Personal net worth calculator
- [ ] Consolidated view (Personal + SMSF + Trust)
- [ ] Historical tracking with charts
- [ ] SMSF assets noted as locked until preservation

---

*Plan created: January 2026*
