/**
 * Empty Family State Component
 *
 * Displays a placeholder when no family members exist.
 * Mobile-first responsive design with:
 * - Compact spacing on mobile
 * - Touch-friendly button sizing
 * - Responsive icon and text sizes
 *
 * @module components/family-members/empty-family-state
 */
'use client';

import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyFamilyStateProps {
  /** Callback when add member button is clicked */
  onAddMember: () => void;
}

/**
 * Empty Family State Component
 * Shows a helpful message when no family members are added
 */
export function EmptyFamilyState({ onAddMember }: EmptyFamilyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center sm:min-h-[400px] sm:p-8">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
        <Users className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
      </div>

      {/* Text */}
      <h3 className="mt-4 text-lg font-semibold sm:mt-6 sm:text-xl">No family members yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
        Add family members to track their details, school fees, extracurricular activities, and
        documents all in one place.
      </p>

      {/* Action button */}
      <Button onClick={onAddMember} className="mt-4 h-11 sm:mt-6 sm:h-10">
        <Plus className="mr-1.5 h-4 w-4" />
        Add Family Member
      </Button>
    </div>
  );
}
