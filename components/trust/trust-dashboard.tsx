/**
 * @fileoverview Trust Dashboard Component
 * @description Displays comprehensive trust summary metrics including income,
 * franking credits, distributable amount, and EOFY countdown.
 *
 * @features
 * - EOFY warning banner for distribution deadline
 * - Summary cards for income, franking, distributable amount
 * - EOFY countdown with urgency indicators
 * - Color-coded alerts based on urgency
 *
 * @mobile 2x2 grid on mobile, 4 columns on desktop
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, AlertTriangle, Wallet } from 'lucide-react';
import type { TrustSummary } from '@/lib/types';

/** Props interface for TrustDashboard component */
interface TrustDashboardProps {
  /** Trust summary data with metrics */
  summary: TrustSummary;
}

/**
 * Formats a number as Australian currency without decimal places
 *
 * @param amount - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Gets the current financial year string
 *
 * @returns Financial year in format "YYYY-YY"
 */
function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7
    ? `${year}-${(year + 1).toString().slice(-2)}`
    : `${year - 1}-${year.toString().slice(-2)}`;
}

/**
 * Trust Dashboard Component
 *
 * Renders a comprehensive overview of trust metrics including
 * income, franking credits, and EOFY countdown.
 *
 * @param props - Component props
 * @returns Rendered dashboard with responsive card layout
 */
export function TrustDashboard({ summary }: TrustDashboardProps) {
  const isUrgent = summary.days_until_eofy <= 30;
  const isWarning = summary.days_until_eofy <= 60 && summary.days_until_eofy > 30;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* EOFY Warning - Full width alert */}
      {(isUrgent || isWarning) && summary.distributable_amount > 0 && (
        <Alert
          variant={isUrgent ? 'destructive' : 'default'}
          className="border-l-4 border-l-current"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <AlertTitle className="text-sm font-semibold sm:text-base">
                Distribution Deadline
              </AlertTitle>
              <AlertDescription className="mt-1 text-xs sm:text-sm">
                {summary.days_until_eofy} days until 30 June.{' '}
                <strong className="text-sm sm:text-base">
                  {formatCurrency(summary.distributable_amount)}
                </strong>{' '}
                must be distributed before EOFY.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Summary Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Income YTD Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Income YTD
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
              {formatCurrency(summary.income_ytd)}
            </div>
            <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs">FY {getCurrentFY()}</p>
          </CardContent>
        </Card>

        {/* Franking Credits Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Franking
            </CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
              {formatCurrency(summary.franking_credits_ytd)}
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs">
              For streaming
            </p>
          </CardContent>
        </Card>

        {/* Distributable Amount Card */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Distributable
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-xl font-bold tracking-tight tabular-nums sm:text-2xl ${
                summary.distributable_amount > 0 ? 'text-green-600 dark:text-green-400' : ''
              }`}
            >
              {formatCurrency(summary.distributable_amount)}
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs">
              After {formatCurrency(summary.distributions_ytd)} dist.
            </p>
          </CardContent>
        </Card>

        {/* EOFY Countdown Card */}
        <Card className="relative overflow-hidden">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
              isUrgent ? 'from-red-500/10' : isWarning ? 'from-orange-500/5' : 'from-gray-500/5'
            } to-transparent`}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              EOFY
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Badge
                variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'}
                className="px-2 py-1 text-sm font-bold sm:px-3 sm:text-base"
              >
                {summary.days_until_eofy}d
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Until 30 June</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
