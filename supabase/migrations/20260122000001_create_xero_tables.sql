-- Create xero_connections table to store OAuth tokens and connection status
CREATE TABLE IF NOT EXISTS xero_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- OAuth tokens (encrypted in transit)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Xero organization details
    tenant_id TEXT NOT NULL,
    tenant_name TEXT,
    tenant_type TEXT, -- 'ORGANISATION' or 'PRACTICE'

    -- Connection status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'disconnected', 'error'
    status_message TEXT,

    -- Sync settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'manual'
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only have one connection per tenant
    UNIQUE(user_id, tenant_id)
);

-- Create xero_sync_logs table to track sync history
CREATE TABLE IF NOT EXISTS xero_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES xero_connections(id) ON DELETE CASCADE,

    -- Sync details
    sync_type TEXT NOT NULL, -- 'manual', 'scheduled', 'initial'
    status TEXT NOT NULL, -- 'started', 'completed', 'failed', 'partial'

    -- Results
    accounts_synced INTEGER DEFAULT 0,
    transactions_imported INTEGER DEFAULT 0,
    transactions_skipped INTEGER DEFAULT 0,
    transactions_updated INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Error handling
    error_code TEXT,
    error_message TEXT,

    -- API usage tracking
    api_calls_used INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create xero_account_mappings to link Xero accounts to MFFA accounts
CREATE TABLE IF NOT EXISTS xero_account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES xero_connections(id) ON DELETE CASCADE,

    -- Xero account details
    xero_account_id TEXT NOT NULL,
    xero_account_name TEXT,
    xero_account_code TEXT,
    xero_account_type TEXT, -- 'BANK', 'CREDITCARD', etc.

    -- Link to MFFA account (optional - user can map later)
    local_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

    -- Sync settings per account
    is_sync_enabled BOOLEAN DEFAULT true,
    last_transaction_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each Xero account can only be mapped once per connection
    UNIQUE(connection_id, xero_account_id)
);

-- Enable RLS
ALTER TABLE xero_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_account_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xero_connections
CREATE POLICY "Users can view their own Xero connections"
    ON xero_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Xero connections"
    ON xero_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Xero connections"
    ON xero_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Xero connections"
    ON xero_connections FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for xero_sync_logs
CREATE POLICY "Users can view their own sync logs"
    ON xero_sync_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_sync_logs.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own sync logs"
    ON xero_sync_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_sync_logs.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

-- RLS Policies for xero_account_mappings
CREATE POLICY "Users can view their own account mappings"
    ON xero_account_mappings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_account_mappings.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own account mappings"
    ON xero_account_mappings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_account_mappings.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own account mappings"
    ON xero_account_mappings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_account_mappings.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own account mappings"
    ON xero_account_mappings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM xero_connections
            WHERE xero_connections.id = xero_account_mappings.connection_id
            AND xero_connections.user_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX idx_xero_connections_user_id ON xero_connections(user_id);
CREATE INDEX idx_xero_connections_status ON xero_connections(status);
CREATE INDEX idx_xero_sync_logs_connection_id ON xero_sync_logs(connection_id);
CREATE INDEX idx_xero_sync_logs_started_at ON xero_sync_logs(started_at DESC);
CREATE INDEX idx_xero_account_mappings_connection_id ON xero_account_mappings(connection_id);
CREATE INDEX idx_xero_account_mappings_local_account ON xero_account_mappings(local_account_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_xero_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_xero_connections_updated_at
    BEFORE UPDATE ON xero_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_xero_updated_at();

CREATE TRIGGER update_xero_account_mappings_updated_at
    BEFORE UPDATE ON xero_account_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_xero_updated_at();
