'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  /** Unique key for the column, typically the property name */
  key: string;
  /** Display header for the column */
  header: string;
  /** Optional render function for custom cell content */
  cell?: (item: T, index: number) => React.ReactNode;
  /** Optional accessor function to get the raw value (for sorting) */
  accessor?: (item: T) => string | number | Date | null | undefined;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Width class for the column (e.g., 'w-[200px]' or 'w-1/4') */
  width?: string;
  /** Text alignment for the column */
  align?: 'left' | 'center' | 'right';
  /** Whether to hide this column on mobile */
  hideOnMobile?: boolean;
  /** Optional className for the header cell */
  headerClassName?: string;
  /** Optional className for the body cells */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Function to get unique key for each row */
  getRowKey: (item: T) => string;
  /** Optional component to render when data is empty */
  emptyState?: React.ReactNode;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys (controlled) */
  selectedKeys?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Current sort column key */
  sortColumn?: string | null;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Callback when sort changes */
  onSortChange?: (column: string, direction: SortDirection) => void;
  /** Whether to show mobile card view on small screens */
  mobileCardView?: boolean;
  /** Optional render function for mobile card view */
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  /** Optional row click handler */
  onRowClick?: (item: T) => void;
  /** Optional className for the table container */
  className?: string;
  /** Optional className for table rows */
  rowClassName?: string | ((item: T) => string);
  /** Whether to show a loading state */
  loading?: boolean;
  /** Optional header content to render above the table */
  headerContent?: React.ReactNode;
}

/**
 * DataTable - A reusable table component with sorting, selection, and mobile responsiveness.
 *
 * @example
 * // Basic usage
 * <DataTable
 *   data={accounts}
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'balance', header: 'Balance', align: 'right' },
 *   ]}
 *   getRowKey={(account) => account.id}
 * />
 *
 * @example
 * // With selection and sorting
 * <DataTable
 *   data={transactions}
 *   columns={columns}
 *   getRowKey={(tx) => tx.id}
 *   selectable
 *   selectedKeys={selected}
 *   onSelectionChange={setSelected}
 *   sortColumn={sortCol}
 *   sortDirection={sortDir}
 *   onSortChange={handleSort}
 * />
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyState,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSortChange,
  mobileCardView = false,
  renderMobileCard,
  onRowClick,
  className,
  rowClassName,
  loading = false,
  headerContent,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(getRowKey)));
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    onSelectionChange(newSelected);
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortChange) return;
    const newDirection: SortDirection =
      sortColumn === column.key
        ? sortDirection === 'asc'
          ? 'desc'
          : sortDirection === 'desc'
            ? null
            : 'asc'
        : 'asc';
    onSortChange(column.key, newDirection);
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    if (sortColumn !== column.key) {
      return <ArrowUpDown className="text-muted-foreground/50 ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="text-muted-foreground/50 ml-2 h-4 w-4" />;
  };

  const getRowClasses = (item: T) => {
    const baseClasses = onRowClick ? 'cursor-pointer' : '';
    if (typeof rowClassName === 'function') {
      return cn(baseClasses, rowClassName(item));
    }
    return cn(baseClasses, rowClassName);
  };

  // Empty state
  if (data.length === 0 && !loading) {
    return (
      <div className={className}>
        {headerContent}
        {emptyState || (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            No data available
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {headerContent}
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Loading...
        </div>
      </div>
    );
  }

  // Mobile card view
  if (mobileCardView && renderMobileCard) {
    return (
      <div className={className}>
        {headerContent}
        {/* Desktop table view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate =
                            someSelected;
                        }
                      }}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.width,
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.headerClassName
                      )}
                    >
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="data-[state=open]:bg-accent -ml-3 h-8"
                          onClick={() => handleSort(column)}
                        >
                          {column.header}
                          {getSortIcon(column)}
                        </Button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
                const key = getRowKey(item);
                return (
                  <TableRow
                    key={key}
                    className={getRowClasses(item)}
                    onClick={() => onRowClick?.(item)}
                    data-state={selectedKeys.has(key) ? 'selected' : undefined}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedKeys.has(key)}
                          onCheckedChange={() => handleSelectRow(key)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns
                      .filter((col) => !col.hideOnMobile)
                      .map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center',
                            column.cellClassName
                          )}
                        >
                          {column.cell
                            ? column.cell(item, index)
                            : String((item as Record<string, unknown>)[column.key] ?? '')}
                        </TableCell>
                      ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {data.map((item, index) => {
            const key = getRowKey(item);
            return (
              <Card
                key={key}
                className={cn(
                  'relative',
                  onRowClick && 'cursor-pointer',
                  selectedKeys.has(key) && 'ring-primary ring-2'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {selectable && (
                  <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedKeys.has(key)}
                      onCheckedChange={() => handleSelectRow(key)}
                      aria-label={`Select item ${index + 1}`}
                    />
                  </div>
                )}
                <CardContent className="p-4">{renderMobileCard(item, index)}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard table view (no mobile cards)
  return (
    <div className={className}>
      {headerContent}
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate =
                        someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.width,
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                  column.hideOnMobile && 'hidden md:table-cell',
                  column.headerClassName
                )}
              >
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="data-[state=open]:bg-accent -ml-3 h-8"
                    onClick={() => handleSort(column)}
                  >
                    {column.header}
                    {getSortIcon(column)}
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const key = getRowKey(item);
            return (
              <TableRow
                key={key}
                className={getRowClasses(item)}
                onClick={() => onRowClick?.(item)}
                data-state={selectedKeys.has(key) ? 'selected' : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedKeys.has(key)}
                      onCheckedChange={() => handleSelectRow(key)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.hideOnMobile && 'hidden md:table-cell',
                      column.cellClassName
                    )}
                  >
                    {column.cell
                      ? column.cell(item, index)
                      : String((item as Record<string, unknown>)[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
