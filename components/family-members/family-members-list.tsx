/**
 * Family Members List Component
 *
 * Displays the list of family members grouped by type (adults/children).
 * Mobile-first responsive design with:
 * - Stacked member cards on mobile
 * - Floating add button for easy access on mobile
 * - Touch-friendly action buttons
 * - Responsive header with compact mobile layout
 *
 * @module components/family-members/family-members-list
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Users,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  ChevronRight,
  GraduationCap,
  Activity,
  Loader2,
} from 'lucide-react';
import { FamilyMemberDialog } from '@/components/family-members/family-member-dialog';
import {
  getFamilyMembers,
  deleteFamilyMember,
} from '@/lib/family-members/actions';
import {
  MEMBER_TYPE_LABELS,
  RELATIONSHIP_LABELS,
} from '@/lib/types';
import type { FamilyMember } from '@/lib/types';

/**
 * Main Family Members List Component
 * Fetches and displays all family members with CRUD operations
 */
export function FamilyMembersList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /** Load members on component mount */
  useEffect(() => {
    loadMembers();
  }, []);

  /** Fetch family members from the server */
  async function loadMembers() {
    try {
      setLoading(true);
      const data = await getFamilyMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open dialog for adding new member */
  function handleAdd() {
    setEditingMember(undefined);
    setDialogOpen(true);
  }

  /** Open dialog for editing existing member */
  function handleEdit(member: FamilyMember) {
    setEditingMember(member);
    setDialogOpen(true);
  }

  /** Show delete confirmation dialog */
  function handleDeleteClick(member: FamilyMember) {
    setDeletingMember(member);
    setDeleteDialogOpen(true);
  }

  /** Execute member deletion */
  async function handleDelete() {
    if (!deletingMember) return;

    setActionLoading(true);
    try {
      await deleteFamilyMember(deletingMember.id);
      await loadMembers();
      setDeleteDialogOpen(false);
      setDeletingMember(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setActionLoading(false);
    }
  }

  /** Filter members by type */
  const adults = members.filter((m) => m.member_type === 'adult');
  const children = members.filter((m) => m.member_type === 'child');

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Card Header - Responsive layout */}
        <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Family Members
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your family members and their information
            </CardDescription>
          </div>
          {/* Add Button - Full width on mobile */}
          <Button onClick={handleAdd} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Member</span>
          </Button>
        </CardHeader>

        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {members.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center sm:py-12">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                No family members yet. Add your first family member to get started.
              </p>
              <Button className="mt-4" size="sm" onClick={handleAdd}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Family Member
              </Button>
            </div>
          ) : (
            /* Member Lists */
            <div className="space-y-5 sm:space-y-6">
              {/* Adults Section */}
              {adults.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:mb-3 sm:text-sm">
                    Adults ({adults.length})
                  </h4>
                  <div className="space-y-2">
                    {adults.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => handleEdit(member)}
                        onDelete={() => handleDeleteClick(member)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Children Section */}
              {children.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:mb-3 sm:text-sm">
                    Children ({children.length})
                  </h4>
                  <div className="space-y-2">
                    {children.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => handleEdit(member)}
                        onDelete={() => handleDeleteClick(member)}
                        showSchool
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingMember(undefined);
            loadMembers();
            router.refresh();
          }
        }}
        member={editingMember}
      />

      {/* Delete Confirmation Dialog - Full screen on mobile */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Family Member</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete {deletingMember?.name}? This will also
              delete all associated school enrolments, fees, activities, and linked
              documents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="w-full sm:w-auto"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MemberCardProps {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
  showSchool?: boolean;
}

/**
 * Individual Member Card Component
 * Displays member info with actions in a compact row format
 */
function MemberCard({ member, onEdit, onDelete, showSchool }: MemberCardProps) {
  /** Calculate age from date of birth */
  const age = member.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(member.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="group flex items-center gap-2.5 rounded-lg border p-3 transition-all hover:bg-muted/50 active:scale-[0.99] sm:gap-4 sm:p-4">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
        <User className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
      </div>

      {/* Member Info */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/family-members/${member.id}`}
          className="block truncate text-sm font-medium hover:underline sm:text-base"
        >
          {member.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {MEMBER_TYPE_LABELS[member.member_type as keyof typeof MEMBER_TYPE_LABELS]}
          </Badge>
          {member.relationship && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {RELATIONSHIP_LABELS[member.relationship as keyof typeof RELATIONSHIP_LABELS]}
            </Badge>
          )}
          {age !== null && (
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              {age} years old
            </span>
          )}
        </div>
      </div>

      {/* School/Activity indicators - Hidden on small screens */}
      {showSchool && (
        <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex sm:gap-4 sm:text-sm">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>-</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>-</span>
          </div>
        </div>
      )}

      {/* Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem asChild className="gap-2 py-2">
            <Link href={`/family-members/${member.id}`}>
              <ChevronRight className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="gap-2 py-2">
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 py-2 text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
