/**
 * @fileoverview Income List Component
 * @description Displays a list of income records with source, type, amount, and franking credits.
 * Features responsive design with card view on mobile and table view on larger screens.
 *
 * @features
 * - Mobile-first card layout with swipe-friendly design
 * - Desktop table view for dense data display
 * - Color-coded income type badges
 * - Delete functionality with confirmation
 * - Summary totals in header
 *
 * @mobile Full-width cards with prominent amounts and touch-friendly actions
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
import { deleteIncome } from '@/lib/income/actions';
import type { Income } from '@/lib/types';
import { INCOME_TYPE_LABELS } from '@/lib/types';

/** Props interface for IncomeList component */
interface IncomeListProps {
  /** Array of income records to display */
  income: Income[];
}

/**
 * Color mapping for income type badges
 * Uses semantic colors to differentiate income sources visually
 */
const incomeTypeColors: Record<string, string> = {
  salary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  bonus: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  dividend: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  trust_distribution: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  rental: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  interest: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  capital_gain: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  government_payment: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200',
};

/**
 * Formats a number as Australian currency with 2 decimal places
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
 * Formats a date string in Australian format (DD Mon YYYY)
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
 * Income List Component
 *
 * Displays income records in a responsive layout - cards on mobile,
 * table on desktop. Includes delete functionality and summary totals.
 *
 * @param props - Component props containing income array
 * @returns Rendered income list or empty state
 */
export function IncomeList({ income }: IncomeListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Handles income record deletion with confirmation
   *
   * @param id - Income record ID to delete
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;

    setIsDeleting(id);
    try {
      await deleteIncome(id);
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Empty state
  if (income.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 text-center">
          <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <TrendingUp className="text-muted-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-base sm:text-lg">No Income Recorded</CardTitle>
          <CardDescription className="text-sm">
            No income recorded for this financial year.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Add salary, dividends, trust distributions, or other income using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalFranking = income.reduce((sum, i) => sum + Number(i.franking_credits), 0);
  const totalWithheld = income.reduce((sum, i) => sum + Number(i.tax_withheld), 0);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
          Income
        </CardTitle>
        <CardDescription className="space-y-1 text-xs sm:text-sm">
          <span className="block sm:inline">
            {income.length} record{income.length !== 1 ? 's' : ''} totalling{' '}
            <span className="text-foreground font-medium">{formatCurrency(totalIncome)}</span>
          </span>
          <span className="block sm:ml-1 sm:inline">
            with {formatCurrency(totalFranking)} franking and {formatCurrency(totalWithheld)}{' '}
            withheld
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Mobile Card View */}
        <div className="block divide-y sm:hidden">
          {income.map((item) => (
            <div key={item.id} className="space-y-3 p-4">
              {/* Header Row - Source and Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.source}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(item.date)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={isDeleting === item.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badge and Amount Row */}
              <div className="flex items-center justify-between gap-3">
                <Badge
                  variant="secondary"
                  className={`text-xs ${incomeTypeColors[item.income_type]}`}
                >
                  {INCOME_TYPE_LABELS[item.income_type]}
                </Badge>
                <span className="text-lg font-semibold text-green-600 tabular-nums dark:text-green-400">
                  {formatCurrency(Number(item.amount))}
                </span>
              </div>

              {/* Additional Details */}
              {(Number(item.franking_credits) > 0 || Number(item.tax_withheld) > 0) && (
                <div className="text-muted-foreground flex gap-4 text-xs">
                  {Number(item.franking_credits) > 0 && (
                    <span>Franking: {formatCurrency(Number(item.franking_credits))}</span>
                  )}
                  {Number(item.tax_withheld) > 0 && (
                    <span>Withheld: {formatCurrency(Number(item.tax_withheld))}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[140px]">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Franking</TableHead>
                <TableHead className="text-right">Tax Withheld</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {income.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                  <TableCell className="font-medium">{item.source}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={incomeTypeColors[item.income_type]}>
                      {INCOME_TYPE_LABELS[item.income_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(Number(item.amount))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {Number(item.franking_credits) > 0
                      ? formatCurrency(Number(item.franking_credits))
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {Number(item.tax_withheld) > 0
                      ? formatCurrency(Number(item.tax_withheld))
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
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
