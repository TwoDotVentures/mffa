/**
 * School Fees Summary Component
 *
 * Displays an overview of all school fees with summaries and breakdowns.
 * Mobile-first responsive design with:
 * - 2-column grid on mobile, 4-column on desktop for stats
 * - Stacked card layout on mobile
 * - Touch-friendly fee items
 * - Clear overdue warnings
 *
 * @module components/family-members/school-fees-summary
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { getFeesByYear, getUpcomingFees, getOverdueFees } from '@/lib/family-members/actions';
import { formatCurrency, formatDate } from '@/lib/family-members/utils';
import type { SchoolFee } from '@/lib/types';

interface SchoolFeesSummaryProps {
  /** Year to display fees for (defaults to current year) */
  year?: number;
}

/**
 * School Fees Summary Component
 * Provides an overview dashboard of all school fees
 */
export function SchoolFeesSummary({ year }: SchoolFeesSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [allFees, setAllFees] = useState<SchoolFee[]>([]);
  const [upcomingFees, setUpcomingFees] = useState<SchoolFee[]>([]);
  const [overdueFees, setOverdueFees] = useState<SchoolFee[]>([]);
  const currentYear = year || new Date().getFullYear();

  /** Load all fee data on year change */
  useEffect(() => {
    loadData();
  }, [currentYear]);

  /** Fetch fees from server */
  async function loadData() {
    try {
      setLoading(true);
      const [fees, upcoming, overdue] = await Promise.all([
        getFeesByYear(currentYear),
        getUpcomingFees(30),
        getOverdueFees(),
      ]);
      setAllFees(fees);
      setUpcomingFees(upcoming);
      setOverdueFees(overdue);
    } catch (error) {
      console.error('Error loading fee data:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  /** Calculate totals */
  const totalFees = allFees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = allFees.filter((f) => f.is_paid).reduce((sum, f) => sum + (f.paid_amount || f.amount), 0);
  const remainingFees = totalFees - paidFees;
  const paidPercentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

  /** Group fees by child */
  const feesByChild = allFees.reduce((acc, fee) => {
    const childName = fee.enrolment?.family_member?.name || 'Unknown';
    if (!acc[childName]) {
      acc[childName] = { total: 0, paid: 0 };
    }
    acc[childName].total += fee.amount;
    if (fee.is_paid) {
      acc[childName].paid += fee.paid_amount || fee.amount;
    }
    return acc;
  }, {} as Record<string, { total: number; paid: number }>);

  /** Group fees by type */
  const feesByType = allFees.reduce((acc, fee) => {
    const typeName = fee.fee_type?.name || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = 0;
    }
    acc[typeName] += fee.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Overview Stat Cards - 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
        {/* Total Fees */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Total Fees</span>
            </div>
            <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">{formatCurrency(totalFees)}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">{currentYear}</p>
          </CardContent>
        </Card>

        {/* Paid */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Paid</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-green-600 sm:mt-2 sm:text-2xl">
              {formatCurrency(paidFees)}
            </p>
            <Progress value={paidPercentage} className="mt-1.5 h-1.5 sm:mt-2 sm:h-2" />
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
              {paidPercentage.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        {/* Remaining */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Remaining</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-amber-600 sm:mt-2 sm:text-2xl">
              {formatCurrency(remainingFees)}
            </p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {allFees.filter((f) => !f.is_paid).length} fees unpaid
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className={`overflow-hidden ${overdueFees.length > 0 ? 'border-destructive' : ''}`}>
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AlertCircle
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  overdueFees.length > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Overdue</span>
            </div>
            <p
              className={`mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl ${
                overdueFees.length > 0 ? 'text-destructive' : ''
              }`}
            >
              {overdueFees.length}
            </p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {overdueFees.length > 0
                ? formatCurrency(overdueFees.reduce((sum, f) => sum + f.amount, 0))
                : 'All caught up!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Row - Stacked on mobile */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Fees by Child */}
        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Fees by Child</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            {Object.keys(feesByChild).length === 0 ? (
              <p className="text-xs text-muted-foreground sm:text-sm">No fees recorded</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(feesByChild).map(([name, data]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium">{name}</span>
                      <span>{formatCurrency(data.total)}</span>
                    </div>
                    <Progress
                      value={data.total > 0 ? (data.paid / data.total) * 100 : 0}
                      className="mt-1 h-1.5 sm:h-2"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                      {formatCurrency(data.paid)} paid • {formatCurrency(data.total - data.paid)} remaining
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Fees */}
        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold sm:gap-2 sm:text-base">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Upcoming (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            {upcomingFees.length === 0 ? (
              <p className="text-xs text-muted-foreground sm:text-sm">No upcoming fees due</p>
            ) : (
              <div className="space-y-2">
                {upcomingFees.slice(0, 5).map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 sm:p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium sm:text-sm">{fee.description}</p>
                      <p className="text-[10px] text-muted-foreground sm:text-xs">
                        {fee.enrolment?.family_member?.name} •{' '}
                        {fee.due_date && formatDate(fee.due_date)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                      {formatCurrency(fee.amount)}
                    </Badge>
                  </div>
                ))}
                {upcomingFees.length > 5 && (
                  <p className="text-center text-[10px] text-muted-foreground sm:text-xs">
                    +{upcomingFees.length - 5} more fees
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Section */}
      {overdueFees.length > 0 && (
        <Card className="overflow-hidden border-destructive">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-destructive sm:gap-2 sm:text-base">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Overdue Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="space-y-2">
              {overdueFees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium sm:text-base">{fee.description}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {fee.enrolment?.family_member?.name} •{' '}
                      {fee.enrolment?.school?.name}
                    </p>
                    <p className="text-[10px] text-destructive sm:text-xs">
                      Due: {fee.due_date && formatDate(fee.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end">
                    <Badge variant="destructive" className="text-xs sm:text-sm">
                      {formatCurrency(fee.amount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown by Type */}
      {Object.keys(feesByType).length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Fees by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {Object.entries(feesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
                  >
                    <span className="truncate text-xs sm:text-sm">{type}</span>
                    <span className="ml-2 shrink-0 text-xs font-medium sm:text-sm">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
