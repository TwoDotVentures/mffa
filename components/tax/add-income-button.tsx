'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { IncomeDialog } from './income-dialog';
import type { PersonType } from '@/lib/types';

interface AddIncomeButtonProps {
  person: PersonType;
}

export function AddIncomeButton({ person }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Income
      </Button>
      <IncomeDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
