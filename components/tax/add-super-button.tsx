'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { SuperDialog } from './super-dialog';
import type { PersonType } from '@/lib/types';

interface AddSuperButtonProps {
  person: Exclude<PersonType, 'joint'>;
}

export function AddSuperButton({ person }: AddSuperButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <Coins className="mr-2 h-4 w-4" />
        Add Super
      </Button>
      <SuperDialog person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}
