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
import { cn } from '@/lib/utils';

export function FamilyMembersList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

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

  function handleAdd() {
    setEditingMember(undefined);
    setDialogOpen(true);
  }

  function handleEdit(member: FamilyMember) {
    setEditingMember(member);
    setDialogOpen(true);
  }

  function handleDeleteClick(member: FamilyMember) {
    setDeletingMember(member);
    setDeleteDialogOpen(true);
  }

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

  const adults = members.filter((m) => m.member_type === 'adult');
  const children = members.filter((m) => m.member_type === 'child');

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
            <CardDescription>
              Manage your family members and their information
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No family members yet. Add your first family member to get started.
              </p>
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Family Member
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Adults */}
              {adults.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
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

              {/* Children */}
              {children.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingMember?.name}? This will also
              delete all associated school enrolments, fees, activities, and linked
              documents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
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

function MemberCard({ member, onEdit, onDelete, showSchool }: MemberCardProps) {
  // Calculate age if DOB available
  const age = member.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(member.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <User className="h-6 w-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/family-members/${member.id}`}
          className="font-medium hover:underline"
        >
          {member.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {MEMBER_TYPE_LABELS[member.member_type as keyof typeof MEMBER_TYPE_LABELS]}
          </Badge>
          {member.relationship && (
            <Badge variant="outline" className="text-xs">
              {RELATIONSHIP_LABELS[member.relationship as keyof typeof RELATIONSHIP_LABELS]}
            </Badge>
          )}
          {age !== null && (
            <span className="text-xs text-muted-foreground">{age} years old</span>
          )}
        </div>
      </div>

      {showSchool && (
        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            <span>-</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span>-</span>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/family-members/${member.id}`}>
              <ChevronRight className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
