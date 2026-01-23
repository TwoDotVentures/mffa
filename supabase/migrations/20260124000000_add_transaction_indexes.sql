-- Migration: Add indexes for transactions table performance optimization
-- This migration adds indexes to improve query performance for:
-- - Date-based filtering and sorting (most common query pattern)
-- - Category filtering and joins
-- - Account filtering
-- - Text search on payee/description

-- Index for date-based queries (most common filter/sort)
CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(date DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category_id);

-- Index for account filtering
CREATE INDEX IF NOT EXISTS idx_transactions_account
ON transactions(account_id);

-- Composite index for common query pattern: date + category
CREATE INDEX IF NOT EXISTS idx_transactions_date_category
ON transactions(date DESC, category_id);

-- Composite index for pagination with date sorting
CREATE INDEX IF NOT EXISTS idx_transactions_date_created
ON transactions(date DESC, created_at DESC);

-- Index for uncategorised transactions (common filter)
CREATE INDEX IF NOT EXISTS idx_transactions_uncategorised
ON transactions(category_id) WHERE category_id IS NULL;

-- Enable trigram extension if not exists (for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for text search on payee and description
CREATE INDEX IF NOT EXISTS idx_transactions_payee_trgm
ON transactions USING gin(payee gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_transactions_description_trgm
ON transactions USING gin(description gin_trgm_ops);

-- Add comment for documentation
COMMENT ON INDEX idx_transactions_date IS 'Optimizes date-based sorting and filtering';
COMMENT ON INDEX idx_transactions_category IS 'Optimizes category filtering and joins';
COMMENT ON INDEX idx_transactions_account IS 'Optimizes account filtering';
COMMENT ON INDEX idx_transactions_date_category IS 'Optimizes combined date and category queries';
COMMENT ON INDEX idx_transactions_date_created IS 'Optimizes pagination with date sorting';
COMMENT ON INDEX idx_transactions_uncategorised IS 'Optimizes queries for uncategorised transactions';
COMMENT ON INDEX idx_transactions_payee_trgm IS 'Optimizes text search on payee field';
COMMENT ON INDEX idx_transactions_description_trgm IS 'Optimizes text search on description field';
