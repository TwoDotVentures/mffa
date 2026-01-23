/**
 * @fileoverview Add Income Button Component
 * @description Action button that opens the trust income dialog for recording
 * new trust income entries like dividends, interest, and capital gains.
 *
 * @features
 * - Touch-friendly button with 44px minimum height
 * - Opens TrustIncomeDialog on click
 * - Mobile-optimized with flexible width
 *
 * @mobile Full touch target with responsive sizing
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TrustIncomeDialog } from './trust-income-dialog';

/** Props interface for AddIncomeButton component */
interface AddIncomeButtonProps {
  /** Trust ID for the income entry */
  trustId: string;
}

/**
 * Add Income Button Component
 *
 * Renders a button that opens the trust income dialog for
 * recording new income entries.
 *
 * @param props - Component props
 * @returns Rendered add income button with dialog
 */
export function AddIncomeButton({ trustId }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-9 text-xs whitespace-nowrap sm:h-8 sm:text-sm"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Income
      </Button>
      <TrustIncomeDialog trustId={trustId} open={open} onOpenChange={setOpen} />
    </>
  );
}
