/**
 * @fileoverview Trust Distribution List Component
 * @description Displays trust distributions with beneficiary details,
 * amounts, franking credits, and payment status.
 *
 * @features
 * - Mobile card view + desktop table view
 * - Distribution type badges
 * - Payment status indicators (Paid/Pending)
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
import { MoreHorizontal, Trash2, CheckCircle, Clock, ArrowRightLeft } from 'lucide-react';
import { deleteTrustDistribution } from '@/lib/trust/actions';
import type { TrustDistribution } from '@/lib/types';

/** Props interface for DistributionList component */
interface DistributionListProps {
  /** Array of trust distributions */
  distributions: TrustDistribution[];
}

/** Distribution type display labels */
const typeLabels: Record<string, string> = {
  income: 'Income',
  capital: 'Capital',
  mixed: 'Mixed',
};

/** Distribution type color classes */
const typeColors: Record<string, string> = {
  income: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  capital: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mixed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
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
 * Distribution List Component
 *
 * Displays trust distributions in a mobile-friendly card view
 * on small screens and a table view on larger screens.
 *
 * @param props - Component props
 * @returns Rendered distribution list
 */
export function DistributionList({ distributions }: DistributionListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Handles distribution deletion with confirmation
   *
   * @param id - Distribution ID to delete
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this distribution?')) return;

    setIsDeleting(id);
    try {
      await deleteTrustDistribution(id);
    } catch (error) {
      console.error('Error deleting distribution:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (distributions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ArrowRightLeft className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            Distribution History
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            No distributions recorded for this financial year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Record distributions to beneficiaries using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDistributed = distributions.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalFranking = distributions.reduce(
    (sum, d) => sum + Number(d.franking_credits_streamed),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ArrowRightLeft className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          Distribution History
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {distributions.length} distribution{distributions.length !== 1 ? 's' : ''} totalling{' '}
          <span className="font-medium tabular-nums">{formatCurrency(totalDistributed)}</span> with{' '}
          <span className="font-medium tabular-nums">{formatCurrency(totalFranking)}</span> franking
          credits
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Mobile Card View */}
        <div className="block divide-y sm:hidden">
          {distributions.map((distribution) => (
            <div key={distribution.id} className="space-y-3 p-4">
              {/* Header row with beneficiary and actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {distribution.beneficiary?.name || 'Unknown'}
                  </p>
                  <p className="text-muted-foreground text-xs">{formatDate(distribution.date)}</p>
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
                      onClick={() => handleDelete(distribution.id)}
                      disabled={isDeleting === distribution.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={typeColors[distribution.distribution_type]}>
                  {typeLabels[distribution.distribution_type]}
                </Badge>
                {distribution.is_paid ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Paid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
              </div>

              {/* Amount details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-[10px]">Amount</p>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(Number(distribution.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Franking</p>
                  <p className="font-semibold tabular-nums">
                    {Number(distribution.franking_credits_streamed) > 0
                      ? formatCurrency(Number(distribution.franking_credits_streamed))
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
                <TableHead>Beneficiary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Franking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((distribution) => (
                <TableRow key={distribution.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(distribution.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {distribution.beneficiary?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={typeColors[distribution.distribution_type]}
                    >
                      {typeLabels[distribution.distribution_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(distribution.amount))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(distribution.franking_credits_streamed) > 0
                      ? formatCurrency(Number(distribution.franking_credits_streamed))
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {distribution.is_paid ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
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
                          onClick={() => handleDelete(distribution.id)}
                          disabled={isDeleting === distribution.id}
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
