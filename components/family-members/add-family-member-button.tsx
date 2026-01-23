/**
 * Add Family Member Button Component
 *
 * Button that opens the family member dialog for adding new members.
 * Mobile-first responsive design with touch-friendly sizing.
 *
 * @module components/family-members/add-family-member-button
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FamilyMemberDialog } from './family-member-dialog';

/**
 * Add Family Member Button Component
 * Opens the dialog for creating new family members
 */
export function AddFamilyMemberButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="h-10 sm:h-9"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        <span className="text-sm">Add Family Member</span>
      </Button>
      <FamilyMemberDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
