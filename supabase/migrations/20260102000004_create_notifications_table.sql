-- Phase 8.3: Notifications Table
-- Alerts and reminders for financial deadlines

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'trust_distribution_reminder',
    'super_cap_warning',
    'smsf_audit_reminder',
    'budget_alert',
    'document_processed',
    'tax_deadline',
    'general'
  )),

  -- Priority and status
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  -- Scheduling
  scheduled_for TIMESTAMPTZ, -- When to show (NULL = show immediately)
  expires_at TIMESTAMPTZ, -- When to auto-dismiss

  -- Linking
  link_url TEXT, -- URL to navigate to when clicked
  related_entity_type TEXT, -- 'budget', 'document', 'smsf', 'trust', etc.
  related_entity_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- Indexes for efficient querying
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, is_dismissed)
  WHERE is_read = false AND is_dismissed = false;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for)
  WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(user_id, notification_type);
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'User notifications for financial reminders and alerts - Phase 8.3';
