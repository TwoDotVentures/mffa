'use client';

import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyFamilyStateProps {
  onAddMember: () => void;
}

export function EmptyFamilyState({ onAddMember }: EmptyFamilyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-xl font-semibold">No family members yet</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Add family members to track their details, school fees, extracurricular activities, and
        documents all in one place.
      </p>
      <Button onClick={onAddMember} className="mt-6">
        <Plus className="mr-2 h-4 w-4" />
        Add Family Member
      </Button>
    </div>
  );
}
