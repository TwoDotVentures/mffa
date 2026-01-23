'use client';

/**
 * Sheet Component
 *
 * A mobile-optimized slide-in panel built on Radix UI dialog primitives.
 * Used for navigation, filters, or secondary content.
 *
 * Mobile Optimizations:
 * - Full height/width on mobile depending on side
 * - Large touch targets for close button
 * - Safe area insets for notched devices
 * - Smooth slide animations
 *
 * @example
 * ```tsx
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetContent side="bottom">
 *     <SheetHeader>
 *       <SheetTitle>Title</SheetTitle>
 *       <SheetDescription>Description</SheetDescription>
 *     </SheetHeader>
 *     <div>Content</div>
 *     <SheetFooter>
 *       <Button>Action</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 */

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Root sheet component that manages open/closed state
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/**
 * Trigger element that opens the sheet when clicked
 */
function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/**
 * Close button component for sheet
 */
function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/**
 * Portal that renders sheet content outside the DOM hierarchy
 */
function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * Semi-transparent backdrop overlay with blur effect
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
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
 * Main sheet content container with directional slide animations.
 *
 * @param side - Direction the sheet slides in from (default: "right")
 * @param showCloseButton - Whether to show the X close button (default: true)
 */
function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // Base styles
          'bg-background fixed z-50 flex flex-col shadow-lg outline-none',
          'transition ease-in-out',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:duration-300 data-[state=open]:duration-300',
          // Right side
          side === 'right' && [
            'inset-y-0 right-0 h-full border-l',
            'w-full sm:w-3/4 sm:max-w-md',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          ],
          // Left side
          side === 'left' && [
            'inset-y-0 left-0 h-full border-r',
            'w-full sm:w-3/4 sm:max-w-md',
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          ],
          // Top side
          side === 'top' && [
            'inset-x-0 top-0 h-auto max-h-[85vh] rounded-b-lg border-b',
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          ],
          // Bottom side - most common for mobile
          side === 'bottom' && [
            'inset-x-0 bottom-0 h-auto max-h-[85vh] rounded-t-2xl border-t',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            // Safe area for mobile devices with home indicator
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
          ],
          className
        )}
        {...props}
      >
        {/* Drag handle for bottom sheets */}
        {side === 'bottom' && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
          </div>
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className={cn(
              'absolute z-10',
              'flex items-center justify-center',
              'ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
              'disabled:pointer-events-none',
              'opacity-70 transition-opacity hover:opacity-100',
              // Position and size based on side
              side === 'bottom'
                ? ['bg-muted/80 top-3 right-3 h-8 w-8 rounded-full']
                : [
                    'top-4 right-4 h-10 w-10 rounded-full sm:h-auto sm:w-auto sm:rounded-xs',
                    'bg-muted/80 sm:bg-transparent',
                  ]
            )}
          >
            <XIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/**
 * Header section for sheet content.
 * Contains title and optional description.
 */
function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4 sm:p-6', 'text-center sm:text-left', className)}
      {...props}
    />
  );
}

/**
 * Footer section for sheet content.
 * Contains action buttons, pinned to bottom.
 */
function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'mt-auto flex flex-col gap-2 p-4 pt-4 sm:p-6',
        'bg-background border-t',
        className
      )}
      {...props}
    />
  );
}

/**
 * Scrollable body container for sheet content.
 * Use this to wrap content that may overflow.
 */
function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-body"
      className={cn('flex-1 overflow-y-auto p-4 sm:p-6', 'overscroll-contain', className)}
      {...props}
    />
  );
}

/**
 * Sheet title - renders as h2 for accessibility
 */
function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'text-foreground text-lg font-semibold',
        'pr-10 sm:pr-0', // Space for close button on mobile
        className
      )}
      {...props}
    />
  );
}

/**
 * Sheet description - provides additional context below the title
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground mt-1 text-sm', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetBody,
  SheetTitle,
  SheetDescription,
  SheetPortal,
  SheetOverlay,
};
