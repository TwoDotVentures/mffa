/**
 * Member Detail Header Component
 *
 * Displays member header with avatar, info, and actions.
 * Mobile-first responsive design with:
 * - Stacked layout on mobile, inline on desktop
 * - Touch-friendly back button and actions
 * - Compact info display on smaller screens
 * - Full-screen dialogs on mobile
 *
 * @module components/family-members/member-detail-header
 */
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
  /** The family member to display */
  member: FamilyMemberExtended;
}

/** Color classes for member type badges */
const memberTypeColors = {
  adult: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  child: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

/** Human-readable relationship labels */
const relationshipLabels: Record<string, string> = {
  self: 'Primary Account Holder',
  spouse: 'Spouse/Partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
};

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Member Detail Header Component
 * Displays member info and actions
 */
export function MemberDetailHeader({ member }: MemberDetailHeaderProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;

  /** Handle member deletion */
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
      <div className="mb-4 sm:mb-6">
        {/* Back button - Larger touch target on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/family-members')}
          className="mb-3 h-10 px-3 sm:mb-4 sm:h-9"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 sm:mr-2" />
          <span className="text-sm sm:text-base">Back</span>
        </Button>

        {/* Header content - Stack on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          {/* Left side - Avatar and basic info */}
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Avatar - Smaller on mobile */}
            <Avatar className="h-14 w-14 sm:h-20 sm:w-20">
              <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
              <AvatarFallback className="text-lg sm:text-2xl">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {/* Name and primary badge */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl font-bold sm:text-2xl">{member.name}</h1>
                {member.is_primary && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300 sm:text-xs"
                  >
                    Primary
                  </Badge>
                )}
              </div>

              {/* Type and relationship badges */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                <Badge
                  variant="secondary"
                  className={`${memberTypeColors[member.member_type]} text-[10px] sm:text-xs`}
                >
                  {member.member_type === 'adult' ? 'Adult' : 'Child'}
                </Badge>
                {member.relationship && (
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {relationshipLabels[member.relationship] || member.relationship}
                  </span>
                )}
              </div>

              {/* Quick info - Stacked on mobile */}
              <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:mt-3 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:text-sm">
                {age !== null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {age} years old
                    {member.date_of_birth && (
                      <span className="text-[10px] sm:text-xs">
                        ({formatDate(member.date_of_birth)})
                      </span>
                    )}
                  </span>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1 truncate hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">{member.email}</span>
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {member.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions - Full width on mobile */}
          <div className="flex gap-2 sm:shrink-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              className="h-10 flex-1 sm:h-9 sm:flex-initial"
            >
              <Pencil className="mr-1.5 h-4 w-4 sm:mr-2" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 sm:h-9 sm:w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="gap-2 py-2.5">
                  <Pencil className="h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 py-2.5 text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes if present */}
        {member.notes && (
          <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground sm:mt-4 sm:p-3 sm:text-sm">
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

      {/* Delete Confirmation Dialog - Full width on mobile */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Family Member</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete &ldquo;{member.name}&rdquo;? This will also delete all
              associated school enrolments, fees, activities, and document links. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
