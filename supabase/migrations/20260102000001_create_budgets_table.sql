-- Phase 8.1: Budgets Table
-- Monthly/annual category spending limits with progress tracking

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Budget definition
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT, -- Fallback if category deleted

  -- Amount & period
  amount DECIMAL(12,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly')),

  -- Tracking
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means ongoing

  -- Alert settings
  alert_threshold INTEGER DEFAULT 80, -- Alert at 80% of budget
  alert_enabled BOOLEAN DEFAULT true,

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX idx_budgets_category ON budgets(category_id);

-- Trigger for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE budgets IS 'Category spending limits with alert thresholds - Phase 8.1';
