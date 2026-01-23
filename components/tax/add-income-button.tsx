/**
 * @fileoverview Add Income Button Component
 * @description Button to trigger income entry dialog for a specific person.
 *
 * @features
 * - Opens income dialog on click
 * - Person-specific context passed to dialog
 * - Touch-friendly sizing for mobile
 *
 * @mobile Min 44px tap target with responsive text
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { IncomeDialog } from './income-dialog';
import type { PersonType } from '@/lib/types';

/** Props interface for AddIncomeButton component */
interface AddIncomeButtonProps {
  /** Person to add income for */
  person: PersonType;
}

/**
 * Add Income Button Component
 *
 * Renders a button that opens the income entry dialog
 * for a specific person (Grant or Shannon).
 *
 * @param props - Component props
 * @returns Rendered button with dialog
 */
export function AddIncomeButton({ person }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 text-xs whitespace-nowrap sm:h-8 sm:text-sm"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Income
      </Button>
      <IncomeDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
