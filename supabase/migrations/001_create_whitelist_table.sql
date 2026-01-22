-- Create whitelist table for authorized users
CREATE TABLE IF NOT EXISTS public.whitelisted_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    added_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whitelisted_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading whitelist (for auth checks)
-- Using service role or authenticated users can read
CREATE POLICY "Allow read access to whitelist" ON public.whitelisted_users
    FOR SELECT
    USING (true);

-- Only service role can insert/update/delete (managed via dashboard or admin)
CREATE POLICY "Service role can manage whitelist" ON public.whitelisted_users
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create index for fast email lookups
CREATE INDEX idx_whitelisted_users_email ON public.whitelisted_users(email);

-- Insert initial whitelisted user
INSERT INTO public.whitelisted_users (email, name, added_by)
VALUES ('grant.e.moyle@gmail.com', 'Grant Moyle', 'system')
ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whitelisted_users_updated_at
    BEFORE UPDATE ON public.whitelisted_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
