/**
 * Add Budget Button Component
 *
 * Primary action button for creating new budgets.
 * Touch-optimized with 44px+ touch target.
 * Includes visual feedback on press.
 *
 * @component
 * @example
 * <AddBudgetButton categories={categories} />
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BudgetDialog } from './budget-dialog';
import type { Category } from '@/lib/types';

/** Props for the AddBudgetButton component */
interface AddBudgetButtonProps {
  /** Available expense categories for budget assignment */
  categories: Category[];
}

export function AddBudgetButton({ categories }: AddBudgetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        Button with prominent styling for primary action.
        Mobile: Full width for easy thumb reach.
        Desktop: Auto-width aligned to right.
        Touch target: 44px minimum height for accessibility.
      */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="min-h-[44px] w-full gap-2 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] sm:w-auto"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span>Add Budget</span>
      </Button>

      {/* Budget creation/edit dialog */}
      <BudgetDialog open={open} onOpenChange={setOpen} categories={categories} />
    </>
  );
}
