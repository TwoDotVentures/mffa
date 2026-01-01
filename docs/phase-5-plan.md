# Phase 5: Family Trust Module - Implementation Plan

**Moyle Family Finance App | Version 1.0 | January 2026**

---

## Executive Summary

Phase 5 implements the **Family Trust Module** for the Moyle Family Trust. This module enables tracking of trust income (primarily dividends), franking credit management, distribution planning between Grant and Shannon, and compliance with the 30 June distribution deadline.

**Key References:**
- `docs/prd.md` Section 4.4 (Family Trust Module) - Feature requirements
- `docs/ai-accountant-feature.md` Section 4.2 - Database schema
- `docs/tasks.md` Phase 5 - Task checklist

**Checkpoint Criteria:**
> Trust dashboard live, can model distributions and track franking credits

---

## Phase 5.1: Trust Database Tables

Create 6 database tables via Supabase migrations with Row Level Security (RLS).

### 5.1.1 `trusts` Table

Primary table for trust entity details.

```sql
CREATE TABLE trusts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abn TEXT,
  trustee_name TEXT NOT NULL,
  trustee_abn TEXT,
  establishment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE trusts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own trusts" ON trusts
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trusts_updated_at
  BEFORE UPDATE ON trusts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Sample Data (Moyle Family Trust):**
```sql
INSERT INTO trusts (user_id, name, abn, trustee_name, trustee_abn)
VALUES (
  'USER_ID',
  'Moyle Family Trust',
  '12 345 678 901',
  'Moyle Australia Pty Ltd',
  '98 765 432 109'
);
```

---

### 5.1.2 `trust_beneficiaries` Table

Beneficiaries who can receive distributions.

```sql
CREATE TABLE trust_beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID NOT NULL REFERENCES trusts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beneficiary_type TEXT NOT NULL CHECK (beneficiary_type IN ('primary', 'secondary', 'contingent')),
  family_member_id UUID REFERENCES family_members(id),
  tfn_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy (via trust ownership)
ALTER TABLE trust_beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage beneficiaries of their trusts" ON trust_beneficiaries
  FOR ALL USING (
    trust_id IN (SELECT id FROM trusts WHERE user_id = auth.uid())
  );
```

**Sample Data:**
```sql
INSERT INTO trust_beneficiaries (trust_id, name, beneficiary_type)
VALUES
  ('TRUST_ID', 'Grant Moyle', 'primary'),
  ('TRUST_ID', 'Shannon Moyle', 'primary');
