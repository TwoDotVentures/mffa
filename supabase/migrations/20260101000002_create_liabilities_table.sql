-- Phase 7: Create liabilities table for tracking all debts
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  liability_type TEXT NOT NULL CHECK (liability_type IN ('mortgage', 'car_loan', 'personal_loan', 'credit_card', 'hecs', 'margin_loan', 'other')),
  description TEXT,
  owner TEXT NOT NULL CHECK (owner IN ('Grant', 'Shannon', 'Joint')),

  -- Loan details
  original_amount DECIMAL(15,2),
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5,4),

  -- Payment details
  minimum_payment DECIMAL(15,2),
  payment_frequency TEXT CHECK (payment_frequency IS NULL OR payment_frequency IN ('weekly', 'fortnightly', 'monthly')),
  next_payment_date DATE,

  -- Term
  start_date DATE,
  end_date DATE,

  -- Links
  linked_account_id UUID REFERENCES accounts(id),
  linked_asset_id UUID REFERENCES assets(id),

  -- HECS specific
  hecs_balance DECIMAL(15,2),
  hecs_repayment_threshold DECIMAL(15,2) DEFAULT 54435,

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own liabilities"
  ON liabilities FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_liabilities_user_type ON liabilities(user_id, liability_type);
CREATE INDEX IF NOT EXISTS idx_liabilities_owner ON liabilities(user_id, owner);
CREATE INDEX IF NOT EXISTS idx_liabilities_active ON liabilities(user_id, is_active);
