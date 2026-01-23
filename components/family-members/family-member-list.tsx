/**
 * Family Member List Component
 *
 * Displays a list of family members grouped by type.
 * Mobile-first responsive design with:
 * - Responsive grid layouts
 * - Touch-friendly cards
 * - Full-screen dialogs on mobile
 *
 * @module components/family-members/family-member-list
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
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
  /** Array of family members to display */
  members: FamilyMemberExtended[];
}

/**
 * Family Member List Component
 * Renders grouped lists of family members with actions
 */
export function FamilyMemberList({ members }: FamilyMemberListProps) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberExtended | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMemberExtended | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Handle member deletion */
  const handleDelete = useCallback(async () => {
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
  }, [deletingMember, router]);

  /** Navigate to member detail page */
  const handleMemberClick = useCallback(
    (member: FamilyMemberExtended) => {
      router.push(`/family-members/${member.id}`);
    },
    [router]
  );

  /** Dialog handlers */
  const handleOpenAddDialog = useCallback(() => setAddDialogOpen(true), []);
  const handleCloseEditDialog = useCallback((open: boolean) => !open && setEditingMember(null), []);
  const handleCloseDeleteDialog = useCallback(
    (open: boolean) => !open && setDeletingMember(null),
    []
  );
  const handleCloseDeleteButton = useCallback(() => setDeletingMember(null), []);

  /** Separate adults and children with memoization */
  const adults = useMemo(() => members.filter((m) => m.member_type === 'adult'), [members]);
  const children = useMemo(() => members.filter((m) => m.member_type === 'child'), [members]);

  /** Empty state */
  if (members.length === 0) {
    return (
      <>
        <EmptyFamilyState onAddMember={handleOpenAddDialog} />
        <FamilyMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        {/* Adults Section */}
        {adults.length > 0 && (
          <div>
            <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Adults</h3>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
            <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Children</h3>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
        onOpenChange={handleCloseEditDialog}
        member={editingMember || undefined}
      />

      {/* Delete Confirmation Dialog - Full width on mobile */}
      <Dialog open={!!deletingMember} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Family Member</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete &ldquo;{deletingMember?.name}&rdquo;? This will also
              delete all associated school enrolments, fees, activities, and document links. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCloseDeleteButton}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
