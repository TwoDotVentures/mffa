'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Notification, CreateNotificationData } from '@/lib/types';
import { getCurrentFinancialYear, getDaysUntilEOFY } from '@/lib/trust/utils';

// ============================================
// Notification CRUD Operations
// ============================================

export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []) as unknown as Notification[];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .eq('is_dismissed', false)
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`);

  if (error) {
    console.error('Error counting notifications:', error);
    return 0;
  }
  return count || 0;
}

export async function markAsRead(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function dismissNotification(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('id', id);

  if (error) {
    console.error('Error dismissing notification:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function createNotification(data: CreateNotificationData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      title: data.title,
      message: data.message,
      notification_type: data.notification_type,
      priority: data.priority || 'medium',
      scheduled_for: data.scheduled_for || null,
      expires_at: data.expires_at || null,
      link_url: data.link_url || null,
      related_entity_type: data.related_entity_type || null,
      related_entity_id: data.related_entity_id || null,
      metadata: data.metadata || {},
    } as any);

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

// ============================================
// Automated Reminder Checks
// ============================================

export async function checkAndCreateReminders(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    checkTrustDistributionReminder(supabase, user.id),
    checkSuperCapWarnings(supabase, user.id),
    checkSmsfAuditReminder(supabase, user.id),
  ]);
}

async function checkTrustDistributionReminder(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<void> {
  const daysUntilEOFY = getDaysUntilEOFY();

  // Remind at 60, 30, 14, and 7 days before EOFY
  if (![60, 30, 14, 7].includes(daysUntilEOFY)) return;

  // Check if trust exists
  const { data: trust } = await supabase
    .from('trusts')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!trust) return;

  // Check if reminder already sent today
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', 'trust_distribution_reminder')
    .gte('created_at', today)
    .single();

  if (existing) return; // Already notified today

  const priority = daysUntilEOFY <= 7 ? 'urgent' : daysUntilEOFY <= 14 ? 'high' : 'medium';

  await supabase.from('notifications').insert({
    user_id: userId,
    title: '30 June Trust Distribution Deadline',
    message: `${daysUntilEOFY} days until the trust distribution deadline. Ensure ${trust.name} income is distributed before 30 June to avoid penalty tax.`,
    notification_type: 'trust_distribution_reminder',
    priority,
    link_url: '/trust',
    related_entity_type: 'trust',
    related_entity_id: trust.id,
    metadata: { daysRemaining: daysUntilEOFY },
  });
}

async function checkSuperCapWarnings(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<void> {
  const fy = getCurrentFinancialYear();

  // Check personal super contributions
  const { data: contributions } = await supabase
    .from('super_contributions')
    .select('amount, is_concessional')
    .eq('user_id', userId)
    .eq('financial_year', fy);

  if (!contributions || contributions.length === 0) return;

  const concessional = contributions
    .filter((c) => c.is_concessional)
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const concessionalCap = 30000;
  const percentage = (concessional / concessionalCap) * 100;

  if (percentage >= 90 && percentage < 100) {
    // Check if already notified this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', 'super_cap_warning')
      .gte('created_at', weekAgo.toISOString())
      .single();

    if (existing) return;

    const remaining = concessionalCap - concessional;

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Super Contribution Cap Warning',
      message: `You have used ${percentage.toFixed(0)}% of your concessional super cap. $${remaining.toLocaleString()} remaining for ${fy}.`,
      notification_type: 'super_cap_warning',
      priority: 'high',
      link_url: '/smsf',
      metadata: { percentage, remaining, cap: concessionalCap, financialYear: fy },
    });
  }
}

async function checkSmsfAuditReminder(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<void> {
  // Check SMSF compliance records
  const { data: smsf } = await supabase
    .from('smsf_funds')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!smsf) return;

  const { data: compliance } = await supabase
    .from('smsf_compliance')
    .select('*')
    .eq('fund_id', smsf.id)
    .order('audit_completed_date', { ascending: false })
    .limit(1)
    .single();

  if (!compliance?.audit_completed_date) return;

  const lastAudit = new Date(compliance.audit_completed_date);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (lastAudit < oneYearAgo) {
    // Check if already notified this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', 'smsf_audit_reminder')
      .gte('created_at', monthAgo.toISOString())
      .single();

    if (existing) return;

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'SMSF Audit May Be Overdue',
      message: `${smsf.name} annual audit may be overdue. Last audit was ${compliance.audit_completed_date}. Contact your SMSF auditor.`,
      notification_type: 'smsf_audit_reminder',
      priority: 'high',
      link_url: '/smsf',
      related_entity_type: 'smsf',
      related_entity_id: smsf.id,
      metadata: { lastAuditDate: compliance.audit_completed_date },
    });
  }
}

// ============================================
// Notification for Document Processing
// ============================================

export async function notifyDocumentProcessed(
  documentId: string,
  documentName: string,
  success: boolean
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('notifications').insert({
    user_id: user.id,
    title: success ? 'Document Ready for Search' : 'Document Processing Failed',
    message: success
      ? `"${documentName}" has been processed and is now searchable by the AI Accountant.`
      : `Failed to process "${documentName}". The document was saved but may not be searchable.`,
    notification_type: 'document_processed',
    priority: success ? 'low' : 'medium',
    link_url: '/documents',
    related_entity_type: 'document',
    related_entity_id: documentId,
  });
}

// ============================================
// Tax Deadline Reminders
// ============================================

export async function createTaxDeadlineReminder(
  deadlineDate: string,
  description: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const deadline = new Date(deadlineDate);
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) return; // Already passed

  const priority = daysUntil <= 7 ? 'urgent' : daysUntil <= 30 ? 'high' : 'medium';

  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Tax Deadline Reminder',
    message: `${description} - due in ${daysUntil} days (${deadlineDate})`,
    notification_type: 'tax_deadline',
    priority,
    scheduled_for: null, // Show immediately
    expires_at: deadline.toISOString(),
    metadata: { deadline: deadlineDate, daysUntil },
  });
}
