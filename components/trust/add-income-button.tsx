'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TrustIncomeDialog } from './trust-income-dialog';

interface AddIncomeButtonProps {
  trustId: string;
}

export function AddIncomeButton({ trustId }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Income
      </Button>
      <TrustIncomeDialog
        trustId={trustId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
