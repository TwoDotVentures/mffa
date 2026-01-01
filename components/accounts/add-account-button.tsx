'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AccountDialog } from './account-dialog';

export function AddAccountButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Account
      </Button>
      <AccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
