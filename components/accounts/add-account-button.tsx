/**
 * Add Account Button Component
 *
 * A button that opens the account creation dialog.
 * Features mobile-first responsive design with:
 * - Touch-friendly sizing (min 44px height on mobile)
 * - Clear visual affordance with icon + text
 * - Smooth hover/active states
 *
 * @module components/accounts/add-account-button
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AccountDialog } from './account-dialog';

/**
 * Button component that triggers the account creation dialog.
 * Renders with appropriate sizing and styling for both mobile and desktop.
 */
export function AddAccountButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        Primary action button with:
        - Larger touch target on mobile (h-11 = 44px)
        - Standard size on desktop (h-10 = 40px)
        - Full width on mobile when in card header context
        - Icon + text for clear affordance
        - Subtle hover transition
      */}
      <Button
        onClick={() => setOpen(true)}
        className="h-11 sm:h-10 px-4 sm:px-4 w-full sm:w-auto transition-all duration-200 touch-manipulation"
      >
        <Plus className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">Add Account</span>
      </Button>

      {/* Account creation dialog */}
      <AccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
