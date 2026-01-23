/**
 * Family Member Card Component
 *
 * Displays a family member with their details in a card format.
 * Mobile-first responsive design with:
 * - Compact layout on mobile with optimized touch targets
 * - Avatar and name prominent with clear hierarchy
 * - Quick action menu accessible on all screen sizes
 * - Cost summary for children with clear typography
 *
 * @module components/family-members/family-member-card
 */
'use client';

import { memo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, GraduationCap, Activity, Calendar } from 'lucide-react';
import type { FamilyMemberExtended } from '@/lib/types';
import { calculateAge } from '@/lib/family-members/utils';

interface FamilyMemberCardProps {
  /** The family member data to display */
  member: FamilyMemberExtended;
  /** Callback when edit action is triggered */
  onEdit?: () => void;
  /** Callback when delete action is triggered */
  onDelete?: () => void;
  /** Callback when card is clicked for navigation */
  onClick?: () => void;
}

/** Color mappings for member type badges */
const memberTypeColors = {
  adult: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  child: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

/** Human-readable labels for relationship types */
const relationshipLabels: Record<string, string> = {
  self: 'Self',
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
};

/**
 * Extract initials from a name for avatar fallback
 * @param name - Full name string
 * @returns Up to 2 character initials
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
 * Format a number as Australian currency
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Family Member Card - Base Component
 * Displays member information in a responsive card layout
 */
function FamilyMemberCardComponent({ member, onEdit, onDelete, onClick }: FamilyMemberCardProps) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;

  /** Prevent event propagation on dropdown trigger */
  const handleDropdownTriggerClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  /** Handle edit with event propagation stop */
  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.();
    },
    [onEdit]
  );

  /** Handle delete with event propagation stop */
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        onClick ? 'hover:bg-muted/50 cursor-pointer hover:shadow-md active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      {/* Card Header with Avatar and Actions */}
      <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          {/* Member Identity Section */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            {/* Avatar - Responsive sizing */}
            <Avatar className="h-10 w-10 shrink-0 sm:h-12 sm:w-12">
              <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
              <AvatarFallback className="text-sm font-medium sm:text-lg">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and Type Info */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm leading-tight font-semibold sm:text-base">
                {member.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge
                  variant="secondary"
                  className={`${memberTypeColors[member.member_type]} text-[10px] sm:text-xs`}
                >
                  {member.member_type === 'adult' ? 'Adult' : 'Child'}
                </Badge>
                {member.relationship && (
                  <span className="text-muted-foreground text-[10px] sm:text-xs">
                    {relationshipLabels[member.relationship] || member.relationship}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu - Touch-friendly size */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
                  onClick={handleDropdownTriggerClick}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Member actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEditClick} className="gap-2 py-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2 py-2"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Card Content - Member Details */}
      <CardContent className="p-3 pt-1 sm:p-4 sm:pt-2">
        {/* Info Items - Compact layout */}
        <div className="text-muted-foreground space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
          {/* Age Display */}
          {age !== null && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>{age} years old</span>
            </div>
          )}

          {/* School Info - Children only */}
          {member.member_type === 'child' && member.current_school && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">
                {member.current_school.name}
                {member.current_year_level && ` - ${member.current_year_level}`}
              </span>
            </div>
          )}

          {/* Activities Count */}
          {member.active_activities_count !== undefined && member.active_activities_count > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Activity className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>
                {member.active_activities_count} active{' '}
                {member.active_activities_count === 1 ? 'activity' : 'activities'}
              </span>
            </div>
          )}
        </div>

        {/* Cost Summary Grid - Children only */}
        {member.member_type === 'child' && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 sm:mt-4 sm:gap-3 sm:pt-3">
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">School Fees/yr</p>
              <p className="text-sm font-medium sm:text-base">
                {formatCurrency(member.total_school_fees_year || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Activities/yr</p>
              <p className="text-sm font-medium sm:text-base">
                {formatCurrency(member.total_activities_cost_year || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Unpaid Fees Warning Badge */}
        {member.unpaid_fees_count !== undefined && member.unpaid_fees_count > 0 && (
          <div className="mt-2 sm:mt-3">
            <Badge variant="destructive" className="text-[10px] font-medium sm:text-xs">
              {member.unpaid_fees_count} unpaid {member.unpaid_fees_count === 1 ? 'fee' : 'fees'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Memoized Family Member Card
 * Only re-renders when member data or callbacks change
 */
export const FamilyMemberCard = memo(FamilyMemberCardComponent);
