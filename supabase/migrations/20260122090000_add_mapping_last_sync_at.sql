-- Add last_sync_at column to xero_account_mappings for per-account sync tracking
ALTER TABLE xero_account_mappings
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN xero_account_mappings.last_sync_at IS 'Timestamp of the last successful sync for this specific account mapping';
