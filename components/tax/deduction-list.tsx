/**
 * @fileoverview Deduction List Component
 * @description Displays a list of tax deductions with category, description, amount, and approval status.
 * Features responsive design with card view on mobile and table view on larger screens.
 *
 * @features
 * - Mobile-first card layout with touch-friendly actions
 * - Desktop table view for dense data display
 * - Color-coded category badges
 * - Approval workflow with visual status indicators
 * - Delete and approve functionality
 * - Flagged items counter in header
 *
 * @mobile Full-width cards with prominent amounts and swipe-friendly actions
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, Check, AlertTriangle, Receipt } from 'lucide-react';
import { deleteDeduction, approveDeduction } from '@/lib/deductions/actions';
import type { Deduction } from '@/lib/types';
import { DEDUCTION_CATEGORY_LABELS } from '@/lib/types';

/** Props interface for DeductionList component */
interface DeductionListProps {
  /** Array of deduction records to display */
  deductions: Deduction[];
}

/**
 * Color mapping for deduction category badges
 * Uses semantic colors to differentiate categories visually
 */
const categoryColors: Record<string, string> = {
  work_from_home: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  vehicle: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  travel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  clothing_laundry: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  self_education: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  tools_equipment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  professional_subscriptions: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  union_fees: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  phone_internet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  donations: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  income_protection: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  tax_agent_fees: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-200',
  investment_expenses: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
  rental_property: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
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
 * Deduction List Component
 *
 * Displays deduction records in a responsive layout - cards on mobile,
 * table on desktop. Includes approve/delete functionality and summary totals.
 *
 * @param props - Component props containing deductions array
 * @returns Rendered deduction list or empty state
 */
export function DeductionList({ deductions }: DeductionListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  /**
   * Handles deduction record deletion with confirmation
   *
   * @param id - Deduction record ID to delete
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return;

    setIsLoading(id);
    try {
      await deleteDeduction(id);
    } catch (error) {
      console.error('Error deleting deduction:', error);
    } finally {
      setIsLoading(null);
    }
  };

  /**
   * Handles deduction approval
   *
   * @param id - Deduction record ID to approve
   */
  const handleApprove = async (id: string) => {
    setIsLoading(id);
    try {
      await approveDeduction(id);
    } catch (error) {
      console.error('Error approving deduction:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Empty state
  if (deductions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 text-center">
          <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <Receipt className="text-muted-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-base sm:text-lg">No Deductions Recorded</CardTitle>
          <CardDescription className="text-sm">
            No deductions recorded for this financial year.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Add work-related deductions, donations, or other tax deductions using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  const flaggedCount = deductions.filter((d) => !d.is_approved).length;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
          <Receipt className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          <span>Deductions</span>
          {flaggedCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {flaggedCount} needs review
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {deductions.length} deduction{deductions.length !== 1 ? 's' : ''} totalling{' '}
          <span className="text-foreground font-medium">{formatCurrency(totalDeductions)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Mobile Card View */}
        <div className="block divide-y sm:hidden">
          {deductions.map((item) => (
            <div key={item.id} className="space-y-3 p-4">
              {/* Header Row - Description and Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{item.description}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(item.date)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={isLoading === item.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!item.is_approved && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleApprove(item.id)}
                          disabled={isLoading === item.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading === item.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badge Row - Category and Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${categoryColors[item.category]}`}>
                    {DEDUCTION_CATEGORY_LABELS[item.category]}
                  </Badge>
                  {item.is_approved ? (
                    <Badge variant="outline" className="border-green-200 text-xs text-green-600">
                      <Check className="mr-1 h-3 w-3" />
                      OK
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Review
                    </Badge>
                  )}
                </div>
                <span className="text-lg font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                  {formatCurrency(Number(item.amount))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[160px]">Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={categoryColors[item.category]}>
                      {DEDUCTION_CATEGORY_LABELS[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(Number(item.amount))}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_approved ? (
                      <Badge variant="outline" className="border-green-200 text-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        OK
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Review
                      </Badge>
                    )}
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
                        {!item.is_approved && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApprove(item.id)}
                              disabled={isLoading === item.id}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading === item.id}
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
