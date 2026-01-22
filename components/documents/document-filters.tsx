'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ENTITY_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentEntity = searchParams.get('entity') || 'all';
  const currentType = searchParams.get('type') || 'all';
  const currentYear = searchParams.get('year') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/documents?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/documents');
  };

  const hasFilters = (currentEntity && currentEntity !== 'all') ||
                     (currentType && currentType !== 'all') ||
                     (currentYear && currentYear !== 'all');

  // Generate FY options
  const fyOptions = [];
  const currentYearNum = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 5; i++) {
    const year = currentMonth >= 6 ? currentYearNum - i : currentYearNum - 1 - i;
    fyOptions.push(`${year}-${(year + 1).toString().slice(-2)}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentEntity} onValueChange={(v) => updateFilter('entity', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entities</SelectItem>
          {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentType} onValueChange={(v) => updateFilter('type', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentYear} onValueChange={(v) => updateFilter('year', v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="All years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All years</SelectItem>
          {fyOptions.map((fy) => (
            <SelectItem key={fy} value={fy}>
              FY {fy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
