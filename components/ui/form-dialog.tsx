'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional dialog description */
  description?: string;
  /** Form children (form fields) */
  children: React.ReactNode;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  /** Whether the form is currently submitting */
  loading?: boolean;
  /** Text for the submit button */
  submitLabel?: string;
  /** Text for the cancel button */
  cancelLabel?: string;
  /** Whether to show destructive styling on submit button */
  destructive?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Maximum width class for the dialog */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether submit button is disabled (beyond loading state) */
  submitDisabled?: boolean;
  /** Optional footer content (rendered before buttons) */
  footerContent?: React.ReactNode;
  /** Optional className for the DialogContent */
  className?: string;
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

/**
 * FormDialog - A reusable dialog wrapper for forms.
 *
 * Provides consistent structure for form dialogs with title, description,
 * submit/cancel actions, loading state, and error display.
 *
 * @example
 * // Basic usage
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Add Account"
 *   description="Add a new bank account to track."
 *   onSubmit={handleSubmit}
 *   loading={isLoading}
 * >
 *   <div className="grid gap-4">
 *     <Input label="Account Name" ... />
 *   </div>
 * </FormDialog>
 *
 * @example
 * // With error and custom labels
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Edit Budget"
 *   onSubmit={handleSubmit}
 *   loading={isLoading}
 *   error={error}
 *   submitLabel="Save Changes"
 *   cancelLabel="Discard"
 * >
 *   {formFields}
 * </FormDialog>
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  loading = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  destructive = false,
  error,
  maxWidth = 'lg',
  submitDisabled = false,
  footerContent,
  className,
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidthClasses[maxWidth], className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-4">{children}</div>

          <DialogFooter className="mt-6">
            {footerContent}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={destructive ? 'destructive' : 'default'}
              disabled={loading || submitDisabled}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
