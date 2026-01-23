'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text below the title */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action button click handler */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action button click handler */
  onSecondaryAction?: () => void;
  /** Custom action element (overrides actionLabel/onAction) */
  action?: React.ReactNode;
  /** Height of the container */
  height?: 'sm' | 'md' | 'lg' | 'full';
  /** Optional className for the container */
  className?: string;
  /** Optional icon className */
  iconClassName?: string;
  /** Optional children to render below everything */
  children?: React.ReactNode;
}

const heightClasses = {
  sm: 'h-[150px]',
  md: 'h-[200px]',
  lg: 'h-[300px]',
  full: 'h-full min-h-[200px]',
};

/**
 * EmptyState - A reusable component for displaying empty states.
 *
 * Used when lists are empty, searches return no results, or features are not configured.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   icon={FileText}
 *   title="No documents yet"
 *   description="Upload your first document to get started."
 *   actionLabel="Upload Document"
 *   onAction={handleUpload}
 * />
 *
 * @example
 * // With custom action
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try adjusting your search or filters."
 *   action={<Button variant="outline" onClick={handleClear}>Clear filters</Button>}
 * />
 *
 * @example
 * // Simple text only
 * <EmptyState
 *   title="No transactions"
 *   description="Import a bank statement to see your transactions here."
 *   height="sm"
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  action,
  height = 'md',
  className,
  iconClassName,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        heightClasses[height],
        className
      )}
    >
      {Icon && <Icon className={cn('text-muted-foreground/50 mb-4 h-12 w-12', iconClassName)} />}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {(action || actionLabel) && (
        <div className="mt-4 flex gap-2">
          {action || (actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>)}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
