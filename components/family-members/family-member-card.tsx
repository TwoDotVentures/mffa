'use client';

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
  member: FamilyMemberExtended;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const memberTypeColors = {
  adult: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  child: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const relationshipLabels: Record<string, string> = {
  self: 'Self',
  spouse: 'Spouse',
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
  onClick,
}: FamilyMemberCardProps) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;

  return (
    <Card
      className={`relative transition-colors ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
              <AvatarFallback className="text-lg">{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold leading-none">{member.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className={memberTypeColors[member.member_type]}>
                  {member.member_type === 'adult' ? 'Adult' : 'Child'}
                </Badge>
                {member.relationship && (
                  <span className="text-xs text-muted-foreground">
                    {relationshipLabels[member.relationship] || member.relationship}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Age */}
          {age !== null && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{age} years old</span>
            </div>
          )}

          {/* School info for children */}
          {member.member_type === 'child' && member.current_school && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>
                {member.current_school.name}
                {member.current_year_level && ` - ${member.current_year_level}`}
              </span>
            </div>
          )}

          {/* Activities count */}
          {member.active_activities_count !== undefined && member.active_activities_count > 0 && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>
                {member.active_activities_count} active{' '}
                {member.active_activities_count === 1 ? 'activity' : 'activities'}
              </span>
            </div>
          )}
        </div>

        {/* Cost summary for children */}
        {member.member_type === 'child' && (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">School Fees/yr</p>
              <p className="font-medium">
                {formatCurrency(member.total_school_fees_year || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activities/yr</p>
              <p className="font-medium">
                {formatCurrency(member.total_activities_cost_year || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Unpaid fees indicator */}
        {member.unpaid_fees_count !== undefined && member.unpaid_fees_count > 0 && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              {member.unpaid_fees_count} unpaid {member.unpaid_fees_count === 1 ? 'fee' : 'fees'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
