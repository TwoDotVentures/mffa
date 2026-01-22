-- Phase 7: Create assets table for tracking all owned assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('property', 'vehicle', 'shares', 'managed_fund', 'crypto', 'collectibles', 'cash', 'other')),
  description TEXT,
  owner TEXT NOT NULL CHECK (owner IN ('Grant', 'Shannon', 'Joint', 'Trust', 'SMSF')),

  -- Valuation
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_valued_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- CGT tracking
  cost_base DECIMAL(15,2),
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

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own assets"
  ON assets FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_type ON assets(user_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(user_id, owner);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(user_id, is_active);
