/**
 * @fileoverview Person Tabs Component
 * @description Tab selector for switching between Grant and Shannon's data.
 *
 * @features
 * - Tab-based person selection
 * - User icons for visual identification
 * - Touch-friendly tab targets
 *
 * @mobile Full-width tabs with comfortable tap targets
 */
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'lucide-react';
import type { PersonType } from '@/lib/types';

/** Props interface for PersonTabs component */
interface PersonTabsProps {
  /** Currently selected person */
  value: Exclude<PersonType, 'joint'>;
  /** Callback when person selection changes */
  onValueChange: (value: Exclude<PersonType, 'joint'>) => void;
}

/**
 * Person Tabs Component
 *
 * Provides tab-based navigation between Grant and Shannon's
 * tax data, with responsive sizing for mobile.
 *
 * @param props - Component props
 * @returns Rendered person tabs
 */
export function PersonTabs({ value, onValueChange }: PersonTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as Exclude<PersonType, 'joint'>)}
      className="w-full sm:w-auto"
    >
      <TabsList className="grid h-10 w-full grid-cols-2 sm:inline-flex sm:h-9 sm:w-auto">
        <TabsTrigger value="grant" className="h-9 gap-1.5 px-3 text-xs sm:h-8 sm:px-4 sm:text-sm">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Grant
        </TabsTrigger>
        <TabsTrigger value="shannon" className="h-9 gap-1.5 px-3 text-xs sm:h-8 sm:px-4 sm:text-sm">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Shannon
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
