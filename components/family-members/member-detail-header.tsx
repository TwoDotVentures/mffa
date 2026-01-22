'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import { FamilyMemberDialog } from './family-member-dialog';
import { deleteFamilyMember } from '@/lib/family-members/actions';
import { calculateAge, formatDate } from '@/lib/family-members/utils';
import type { FamilyMemberExtended } from '@/lib/types';

interface MemberDetailHeaderProps {
  member: FamilyMemberExtended;
}

const memberTypeColors = {
  adult: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  child: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const relationshipLabels: Record<string, string> = {
  self: 'Primary Account Holder',
  spouse: 'Spouse/Partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberDetailHeader({ member }: MemberDetailHeaderProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteFamilyMember(member.id);
      router.push('/family-members');
      router.refresh();
    } catch (error) {
      console.error('Error deleting family member:', error);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/family-members')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family Members
        </Button>

        {/* Header content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left side - Avatar and basic info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
              <AvatarFallback className="text-2xl">{getInitials(member.name)}</AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{member.name}</h1>
                {member.is_primary && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Primary
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={memberTypeColors[member.member_type]}>
                  {member.member_type === 'adult' ? 'Adult' : 'Child'}
                </Badge>
                {member.relationship && (
                  <span className="text-sm text-muted-foreground">
                    {relationshipLabels[member.relationship] || member.relationship}
                  </span>
                )}
              </div>

              {/* Quick info */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {age !== null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {age} years old
                    {member.date_of_birth && (
                      <span className="text-xs">({formatDate(member.date_of_birth)})</span>
                    )}
                  </span>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes if present */}
        {member.notes && (
          <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {member.notes}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <FamilyMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={member}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{member.name}&rdquo;? This will also delete all
              associated school enrolments, fees, activities, and document links. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
