/**
 * Document Filters Component
 *
 * Filter controls for documents by entity, type, and financial year.
 * Responsive layout: wraps on mobile, inline on desktop.
 * Touch-friendly select controls with 44px minimum height.
 *
 * @component
 * @example
 * <DocumentFilters />
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter, SlidersHorizontal } from 'lucide-react';
import { ENTITY_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filter values from URL
  const currentEntity = searchParams.get('entity') || 'all';
  const currentType = searchParams.get('type') || 'all';
  const currentYear = searchParams.get('year') || 'all';

  /**
   * Updates URL search params when filter changes.
   * Removes param if set to 'all'.
   * @param key - Filter key (entity, type, year)
   * @param value - Selected value
   */
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/documents?${params.toString()}`);
    },
    [router, searchParams]
  );

  /**
   * Clears all active filters.
   */
  const clearFilters = useCallback(() => {
    router.push('/documents');
  }, [router]);

  // Check if any filters are active
  const hasFilters =
    (currentEntity && currentEntity !== 'all') ||
    (currentType && currentType !== 'all') ||
    (currentYear && currentYear !== 'all');

  // Generate FY options (last 5 years)
  const fyOptions: string[] = [];
  const currentYearNum = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 5; i++) {
    const year = currentMonth >= 6 ? currentYearNum - i : currentYearNum - 1 - i;
    fyOptions.push(`${year}-${(year + 1).toString().slice(-2)}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter Label - Hidden on mobile */}
      <div className="text-muted-foreground mr-1 hidden items-center gap-1.5 text-sm sm:flex">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        <span>Filters:</span>
      </div>

      {/* Entity Type Filter */}
      <Select value={currentEntity} onValueChange={(v) => updateFilter('entity', v)}>
        <SelectTrigger
          className="h-10 w-[130px] border-dashed text-sm transition-all hover:border-solid focus:border-solid"
          aria-label="Filter by entity type"
        >
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

      {/* Document Type Filter */}
      <Select value={currentType} onValueChange={(v) => updateFilter('type', v)}>
        <SelectTrigger
          className="h-10 w-[160px] border-dashed text-sm transition-all hover:border-solid focus:border-solid"
          aria-label="Filter by document type"
        >
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

      {/* Financial Year Filter */}
      <Select value={currentYear} onValueChange={(v) => updateFilter('year', v)}>
        <SelectTrigger
          className="h-10 w-[120px] border-dashed text-sm transition-all hover:border-solid focus:border-solid"
          aria-label="Filter by financial year"
        >
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

      {/* Clear Filters Button - Only visible when filters active */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground h-10 px-3 transition-colors"
          aria-label="Clear all filters"
        >
          <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  );
}
