/**
 * @fileoverview Super Contribution List Component
 * @description Displays super contributions with cap tracking progress bars.
 * Features responsive design with card view on mobile and table view on larger screens.
 *
 * @features
 * - Concessional and non-concessional cap progress tracking
 * - Cap exceeded warnings with visual indicators
 * - Mobile-first card layout
 * - Desktop table view for dense data
 * - Color-coded contribution type badges
 * - Delete functionality
 *
 * @mobile Full-width cards with prominent cap progress and contribution cards
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
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Trash2, AlertTriangle, Coins, PiggyBank } from 'lucide-react';
import { deleteSuperContribution } from '@/lib/super/actions';
import type { SuperContribution, SuperContributionSummary } from '@/lib/types';
import { SUPER_CONTRIBUTION_TYPE_LABELS } from '@/lib/types';

/** Props interface for SuperContributionList component */
interface SuperContributionListProps {
  /** Array of super contribution records */
  contributions: SuperContribution[];
  /** Summary with cap usage and remaining amounts */
  summary: SuperContributionSummary;
}

/**
 * Color mapping for contribution type badges
 * Uses semantic colors to differentiate contribution types visually
 */
const typeColors: Record<string, string> = {
  employer_sg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  salary_sacrifice: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  personal_deductible: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  personal_non_deductible:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  spouse: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  government_co_contribution: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  low_income_super_offset: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200',
};

/**
 * Super Contribution List Component
 *
 * Displays super contributions with cap tracking and responsive layout.
 * Shows contribution cap progress and lists all contributions.
 *
 * @param props - Component props
 * @returns Rendered super contribution list with cap summary
 */
export function SuperContributionList({ contributions, summary }: SuperContributionListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Formats a number as Australian currency without decimal places
   * @param amount - Number to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);

  /**
   * Formats a date string in Australian format
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
   * Handles contribution deletion with confirmation
   * @param id - Contribution ID to delete
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;

    setIsDeleting(id);
    try {
      await deleteSuperContribution(id);
    } catch (error) {
      console.error('Error deleting contribution:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Calculate cap percentages
  const concessionalPercent = (summary.concessional_contributions / summary.concessional_cap) * 100;
  const nonConcessionalPercent =
    (summary.non_concessional_contributions / summary.non_concessional_cap) * 100;

  const personName = summary.person === 'grant' ? 'Grant' : 'Shannon';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cap Summary Cards - Stack on mobile */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Concessional Cap Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Coins className="h-4 w-4 text-purple-600" />
              Concessional Cap
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">
              Pre-tax (employer SG, salary sacrifice, deductible)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <Progress
              value={Math.min(concessionalPercent, 100)}
              className={`h-2.5 sm:h-3 ${concessionalPercent > 100 ? 'bg-red-200' : ''}`}
            />
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium tabular-nums">
                {formatCurrency(summary.concessional_contributions)}
              </span>
              <span className="text-muted-foreground">
                of {formatCurrency(summary.concessional_cap)}
              </span>
            </div>
            {concessionalPercent > 100 ? (
              <p className="text-destructive flex items-center gap-1.5 text-xs sm:text-sm">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Cap exceeded by{' '}
                {formatCurrency(summary.concessional_contributions - summary.concessional_cap)}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs sm:text-sm">
                <span className="text-foreground font-medium">
                  {formatCurrency(summary.concessional_remaining)}
                </span>{' '}
                remaining
              </p>
            )}
          </CardContent>
        </Card>

        {/* Non-Concessional Cap Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <PiggyBank className="h-4 w-4 text-orange-600" />
              Non-Concessional Cap
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">
              After-tax (personal non-deductible, spouse)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <Progress
              value={Math.min(nonConcessionalPercent, 100)}
              className={`h-2.5 sm:h-3 ${nonConcessionalPercent > 100 ? 'bg-red-200' : ''}`}
            />
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium tabular-nums">
                {formatCurrency(summary.non_concessional_contributions)}
              </span>
              <span className="text-muted-foreground">
                of {formatCurrency(summary.non_concessional_cap)}
              </span>
            </div>
            {nonConcessionalPercent > 100 ? (
              <p className="text-destructive flex items-center gap-1.5 text-xs sm:text-sm">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Cap exceeded by{' '}
                {formatCurrency(
                  summary.non_concessional_contributions - summary.non_concessional_cap
                )}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs sm:text-sm">
                <span className="text-foreground font-medium">
                  {formatCurrency(summary.non_concessional_remaining)}
                </span>{' '}
                remaining
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contributions List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Coins className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
            Super Contributions - {personName}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} for{' '}
            {summary.financial_year}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {contributions.length === 0 ? (
            <div className="p-4 text-center sm:p-0 sm:text-left">
              <p className="text-muted-foreground text-xs sm:text-sm">
                No super contributions recorded. Add employer SG, salary sacrifice, or personal
                contributions.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block divide-y sm:hidden">
                {contributions.map((item) => (
                  <div key={item.id} className="space-y-3 p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.fund_name}</p>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${typeColors[item.contribution_type]}`}
                        >
                          {SUPER_CONTRIBUTION_TYPE_LABELS[item.contribution_type]}
                        </Badge>
                        <Badge
                          variant={item.is_concessional ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {item.is_concessional ? 'Pre-tax' : 'After-tax'}
                        </Badge>
                      </div>
                      <span className="text-lg font-semibold text-purple-600 tabular-nums dark:text-purple-400">
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
                      <TableHead>Fund</TableHead>
                      <TableHead className="w-[160px]">Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px] text-center">Tax Type</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((item) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                        <TableCell className="font-medium">{item.fund_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeColors[item.contribution_type]}>
                            {SUPER_CONTRIBUTION_TYPE_LABELS[item.contribution_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(Number(item.amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.is_concessional ? 'default' : 'outline'}>
                            {item.is_concessional ? 'Pre-tax' : 'After-tax'}
                          </Badge>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
