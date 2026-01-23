-- Disable RLS on all public tables for single-family app
-- This app has no authentication, so RLS is not needed

ALTER TABLE IF EXISTS public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trust_distributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.smsf_contributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.smsf_investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.xero_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.xero_account_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.xero_sync_logs DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies on accounts table
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

-- Drop any existing RLS policies on transactions table
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
