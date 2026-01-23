'use client';

/**
 * Dialog Component
 *
 * A mobile-first, accessible modal dialog built on Radix UI primitives.
 *
 * Mobile Optimizations:
 * - Full screen on mobile with safe area insets
 * - Sticky header and footer
 * - Smooth slide-up animation on mobile
 * - Proper keyboard handling and focus management
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>Description</DialogDescription>
 *     </DialogHeader>
 *     <div>Content</div>
 *     <DialogFooter>
 *       <Button>Action</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Root dialog component that manages open/closed state
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * Trigger element that opens the dialog when clicked
 */
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * Portal that renders dialog content outside the DOM hierarchy
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * Close button component for dialog
 */
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Semi-transparent backdrop overlay with blur effect on desktop
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

/**
 * Main dialog content container with mobile-first responsive design.
 *
 * On mobile: Full screen with slide-up animation
 * On desktop: Centered modal with zoom animation
 *
 * @param showCloseButton - Whether to show the X close button (default: true)
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Base styles
          'bg-background fixed z-50 shadow-lg outline-none',
          'flex flex-col',
          // Mobile: Full screen with slide-up animation
          'inset-0 h-[100dvh] w-full rounded-none border-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          // Desktop: Centered modal with max width
          'sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:rounded-lg sm:border',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
          'duration-200',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              'absolute top-4 right-4 z-10',
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-muted/80 sm:h-auto sm:w-auto sm:rounded-xs sm:bg-transparent',
              'opacity-70 transition-opacity hover:opacity-100',
              'ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
              'disabled:pointer-events-none',
              'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0'
            )}
          >
            <XIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Header section with sticky positioning on mobile.
 * Contains title and optional description.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-1.5 p-4 pb-0 sm:p-6 sm:pb-0',
        'bg-background sticky top-0 z-10',
        'border-b sm:border-b-0',
        'text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}

/**
 * Footer section with sticky positioning on mobile.
 * Contains action buttons - stacks vertically on mobile, horizontal on desktop.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 p-4 pt-4 sm:p-6',
        'bg-background sticky bottom-0 z-10',
        'border-t sm:border-t-0',
        'sm:flex-row sm:justify-end',
        // Safe area for mobile devices with home indicator
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        'sm:pb-6',
        className
      )}
      {...props}
    />
  );
}

/**
 * Dialog title - renders as h2 for accessibility
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-lg leading-none font-semibold tracking-tight',
        'pr-10 sm:pr-0', // Space for close button on mobile
        className
      )}
      {...props}
    />
  );
}

/**
 * Dialog description - provides additional context below the title
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground mt-1.5 text-sm', className)}
      {...props}
    />
  );
}

/**
 * Scrollable body container for dialog content.
 * Use this to wrap form content that may overflow.
 */
function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('flex-1 overflow-y-auto p-4 sm:p-6', 'overscroll-contain', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogBody,
};