```

---

### 5.1.3 `trust_income` Table

Income received by the trust (dividends, interest, rent, capital gains).

```sql
CREATE TABLE trust_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID NOT NULL REFERENCES trusts(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  income_type TEXT NOT NULL CHECK (income_type IN ('dividend', 'interest', 'rent', 'capital_gain', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  franking_credits DECIMAL(12,2) DEFAULT 0,
  date DATE NOT NULL,
  financial_year TEXT NOT NULL, -- Format: '2024-25'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE trust_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage income of their trusts" ON trust_income
  FOR ALL USING (
    trust_id IN (SELECT id FROM trusts WHERE user_id = auth.uid())
  );

-- Index for financial year queries
CREATE INDEX idx_trust_income_fy ON trust_income(trust_id, financial_year);
```

**Note:** Franking credits calculated as:
- Max franking = dividend × (30/70) = 42.86% of cash dividend
- Fully franked dividend of $700 has $300 franking credits attached

---

### 5.1.4 `trust_distributions` Table

Distributions made to beneficiaries.

```sql
CREATE TABLE trust_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID NOT NULL REFERENCES trusts(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES trust_beneficiaries(id),
  amount DECIMAL(12,2) NOT NULL,
  franking_credits_streamed DECIMAL(12,2) DEFAULT 0,
  capital_gains_streamed DECIMAL(12,2) DEFAULT 0,
  distribution_type TEXT NOT NULL CHECK (distribution_type IN ('income', 'capital', 'mixed')),
  date DATE NOT NULL,
  financial_year TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE trust_distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage distributions of their trusts" ON trust_distributions
  FOR ALL USING (
    trust_id IN (SELECT id FROM trusts WHERE user_id = auth.uid())
  );

-- Index for beneficiary queries
CREATE INDEX idx_trust_distributions_beneficiary ON trust_distributions(beneficiary_id, financial_year);
```

---

### 5.1.5 `trust_investments` Table

Assets held by the trust.

```sql
CREATE TABLE trust_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID NOT NULL REFERENCES trusts(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('shares', 'etf', 'managed_fund', 'property', 'cash', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  units DECIMAL(12,6),
  cost_base DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  acquisition_date DATE,
  last_valued_date DATE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE trust_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage investments of their trusts" ON trust_investments
  FOR ALL USING (
    trust_id IN (SELECT id FROM trusts WHERE user_id = auth.uid())
  );
```

---

### 5.1.6 `franking_credits` Table

Running balance and streaming history for franking credits.

```sql
CREATE TABLE franking_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID NOT NULL REFERENCES trusts(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  credits_received DECIMAL(12,2) DEFAULT 0,
  credits_distributed DECIMAL(12,2) DEFAULT 0,
  closing_balance DECIMAL(12,2) GENERATED ALWAYS AS
    (opening_balance + credits_received - credits_distributed) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trust_id, financial_year)
);

-- RLS Policy
ALTER TABLE franking_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage franking credits of their trusts" ON franking_credits
  FOR ALL USING (
    trust_id IN (SELECT id FROM trusts WHERE user_id = auth.uid())
  );
```

---

## Phase 5.2: Trust TypeScript Types

Add to `/lib/types.ts`:

```typescript
// Trust Entity Types
export interface Trust {
  id: string;
  user_id: string;
  name: string;
  abn: string | null;
  trustee_name: string;
  trustee_abn: string | null;
  establishment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustBeneficiary {
  id: string;
  trust_id: string;
  name: string;
  beneficiary_type: 'primary' | 'secondary' | 'contingent';
  family_member_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustIncome {
  id: string;
  trust_id: string;
  source: string;
  income_type: 'dividend' | 'interest' | 'rent' | 'capital_gain' | 'other';
  amount: number;
  franking_credits: number;
  date: string;
  financial_year: string;
  notes: string | null;
  created_at: string;
}

export interface TrustDistribution {
  id: string;
  trust_id: string;
  beneficiary_id: string;
  beneficiary?: TrustBeneficiary;
  amount: number;
  franking_credits_streamed: number;
  capital_gains_streamed: number;
  distribution_type: 'income' | 'capital' | 'mixed';
  date: string;
  financial_year: string;
  is_paid: boolean;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface TrustInvestment {
  id: string;
  trust_id: string;
  asset_type: 'shares' | 'etf' | 'managed_fund' | 'property' | 'cash' | 'other';
  name: string;
  description: string | null;
  units: number | null;
  cost_base: number;
  current_value: number;
  acquisition_date: string | null;
  last_valued_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrankingCredits {
  id: string;
  trust_id: string;
  financial_year: string;
  opening_balance: number;
  credits_received: number;
  credits_distributed: number;
  closing_balance: number;
  created_at: string;
  updated_at: string;
}

// Form Data Types
export interface TrustFormData {
  name: string;
  abn?: string;
  trustee_name: string;
  trustee_abn?: string;
  establishment_date?: string;
}

export interface TrustIncomeFormData {
  source: string;
  income_type: TrustIncome['income_type'];
  amount: number;
  franking_credits: number;
  date: string;
  notes?: string;
}

export interface TrustDistributionFormData {
  beneficiary_id: string;
  amount: number;
  franking_credits_streamed: number;
  distribution_type: TrustDistribution['distribution_type'];
  date: string;
  notes?: string;
}

// Distribution Modelling
export interface DistributionScenario {
  grant_percentage: number;
  shannon_percentage: number;
  grant_amount: number;
  shannon_amount: number;
  grant_franking: number;
  shannon_franking: number;
  grant_tax_estimate: number;
  shannon_tax_estimate: number;
  total_tax: number;
}

export interface TrustSummary {
  trust: Trust;
  income_ytd: number;
  franking_credits_ytd: number;
  distributions_ytd: number;
  distributable_amount: number;
  days_until_eofy: number;
  beneficiaries: TrustBeneficiary[];
}
```

---

## Phase 5.3: Trust Server Actions

Create `/lib/trust/actions.ts`:

### Core Functions

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Trust, TrustBeneficiary, TrustIncome, TrustDistribution,
  TrustInvestment, FrankingCredits, TrustSummary, DistributionScenario,
  TrustFormData, TrustIncomeFormData, TrustDistributionFormData
} from '@/lib/types';

// Utility: Get current financial year (July-June)
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
}

// Utility: Days until 30 June
export function getDaysUntilEOFY(): number {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const eofy = new Date(year, 5, 30); // June 30
  return Math.ceil((eofy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
```

### CRUD Operations

```typescript
// Get trust details with beneficiaries
export async function getTrust(): Promise<Trust | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('trusts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching trust:', error);
    return null;
  }
  return data;
}

// Get trust beneficiaries
export async function getTrustBeneficiaries(trustId: string): Promise<TrustBeneficiary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trust_beneficiaries')
    .select('*')
    .eq('trust_id', trustId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching beneficiaries:', error);
    return [];
  }
  return data || [];
}

// Get trust income for financial year
export async function getTrustIncome(
  trustId: string,
  financialYear?: string
): Promise<TrustIncome[]> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  const { data, error } = await supabase
    .from('trust_income')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', fy)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching trust income:', error);
    return [];
  }
  return data || [];
}

// Get distributions for financial year
export async function getTrustDistributions(
  trustId: string,
  financialYear?: string,
  beneficiaryId?: string
): Promise<TrustDistribution[]> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  let query = supabase
    .from('trust_distributions')
    .select('*, beneficiary:trust_beneficiaries(*)')
    .eq('trust_id', trustId)
    .eq('financial_year', fy);

  if (beneficiaryId) {
    query = query.eq('beneficiary_id', beneficiaryId);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Error fetching distributions:', error);
    return [];
  }
  return data || [];
}

// Get franking credits balance
export async function getFrankingCredits(
  trustId: string,
  financialYear?: string
): Promise<FrankingCredits | null> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  const { data, error } = await supabase
    .from('franking_credits')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', fy)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching franking credits:', error);
  }
  return data;
}

// Get trust investments
export async function getTrustInvestments(trustId: string): Promise<TrustInvestment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trust_investments')
    .select('*')
    .eq('trust_id', trustId)
    .order('current_value', { ascending: false });

  if (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
  return data || [];
}
```

### Summary & Calculations

```typescript
// Get complete trust summary
export async function getTrustSummary(): Promise<TrustSummary | null> {
  const trust = await getTrust();
  if (!trust) return null;

  const fy = getCurrentFinancialYear();
  const [income, distributions, beneficiaries, frankingCredits] = await Promise.all([
    getTrustIncome(trust.id, fy),
    getTrustDistributions(trust.id, fy),
    getTrustBeneficiaries(trust.id),
    getFrankingCredits(trust.id, fy),
  ]);

  const income_ytd = income.reduce((sum, i) => sum + i.amount, 0);
  const franking_credits_ytd = income.reduce((sum, i) => sum + i.franking_credits, 0);
  const distributions_ytd = distributions.reduce((sum, d) => sum + d.amount, 0);

  return {
    trust,
    income_ytd,
    franking_credits_ytd,
    distributions_ytd,
    distributable_amount: income_ytd - distributions_ytd,
    days_until_eofy: getDaysUntilEOFY(),
    beneficiaries,
  };
}

// Calculate tax for a distribution scenario
function calculateTax(taxableIncome: number): number {
  // 2024-25 Australian tax brackets
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return (taxableIncome - 18200) * 0.16;
  if (taxableIncome <= 135000) return 4288 + (taxableIncome - 45000) * 0.30;
  if (taxableIncome <= 190000) return 31288 + (taxableIncome - 135000) * 0.37;
  return 51638 + (taxableIncome - 190000) * 0.45;
}

// Model distribution scenarios
export async function modelDistribution(
  distributableAmount: number,
  frankingCredits: number,
  grantOtherIncome: number,
  shannonOtherIncome: number,
  scenarios: { grant: number; shannon: number }[]
): Promise<DistributionScenario[]> {
  return scenarios.map(({ grant, shannon }) => {
    const grantAmount = distributableAmount * (grant / 100);
    const shannonAmount = distributableAmount * (shannon / 100);

    // Proportional franking (can be streamed differently in reality)
    const grantFranking = frankingCredits * (grant / 100);
    const shannonFranking = frankingCredits * (shannon / 100);

    // Gross up income for tax calculation (include franking credits)
    const grantTaxable = grantOtherIncome + grantAmount + grantFranking;
    const shannonTaxable = shannonOtherIncome + shannonAmount + shannonFranking;

    // Calculate tax then apply franking credit offset
    const grantTax = Math.max(0, calculateTax(grantTaxable) - grantFranking);
    const shannonTax = Math.max(0, calculateTax(shannonTaxable) - shannonFranking);

    return {
      grant_percentage: grant,
      shannon_percentage: shannon,
      grant_amount: grantAmount,
      shannon_amount: shannonAmount,
      grant_franking: grantFranking,
      shannon_franking: shannonFranking,
      grant_tax_estimate: grantTax,
      shannon_tax_estimate: shannonTax,
      total_tax: grantTax + shannonTax,
    };
  });
}
```

### Create/Update Operations

```typescript
// Create trust (initial setup)
export async function createTrust(formData: TrustFormData): Promise<{ success: boolean; error?: string; data?: Trust }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('trusts')
    .insert([{ ...formData, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating trust:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/trust');
  return { success: true, data };
}

// Add trust income (dividend, etc.)
export async function addTrustIncome(
  trustId: string,
  formData: TrustIncomeFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const fy = getCurrentFinancialYear();

  const { error: incomeError } = await supabase
    .from('trust_income')
    .insert([{ ...formData, trust_id: trustId, financial_year: fy }]);

  if (incomeError) {
    console.error('Error adding income:', incomeError);
    return { success: false, error: incomeError.message };
  }

  // Update franking credits balance
  if (formData.franking_credits > 0) {
    await updateFrankingCredits(trustId, fy, formData.franking_credits, 0);
  }

  revalidatePath('/trust');
  return { success: true };
}

// Record distribution
export async function addTrustDistribution(
  trustId: string,
  formData: TrustDistributionFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const fy = getCurrentFinancialYear();

  const { error } = await supabase
    .from('trust_distributions')
    .insert([{ ...formData, trust_id: trustId, financial_year: fy }]);

  if (error) {
    console.error('Error adding distribution:', error);
    return { success: false, error: error.message };
  }

  // Update franking credits if streamed
  if (formData.franking_credits_streamed > 0) {
    await updateFrankingCredits(trustId, fy, 0, formData.franking_credits_streamed);
  }

  revalidatePath('/trust');
  return { success: true };
}

// Update franking credits balance
async function updateFrankingCredits(
  trustId: string,
  financialYear: string,
  creditsReceived: number,
  creditsDistributed: number
): Promise<void> {
  const supabase = await createClient();

  // Upsert franking credits record
  const { data: existing } = await supabase
    .from('franking_credits')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', financialYear)
    .single();

  if (existing) {
    await supabase
      .from('franking_credits')
      .update({
        credits_received: existing.credits_received + creditsReceived,
        credits_distributed: existing.credits_distributed + creditsDistributed,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('franking_credits')
      .insert([{
        trust_id: trustId,
        financial_year: financialYear,
        opening_balance: 0,
        credits_received: creditsReceived,
        credits_distributed: creditsDistributed,
      }]);
  }
}
```

---

## Phase 5.4: Trust UI Components

### Component Structure

```
/components/trust/
├── trust-dashboard.tsx       # Summary cards + EOFY countdown
├── trust-income-list.tsx     # Income transactions table
├── trust-income-dialog.tsx   # Add income form
├── distribution-modeller.tsx # Scenario comparison
├── distribution-list.tsx     # Distribution history
├── distribution-dialog.tsx   # Record distribution form
├── beneficiary-cards.tsx     # G & S summary cards
├── franking-helper.tsx       # Franking credit visualisation
└── trust-setup-dialog.tsx    # Initial trust configuration
```

### Key Component: Trust Dashboard

```tsx
// /components/trust/trust-dashboard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import type { TrustSummary } from '@/lib/types';

interface TrustDashboardProps {
  summary: TrustSummary;
}

export function TrustDashboard({ summary }: TrustDashboardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  const isUrgent = summary.days_until_eofy <= 30;
  const isWarning = summary.days_until_eofy <= 60 && summary.days_until_eofy > 30;

  return (
    <div className="space-y-6">
      {/* EOFY Warning */}
      {(isUrgent || isWarning) && summary.distributable_amount > 0 && (
        <Alert variant={isUrgent ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Distribution Deadline Approaching</AlertTitle>
          <AlertDescription>
            {summary.days_until_eofy} days until 30 June.
            {formatCurrency(summary.distributable_amount)} must be distributed to beneficiaries.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.income_ytd)}</div>
            <p className="text-xs text-muted-foreground">
              Financial Year {summary.trust.financial_year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franking Credits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.franking_credits_ytd)}</div>
            <p className="text-xs text-muted-foreground">Available for streaming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.distributable_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              After {formatCurrency(summary.distributions_ytd)} distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EOFY Countdown</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'}>
                {summary.days_until_eofy} days
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Until 30 June</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Key Component: Distribution Modeller

```tsx
// /components/trust/distribution-modeller.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { modelDistribution } from '@/lib/trust/actions';
import type { DistributionScenario } from '@/lib/types';

interface DistributionModellerProps {
  distributableAmount: number;
  frankingCredits: number;
}

const PRESET_SPLITS = [
  { grant: 50, shannon: 50 },
  { grant: 60, shannon: 40 },
  { grant: 70, shannon: 30 },
  { grant: 40, shannon: 60 },
  { grant: 100, shannon: 0 },
  { grant: 0, shannon: 100 },
];

export function DistributionModeller({ distributableAmount, frankingCredits }: DistributionModellerProps) {
  const [grantOtherIncome, setGrantOtherIncome] = useState(100000);
  const [shannonOtherIncome, setShannonOtherIncome] = useState(50000);
  const [scenarios, setScenarios] = useState<DistributionScenario[]>([]);
  const [selectedSplit, setSelectedSplit] = useState({ grant: 50, shannon: 50 });

  useEffect(() => {
    const fetchScenarios = async () => {
      const results = await modelDistribution(
        distributableAmount,
        frankingCredits,
        grantOtherIncome,
        shannonOtherIncome,
        PRESET_SPLITS
      );
      setScenarios(results);
    };
    fetchScenarios();
  }, [distributableAmount, frankingCredits, grantOtherIncome, shannonOtherIncome]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  const bestScenario = scenarios.length > 0
    ? scenarios.reduce((best, s) => s.total_tax < best.total_tax ? s : best)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Modeller</CardTitle>
        <CardDescription>
          Compare different distribution splits between Grant and Shannon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Other Income Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Grant's Other Income (excl. trust)</Label>
            <Input
              type="number"
              value={grantOtherIncome}
              onChange={(e) => setGrantOtherIncome(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Shannon's Other Income (excl. trust)</Label>
            <Input
              type="number"
              value={shannonOtherIncome}
              onChange={(e) => setShannonOtherIncome(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Scenario Comparison Table */}
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Split</th>
                <th className="p-3 text-right">Grant Receives</th>
                <th className="p-3 text-right">Shannon Receives</th>
                <th className="p-3 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr
                  key={i}
                  className={`border-t ${bestScenario?.grant_percentage === s.grant_percentage ? 'bg-green-50 dark:bg-green-950' : ''}`}
                >
                  <td className="p-3">
                    {s.grant_percentage}/{s.shannon_percentage}
                    {bestScenario?.grant_percentage === s.grant_percentage && (
                      <Badge className="ml-2" variant="secondary">Optimal</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">{formatCurrency(s.grant_amount)}</td>
                  <td className="p-3 text-right">{formatCurrency(s.shannon_amount)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(s.total_tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        {bestScenario && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p className="font-medium text-green-800 dark:text-green-200">
              Recommended: {bestScenario.grant_percentage}/{bestScenario.shannon_percentage} split
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Saves {formatCurrency(scenarios[0].total_tax - bestScenario.total_tax)} in tax compared to 50/50
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 5.5: Trust Page Implementation

Update `/app/trust/page.tsx`:

```tsx
import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { TrustDashboard } from '@/components/trust/trust-dashboard';
import { TrustIncomeList } from '@/components/trust/trust-income-list';
import { DistributionModeller } from '@/components/trust/distribution-modeller';
import { DistributionList } from '@/components/trust/distribution-list';
import { BeneficiaryCards } from '@/components/trust/beneficiary-cards';
import { AddIncomeButton } from '@/components/trust/add-income-button';
import { AddDistributionButton } from '@/components/trust/add-distribution-button';
import { TrustSetupDialog } from '@/components/trust/trust-setup-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTrustSummary, getTrustIncome, getTrustDistributions } from '@/lib/trust/actions';

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const summary = await getTrustSummary();

  // If no trust exists, show setup
  if (!summary) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Family Trust"
          description="Set up your family trust to start tracking income and distributions"
        />
        <TrustSetupDialog />
      </div>
    );
  }

  const [income, distributions] = await Promise.all([
    getTrustIncome(summary.trust.id),
    getTrustDistributions(summary.trust.id),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={summary.trust.name}
        description={`Trustee: ${summary.trust.trustee_name}`}
      />

      {/* Dashboard Summary */}
      <TrustDashboard summary={summary} />

      {/* Beneficiary Summary */}
      <BeneficiaryCards
        beneficiaries={summary.beneficiaries}
        distributions={distributions}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="income" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="modeller">Distribution Modeller</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <AddIncomeButton trustId={summary.trust.id} />
            <AddDistributionButton
              trustId={summary.trust.id}
              beneficiaries={summary.beneficiaries}
              maxAmount={summary.distributable_amount}
            />
          </div>
        </div>

        <TabsContent value="income">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TrustIncomeList income={income} />
          </Suspense>
        </TabsContent>

        <TabsContent value="distributions">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <DistributionList distributions={distributions} />
          </Suspense>
        </TabsContent>

        <TabsContent value="modeller">
          <DistributionModeller
            distributableAmount={summary.distributable_amount}
            frankingCredits={summary.franking_credits_ytd}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Phase 5.6: AI Tools Update

Update trust tools in `/lib/ai/tools.ts`:

```typescript
// Replace placeholder implementations with real data queries

export const getTrustSummaryTool = tool({
  description: 'Get Family Trust summary including income YTD, distributable amount, and franking credits',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format 2024-25'),
  }),
  execute: async ({ financial_year }) => {
    const summary = await getTrustSummary();
    if (!summary) {
      return { error: 'No trust found. Please set up the trust first.' };
    }
    return {
      trust_name: summary.trust.name,
      trustee: summary.trust.trustee_name,
      income_ytd: summary.income_ytd,
      franking_credits_available: summary.franking_credits_ytd,
      distributions_ytd: summary.distributions_ytd,
      distributable_amount: summary.distributable_amount,
      days_until_eofy: summary.days_until_eofy,
      beneficiaries: summary.beneficiaries.map(b => b.name),
    };
  },
});

export const getTrustIncomeTool = tool({
  description: 'Get trust income (dividends, interest, etc.) with franking credits',
  inputSchema: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    income_type: z.enum(['dividend', 'interest', 'rent', 'capital_gain', 'other']).optional(),
  }),
  execute: async ({ date_from, date_to, income_type }) => {
    const trust = await getTrust();
    if (!trust) return { error: 'No trust found' };

    const income = await getTrustIncome(trust.id);
    let filtered = income;

    if (date_from) filtered = filtered.filter(i => i.date >= date_from);
    if (date_to) filtered = filtered.filter(i => i.date <= date_to);
    if (income_type) filtered = filtered.filter(i => i.income_type === income_type);

    return {
      total_income: filtered.reduce((sum, i) => sum + i.amount, 0),
      total_franking: filtered.reduce((sum, i) => sum + i.franking_credits, 0),
      items: filtered.map(i => ({
        date: i.date,
        source: i.source,
        type: i.income_type,
        amount: i.amount,
        franking_credits: i.franking_credits,
      })),
    };
  },
});

export const getTrustDistributionsTool = tool({
  description: 'Get trust distribution history by beneficiary',
  inputSchema: z.object({
    financial_year: z.string().optional(),
    beneficiary_name: z.string().optional(),
  }),
  execute: async ({ financial_year, beneficiary_name }) => {
    const trust = await getTrust();
    if (!trust) return { error: 'No trust found' };

    const distributions = await getTrustDistributions(trust.id, financial_year);
    let filtered = distributions;

    if (beneficiary_name) {
      filtered = filtered.filter(d =>
        d.beneficiary?.name.toLowerCase().includes(beneficiary_name.toLowerCase())
      );
    }

    return {
      total_distributed: filtered.reduce((sum, d) => sum + d.amount, 0),
      total_franking_streamed: filtered.reduce((sum, d) => sum + d.franking_credits_streamed, 0),
      by_beneficiary: Object.groupBy(filtered, d => d.beneficiary?.name || 'Unknown'),
    };
  },
});

export const getFrankingCreditsTool = tool({
  description: 'Get franking credit balance and streaming options',
  inputSchema: z.object({
    financial_year: z.string().optional(),
  }),
  execute: async ({ financial_year }) => {
    const trust = await getTrust();
    if (!trust) return { error: 'No trust found' };

    const franking = await getFrankingCredits(trust.id, financial_year);

    return franking || {
      opening_balance: 0,
      credits_received: 0,
      credits_distributed: 0,
      closing_balance: 0,
      note: 'No franking credits recorded this financial year',
    };
  },
});

export const calculateDistributionTool = tool({
  description: 'Model distribution scenarios between Grant and Shannon to minimise tax',
  inputSchema: z.object({
    grant_other_income: z.number().describe('Grant\'s taxable income excluding trust distribution'),
    shannon_other_income: z.number().describe('Shannon\'s taxable income excluding trust distribution'),
  }),
  execute: async ({ grant_other_income, shannon_other_income }) => {
    const summary = await getTrustSummary();
    if (!summary) return { error: 'No trust found' };

    const scenarios = await modelDistribution(
      summary.distributable_amount,
      summary.franking_credits_ytd,
      grant_other_income,
      shannon_other_income,
      [
        { grant: 50, shannon: 50 },
        { grant: 60, shannon: 40 },
        { grant: 70, shannon: 30 },
        { grant: 100, shannon: 0 },
        { grant: 0, shannon: 100 },
      ]
    );

    const optimal = scenarios.reduce((best, s) => s.total_tax < best.total_tax ? s : best);

    return {
      distributable_amount: summary.distributable_amount,
      franking_credits: summary.franking_credits_ytd,
      scenarios,
      recommendation: {
        split: `${optimal.grant_percentage}/${optimal.shannon_percentage}`,
        grant_receives: optimal.grant_amount,
        shannon_receives: optimal.shannon_amount,
        total_tax: optimal.total_tax,
        tax_savings_vs_50_50: scenarios[0].total_tax - optimal.total_tax,
      },
    };
  },
});
```

---

## Implementation Sequence

### Step 1: Database (30 mins)
1. Run SQL migrations via Supabase MCP or dashboard
2. Verify RLS policies are active
3. Seed initial trust data (Moyle Family Trust, G & S beneficiaries)

### Step 2: Types & Actions (45 mins)
1. Add Trust types to `/lib/types.ts`
2. Create `/lib/trust/actions.ts` with all server actions
3. Test with basic queries

### Step 3: UI Components (2 hours)
1. Create component files in `/components/trust/`
2. Build TrustDashboard with summary cards
3. Build DistributionModeller with scenario comparison
4. Build income and distribution lists with dialogs
5. Build BeneficiaryCards for G & S overview

### Step 4: Page Integration (30 mins)
1. Update `/app/trust/page.tsx` with real implementation
2. Add loading states with Suspense
3. Test all CRUD operations

### Step 5: AI Tools (30 mins)
1. Update trust tools in `/lib/ai/tools.ts`
2. Test with AI chat queries
3. Verify data is returned correctly

### Step 6: Testing & Polish (30 mins)
1. Verify EOFY countdown works correctly
2. Test distribution modeller calculations
3. Confirm franking credit streaming updates balances
4. Check responsive design on mobile

---

## Checkpoint Verification

**Phase 5 is complete when:**

- [ ] Trust dashboard shows real income YTD and distributable amount
- [ ] Can add dividend income with franking credits
- [ ] Distribution modeller shows tax comparison for different splits
- [ ] Can record distributions to Grant and Shannon
- [ ] Franking credit balance updates automatically
- [ ] 30 June deadline countdown displays correctly
- [ ] AI can answer trust questions with real data

---

*Generated: 1 January 2026*
