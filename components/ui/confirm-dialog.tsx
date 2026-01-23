'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: React.ReactNode;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button click handler */
  onConfirm: () => void | Promise<void>;
  /** Whether the action is loading */
  loading?: boolean;
  /** Whether to use destructive styling (for delete actions) */
  destructive?: boolean;
  /** Optional icon to display in the header */
  icon?: React.ReactNode;
}

/**
 * ConfirmDialog - A reusable confirmation dialog component.
 *
 * Used for delete confirmations, destructive actions, or any action
 * that requires user confirmation before proceeding.
 *
 * @example
 * // Basic delete confirmation
 * <ConfirmDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   title="Delete Account"
 *   description="Are you sure you want to delete this account? This action cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   loading={isDeleting}
 *   destructive
 * />
 *
 * @example
 * // Non-destructive confirmation
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Publish Changes"
 *   description="Your changes will be visible to all users. Continue?"
 *   confirmLabel="Publish"
 *   onConfirm={handlePublish}
 * />
 *
 * @example
 * // With dynamic content
 * <ConfirmDialog
 *   open={!!deletingItem}
 *   onOpenChange={(open) => !open && setDeletingItem(null)}
 *   title="Delete Item"
 *   description={<>Are you sure you want to delete "<strong>{deletingItem?.name}</strong>"?</>}
 *   onConfirm={handleDelete}
 *   destructive
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  destructive = false,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {icon && <div className="mb-2">{icon}</div>}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className={cn(destructive && buttonVariants({ variant: 'destructive' }))}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
