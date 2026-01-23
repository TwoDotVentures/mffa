/**
 * @fileoverview Tax Dashboard Component
 * @description Displays comprehensive tax summary metrics including income, deductions,
 * tax calculations, and super contribution status. Features responsive card layout
 * optimized for mobile devices.
 *
 * @features
 * - Tax refund/owing alert banner
 * - Summary cards for income, deductions, tax withheld, and refund
 * - Detailed tax breakdown panel
 * - EOFY countdown with urgency indicators
 * - Super cap utilization progress bar
 *
 * @mobile Stacked cards on mobile, 2-4 column grid on larger screens
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  Calendar,
  Coins,
} from 'lucide-react';
import type { TaxSummary, SuperContributionSummary } from '@/lib/types';

/** Props interface for TaxDashboard component */
interface TaxDashboardProps {
  /** Tax summary data with income, deductions, and calculations */
  summary: TaxSummary;
  /** Optional super contribution summary for cap tracking */
  superSummary?: SuperContributionSummary;
  /** Number of days until end of financial year */
  daysUntilEOFY: number;
}

/**
 * Formats a number as Australian currency without decimal places
 *
 * @param amount - Number to format
 * @returns Formatted currency string (e.g., "$50,000")
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Tax Dashboard Component
 *
 * Renders a comprehensive overview of the user's tax position including
 * income, deductions, estimated tax, and super contribution status.
 *
 * @param props - Component props
 * @returns Rendered dashboard with responsive card layout
 */
export function TaxDashboard({ summary, superSummary, daysUntilEOFY }: TaxDashboardProps) {
  // Determine refund status
  const isRefund = summary.estimated_refund_or_owing < 0;
  const refundAmount = Math.abs(summary.estimated_refund_or_owing);

  // EOFY urgency levels
  const isUrgent = daysUntilEOFY <= 30;
  const isWarning = daysUntilEOFY <= 60 && daysUntilEOFY > 30;

  // Super cap utilization percentage
  const superCapUsed = superSummary
    ? (superSummary.concessional_contributions / superSummary.concessional_cap) * 100
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tax Alert Banner - Full width, prominent on mobile */}
      {summary.estimated_refund_or_owing !== 0 && (
        <Alert
          variant={isRefund ? 'default' : 'destructive'}
          className="border-l-4 border-l-current"
        >
          <div className="flex items-start gap-3">
            {isRefund ? (
              <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <AlertTitle className="text-base font-semibold sm:text-lg">
                {isRefund ? 'Estimated Tax Refund' : 'Estimated Tax Payable'}
              </AlertTitle>
              <AlertDescription className="mt-1 text-sm sm:text-base">
                Based on your current income and deductions, you&apos;re estimated to{' '}
                {isRefund ? 'receive a refund of' : 'owe'}{' '}
                <strong className="text-base sm:text-lg">{formatCurrency(refundAmount)}</strong>.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Summary Cards - 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Income Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Total Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight sm:text-2xl">
              {formatCurrency(summary.income.total)}
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs">
              + {formatCurrency(summary.income.franking_credits)} franking
            </p>
          </CardContent>
        </Card>

        {/* Total Deductions Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Deductions
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight sm:text-2xl">
              {formatCurrency(summary.deductions.total)}
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs">
              Taxable: {formatCurrency(summary.estimated_tax.taxable_income)}
            </p>
          </CardContent>
        </Card>

        {/* Tax Withheld Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Tax Withheld
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight sm:text-2xl">
              {formatCurrency(summary.tax_withheld)}
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs">
              Est: {formatCurrency(summary.estimated_tax.net_tax_payable)}
            </p>
          </CardContent>
        </Card>

        {/* Refund/Owing Card */}
        <Card className="relative overflow-hidden">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
              isRefund ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent'
            }`}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              {isRefund ? 'Refund' : 'Owing'}
            </CardTitle>
            {isRefund ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-xl font-bold tracking-tight sm:text-2xl ${
                isRefund ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isRefund ? '+' : '-'}
              {formatCurrency(refundAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs">
              {summary.estimated_tax.marginal_tax_rate}% marginal rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Tax Breakdown and EOFY Info */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tax Breakdown Panel - Spans 2 columns on large screens */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm font-semibold sm:text-base">Tax Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {summary.estimated_tax.tax_bracket}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {/* Tax line items */}
              <div className="flex justify-between py-1 text-xs sm:text-sm">
                <span className="text-muted-foreground">Income Tax</span>
                <span className="font-medium">
                  {formatCurrency(summary.estimated_tax.income_tax)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-xs sm:text-sm">
                <span className="text-muted-foreground">Medicare Levy</span>
                <span className="font-medium">
                  {formatCurrency(summary.estimated_tax.medicare_levy)}
                </span>
              </div>
              {summary.estimated_tax.medicare_surcharge > 0 && (
                <div className="flex justify-between py-1 text-xs sm:text-sm">
                  <span className="text-muted-foreground">Medicare Surcharge</span>
                  <span className="font-medium">
                    {formatCurrency(summary.estimated_tax.medicare_surcharge)}
                  </span>
                </div>
              )}
              {summary.estimated_tax.hecs_repayment > 0 && (
                <div className="flex justify-between py-1 text-xs sm:text-sm">
                  <span className="text-muted-foreground">HECS Repayment</span>
                  <span className="font-medium">
                    {formatCurrency(summary.estimated_tax.hecs_repayment)}
                  </span>
                </div>
              )}

              {/* Subtotal separator */}
              <div className="space-y-2 border-t pt-2 sm:pt-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Total Before Offsets</span>
                  <span className="font-medium">
                    {formatCurrency(summary.estimated_tax.total_tax_before_offsets)}
                  </span>
                </div>
                {summary.estimated_tax.franking_credit_offset > 0 && (
                  <div className="flex justify-between text-xs text-green-600 sm:text-sm">
                    <span>Less: Franking Credits</span>
                    <span className="font-medium">
                      -{formatCurrency(summary.estimated_tax.franking_credit_offset)}
                    </span>
                  </div>
                )}
              </div>

              {/* Net total */}
              <div className="border-t pt-2 sm:pt-3">
                <div className="flex justify-between text-sm font-semibold sm:text-base">
                  <span>Net Tax Payable</span>
                  <span>{formatCurrency(summary.estimated_tax.net_tax_payable)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EOFY & Super Card */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm font-semibold sm:text-base">Financial Year</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {summary.financial_year}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            {/* EOFY Countdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-xs sm:text-sm">Days until EOFY</span>
              </div>
              <Badge
                variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'}
                className="px-2 py-1 text-xs font-semibold sm:px-3 sm:text-sm"
              >
                {daysUntilEOFY} days
              </Badge>
            </div>

            {/* Super Cap Progress */}
            {superSummary && (
              <div className="space-y-3 border-t pt-4 sm:pt-5">
                <div className="flex items-center gap-2">
                  <Coins className="text-muted-foreground h-4 w-4" />
                  <span className="text-xs font-medium sm:text-sm">Super Cap Usage</span>
                </div>
                <div className="space-y-2">
                  <Progress
                    value={Math.min(superCapUsed, 100)}
                    className={`h-2.5 sm:h-3 ${superCapUsed >= 100 ? 'bg-red-200' : ''}`}
                  />
                  <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
                    <span>{formatCurrency(superSummary.concessional_contributions)}</span>
                    <span>{formatCurrency(superSummary.concessional_cap)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    <span className="text-foreground font-medium">
                      {formatCurrency(superSummary.concessional_remaining)}
                    </span>{' '}
                    remaining
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
