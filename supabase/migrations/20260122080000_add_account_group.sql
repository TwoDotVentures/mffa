-- Add account_group field to accounts table
-- Groups: 'family', 'trust', 'smsf'

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_group TEXT DEFAULT 'family';

-- Add check constraint to ensure valid values
ALTER TABLE accounts ADD CONSTRAINT accounts_group_check
  CHECK (account_group IN ('family', 'trust', 'smsf'));

-- Update existing accounts based on their names (optional initial assignment)
UPDATE accounts SET account_group = 'smsf' WHERE name ILIKE '%super%' OR name ILIKE '%smsf%';
UPDATE accounts SET account_group = 'trust' WHERE name ILIKE '%trust%';
-- Everything else stays as 'family' (the default)
