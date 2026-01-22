'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'lucide-react';
import type { PersonType } from '@/lib/types';

interface PersonTabsProps {
  value: Exclude<PersonType, 'joint'>;
  onValueChange: (value: Exclude<PersonType, 'joint'>) => void;
}

export function PersonTabs({ value, onValueChange }: PersonTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as Exclude<PersonType, 'joint'>)}
    >
      <TabsList>
        <TabsTrigger value="grant" className="gap-2">
          <User className="h-4 w-4" />
          Grant
        </TabsTrigger>
        <TabsTrigger value="shannon" className="gap-2">
          <User className="h-4 w-4" />
          Shannon
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
