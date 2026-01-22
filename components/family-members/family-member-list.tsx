'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FamilyMemberCard } from './family-member-card';
import { FamilyMemberDialog } from './family-member-dialog';
import { EmptyFamilyState } from './empty-family-state';
import { deleteFamilyMember } from '@/lib/family-members/actions';
import type { FamilyMemberExtended } from '@/lib/types';

interface FamilyMemberListProps {
  members: FamilyMemberExtended[];
}

export function FamilyMemberList({ members }: FamilyMemberListProps) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberExtended | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMemberExtended | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deletingMember) return;

    setDeleteLoading(true);
    try {
      await deleteFamilyMember(deletingMember.id);
      setDeletingMember(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting family member:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMemberClick = (member: FamilyMemberExtended) => {
    router.push(`/family-members/${member.id}`);
  };

  if (members.length === 0) {
    return (
      <>
        <EmptyFamilyState onAddMember={() => setAddDialogOpen(true)} />
        <FamilyMemberDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </>
    );
  }

  // Separate adults and children
  const adults = members.filter((m) => m.member_type === 'adult');
  const children = members.filter((m) => m.member_type === 'child');

  return (
    <>
      <div className="space-y-8">
        {/* Adults Section */}
        {adults.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Adults</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adults.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  onEdit={() => setEditingMember(member)}
                  onDelete={() => setDeletingMember(member)}
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Children Section */}
        {children.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Children</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  onEdit={() => setEditingMember(member)}
                  onDelete={() => setDeletingMember(member)}
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <FamilyMemberDialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingMember?.name}&rdquo;? This will also
              delete all associated school enrolments, fees, activities, and document links. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMember(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
