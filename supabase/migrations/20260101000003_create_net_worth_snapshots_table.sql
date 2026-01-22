-- Phase 7: Create net_worth_snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
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

  -- Breakdown by type (JSON for flexibility)
  asset_breakdown JSONB,
  liability_breakdown JSONB,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own snapshots"
  ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);

-- Unique constraint to prevent duplicate snapshots per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_net_worth_snapshots_unique ON net_worth_snapshots(user_id, snapshot_date);

-- Index for historical queries
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date ON net_worth_snapshots(user_id, snapshot_date DESC);
