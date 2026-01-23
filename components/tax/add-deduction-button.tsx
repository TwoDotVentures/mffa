/**
 * @fileoverview Add Deduction Button Component
 * @description Button to trigger deduction entry dialog for a specific person.
 *
 * @features
 * - Opens deduction dialog on click
 * - Person-specific context passed to dialog
 * - Outline variant for secondary action
 * - Touch-friendly sizing for mobile
 *
 * @mobile Min 44px tap target with responsive text
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { DeductionDialog } from './deduction-dialog';
import type { PersonType } from '@/lib/types';

/** Props interface for AddDeductionButton component */
interface AddDeductionButtonProps {
  /** Person to add deduction for */
  person: PersonType;
}

/**
 * Add Deduction Button Component
 *
 * Renders a button that opens the deduction entry dialog
 * for a specific person (Grant or Shannon).
 *
 * @param props - Component props
 * @returns Rendered button with dialog
 */
export function AddDeductionButton({ person }: AddDeductionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="h-9 text-xs whitespace-nowrap sm:h-8 sm:text-sm"
      >
        <Receipt className="mr-1.5 h-4 w-4" />
        Add Deduction
      </Button>
      <DeductionDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
