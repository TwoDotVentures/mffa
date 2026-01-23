/**
 * Quick Actions Component
 *
 * Displays quick action buttons for common tasks.
 * Optimized for mobile with:
 * - Large touch targets (minimum 44px)
 * - Clear icons and labels
 * - 2-column grid on mobile, 4-column on desktop
 * - Hover and active states
 *
 * @module components/dashboard/quick-actions
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Upload,
  CreditCard,
  MessageSquare,
  ChartPie,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuration for quick action buttons
 */
const QUICK_ACTIONS = [
  {
    label: 'Add Transaction',
    href: '/transactions',
    icon: Plus,
    description: 'Record a new transaction',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
  },
  {
    label: 'Import Statement',
    href: '/transactions',
    icon: Upload,
    description: 'Upload bank CSV',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/50',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
  },
  {
    label: 'Accounts',
    href: '/accounts',
    icon: CreditCard,
    description: 'Manage accounts',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-950/50',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
  },
  {
    label: 'Ask AI',
    href: '/chat',
    icon: MessageSquare,
    description: 'Chat with AI',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/50',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
  },
] as const;

/**
 * Props for individual quick action button
 */
interface QuickActionButtonProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  hoverBg: string;
  animationDelay?: string;
}

/**
 * Individual quick action button component
 */
function QuickActionButton({
  label,
  href,
  icon: Icon,
  color,
  bgColor,
  hoverBg,
  animationDelay = '0ms',
}: QuickActionButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'h-auto py-3 sm:py-4 px-3 sm:px-4',
        'flex flex-col items-center justify-center gap-1.5 sm:gap-2',
        'rounded-xl border border-transparent',
        'transition-all duration-200',
        hoverBg,
        'hover:border-border hover:shadow-sm',
        'active:scale-[0.98]',
        'animate-in fade-in slide-in-from-bottom-2',
      )}
      style={{ animationDelay, animationDuration: '400ms', animationFillMode: 'both' }}
    >
      <Link href={href}>
        {/* Icon with colored background */}
        <div className={cn('rounded-full p-2.5 sm:p-3 transition-colors', bgColor)}>
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', color)} />
        </div>
        {/* Label */}
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {label}
        </span>
      </Link>
    </Button>
  );
}

/**
 * Quick actions card component
 * Displays grid of action buttons for common tasks
 */
export function QuickActions() {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4',
      )}
      style={{ animationDelay: '150ms', animationDuration: '500ms', animationFillMode: 'both' }}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action, index) => (
            <QuickActionButton
              key={action.label}
              {...action}
              animationDelay={`${175 + index * 50}ms`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
