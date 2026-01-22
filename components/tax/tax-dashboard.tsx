'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface TaxDashboardProps {
  summary: TaxSummary;
  superSummary?: SuperContributionSummary;
  daysUntilEOFY: number;
}

export function TaxDashboard({ summary, superSummary, daysUntilEOFY }: TaxDashboardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const isRefund = summary.estimated_refund_or_owing < 0;
  const refundAmount = Math.abs(summary.estimated_refund_or_owing);

  const isUrgent = daysUntilEOFY <= 30;
  const isWarning = daysUntilEOFY <= 60 && daysUntilEOFY > 30;

  // Super cap utilization
  const superCapUsed = superSummary
    ? (superSummary.concessional_contributions / superSummary.concessional_cap) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Tax Alert */}
      {summary.estimated_refund_or_owing !== 0 && (
        <Alert variant={isRefund ? 'default' : 'destructive'}>
          {isRefund ? (
            <TrendingDown className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {isRefund ? 'Estimated Tax Refund' : 'Estimated Tax Payable'}
          </AlertTitle>
          <AlertDescription>
            Based on your current income and deductions, you're estimated to{' '}
            {isRefund ? 'receive a refund of' : 'owe'}{' '}
            <strong>{formatCurrency(refundAmount)}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.income.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              + {formatCurrency(summary.income.franking_credits)} franking credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.deductions.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxable income: {formatCurrency(summary.estimated_tax.taxable_income)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Withheld</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.tax_withheld)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated tax: {formatCurrency(summary.estimated_tax.net_tax_payable)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRefund ? 'Refund' : 'Owing'}
            </CardTitle>
            {isRefund ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isRefund ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isRefund ? '+' : '-'}{formatCurrency(refundAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.estimated_tax.marginal_tax_rate}% marginal rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tax Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tax Breakdown</CardTitle>
            <CardDescription>{summary.estimated_tax.tax_bracket}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Income Tax</span>
                <span>{formatCurrency(summary.estimated_tax.income_tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medicare Levy</span>
                <span>{formatCurrency(summary.estimated_tax.medicare_levy)}</span>
              </div>
              {summary.estimated_tax.medicare_surcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Medicare Surcharge</span>
                  <span>{formatCurrency(summary.estimated_tax.medicare_surcharge)}</span>
                </div>
              )}
              {summary.estimated_tax.hecs_repayment > 0 && (
                <div className="flex justify-between text-sm">
                  <span>HECS Repayment</span>
                  <span>{formatCurrency(summary.estimated_tax.hecs_repayment)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>Total Tax Before Offsets</span>
                  <span>{formatCurrency(summary.estimated_tax.total_tax_before_offsets)}</span>
                </div>
                {summary.estimated_tax.franking_credit_offset > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Less: Franking Credits</span>
                    <span>-{formatCurrency(summary.estimated_tax.franking_credit_offset)}</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Net Tax Payable</span>
                  <span>{formatCurrency(summary.estimated_tax.net_tax_payable)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EOFY & Super */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Year</CardTitle>
            <CardDescription>{summary.financial_year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Days until EOFY</span>
              </div>
              <Badge variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'}>
                {daysUntilEOFY} days
              </Badge>
            </div>

            {superSummary && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Super Cap Usage</span>
                  </div>
                  <Progress value={Math.min(superCapUsed, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(superSummary.concessional_contributions)}</span>
                    <span>{formatCurrency(superSummary.concessional_cap)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(superSummary.concessional_remaining)} remaining
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
