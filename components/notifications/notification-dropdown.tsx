'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { markAsRead, dismissNotification, markAllAsRead } from '@/lib/notifications/actions';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_PRIORITY_COLORS } from '@/lib/types';
import type { Notification } from '@/lib/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onRefresh: () => void;
}

export function NotificationDropdown({ notifications, loading, onRefresh }: NotificationDropdownProps) {
  const router = useRouter();

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    onRefresh();
  };

  const handleDismiss = async (id: string) => {
    await dismissNotification(id);
    onRefresh();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    onRefresh();
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link_url) {
      router.push(notification.link_url);
    }
    onRefresh();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  const getPriorityIndicator = (priority: Notification['priority']) => {
    const colors = {
      low: 'bg-slate-400',
      medium: 'bg-blue-500',
      high: 'bg-amber-500',
      urgent: 'bg-red-500',
    };
    return <span className={`h-2 w-2 rounded-full ${colors[priority]}`} />;
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium">Notifications</span>
          {unreadNotifications.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({unreadNotifications.length} unread)
            </span>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative p-3 hover:bg-muted/50 cursor-pointer ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Priority Indicator */}
                  <div className="mt-1.5">
                    {getPriorityIndicator(notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[notification.notification_type]}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {notification.link_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(notification.link_url!);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
