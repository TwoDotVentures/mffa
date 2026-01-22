'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FamilyMemberDialog } from './family-member-dialog';

export function AddFamilyMemberButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Family Member
      </Button>
      <FamilyMemberDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
