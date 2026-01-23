/**
 * @fileoverview Add Super Contribution Button Component
 * @description Button to trigger super contribution entry dialog.
 *
 * @features
 * - Opens super contribution dialog on click
 * - Person-specific context (excludes joint)
 * - Outline variant for secondary action
 * - Touch-friendly sizing for mobile
 *
 * @mobile Min 44px tap target with responsive text
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { SuperDialog } from './super-dialog';
import type { PersonType } from '@/lib/types';

/** Props interface for AddSuperButton component */
interface AddSuperButtonProps {
  /** Person to add super contribution for (cannot be joint) */
  person: Exclude<PersonType, 'joint'>;
}

/**
 * Add Super Contribution Button Component
 *
 * Renders a button that opens the super contribution entry
 * dialog for a specific person (Grant or Shannon).
 *
 * @param props - Component props
 * @returns Rendered button with dialog
 */
export function AddSuperButton({ person }: AddSuperButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="h-9 text-xs whitespace-nowrap sm:h-8 sm:text-sm"
      >
        <Coins className="mr-1.5 h-4 w-4" />
        Add Super
      </Button>
      <SuperDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
