/**
 * @fileoverview Trust Income List Component
 * @description Displays trust income records with source, type, amounts,
 * and franking credits in a mobile-friendly format.
 *
 * @features
 * - Mobile card view + desktop table view
 * - Color-coded income type badges
 * - Franking credits tracking
 * - Delete functionality with confirmation
 * - Summary totals in description
 *
 * @mobile Stacked card layout with clear visual hierarchy
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, TrendingUp } from 'lucide-react';
import { deleteTrustIncome } from '@/lib/trust/actions';
import type { TrustIncome } from '@/lib/types';

/** Props interface for TrustIncomeList component */
interface TrustIncomeListProps {
  /** Array of trust income records */
  income: TrustIncome[];
}

/** Income type display labels */
const incomeTypeLabels: Record<string, string> = {
  dividend: 'Dividend',
  interest: 'Interest',
  rent: 'Rent',
  capital_gain: 'Capital Gain',
  other: 'Other',
};

/** Income type color classes */
const incomeTypeColors: Record<string, string> = {
  dividend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  interest: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  capital_gain: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

/**
 * Formats a number as Australian currency
 *
 * @param amount - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);

/**
 * Formats a date string for display
 *
 * @param dateStr - ISO date string
 * @returns Formatted date string
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Trust Income List Component
 *
 * Displays trust income records in a mobile-friendly card view
 * on small screens and a table view on larger screens.
 *
 * @param props - Component props
 * @returns Rendered income list
 */
export function TrustIncomeList({ income }: TrustIncomeListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Handles income deletion with confirmation
   *
   * @param id - Income ID to delete
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;

    setIsDeleting(id);
    try {
      await deleteTrustIncome(id);
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (income.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            Trust Income
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            No income recorded for this financial year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Add dividend income, interest, or other income sources using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalFranking = income.reduce((sum, i) => sum + Number(i.franking_credits), 0);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
          Trust Income
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {income.length} income record{income.length !== 1 ? 's' : ''} totalling{' '}
          <span className="font-medium tabular-nums">{formatCurrency(totalIncome)}</span> with{' '}
          <span className="font-medium tabular-nums">{formatCurrency(totalFranking)}</span> franking
          credits
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Mobile Card View */}
        <div className="block divide-y sm:hidden">
          {income.map((item) => (
            <div key={item.id} className="space-y-3 p-4">
              {/* Header row with source and actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.source}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(item.date)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Type badge */}
              <div>
                <Badge variant="secondary" className={incomeTypeColors[item.income_type]}>
                  {incomeTypeLabels[item.income_type]}
                </Badge>
              </div>

              {/* Amount details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-[10px]">Amount</p>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(Number(item.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Franking</p>
                  <p className="font-semibold tabular-nums">
                    {Number(item.franking_credits) > 0
                      ? formatCurrency(Number(item.franking_credits))
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Franking</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {income.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
                  <TableCell className="font-medium">{item.source}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={incomeTypeColors[item.income_type]}>
                      {incomeTypeLabels[item.income_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(item.amount))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(item.franking_credits) > 0
                      ? formatCurrency(Number(item.franking_credits))
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting === item.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
