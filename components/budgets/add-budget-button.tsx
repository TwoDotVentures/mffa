'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BudgetDialog } from './budget-dialog';
import type { Category } from '@/lib/types';

interface AddBudgetButtonProps {
  categories: Category[];
}

export function AddBudgetButton({ categories }: AddBudgetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Budget
      </Button>
      <BudgetDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
      />
    </>
  );
}
