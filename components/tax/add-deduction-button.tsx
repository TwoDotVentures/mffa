'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { DeductionDialog } from './deduction-dialog';
import type { PersonType } from '@/lib/types';

interface AddDeductionButtonProps {
  person: PersonType;
}

export function AddDeductionButton({ person }: AddDeductionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <Receipt className="mr-2 h-4 w-4" />
        Add Deduction
      </Button>
      <DeductionDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
