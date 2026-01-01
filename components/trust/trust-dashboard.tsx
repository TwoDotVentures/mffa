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
import { DollarSign, TrendingUp, Calendar, AlertTriangle, Wallet } from 'lucide-react';
import type { TrustSummary } from '@/lib/types';

interface TrustDashboardProps {
  summary: TrustSummary;
}

export function TrustDashboard({ summary }: TrustDashboardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const isUrgent = summary.days_until_eofy <= 30;
  const isWarning = summary.days_until_eofy <= 60 && summary.days_until_eofy > 30;

  return (
    <div className="space-y-6">
      {/* EOFY Warning */}
      {(isUrgent || isWarning) && summary.distributable_amount > 0 && (
        <Alert variant={isUrgent ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Distribution Deadline Approaching</AlertTitle>
          <AlertDescription>
            {summary.days_until_eofy} days until 30 June.{' '}
            {formatCurrency(summary.distributable_amount)} must be distributed to
            beneficiaries before the end of the financial year.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.income_ytd)}
            </div>
            <p className="text-xs text-muted-foreground">
              Financial Year {getCurrentFY()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franking Credits</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.franking_credits_ytd)}
            </div>
            <p className="text-xs text-muted-foreground">Available for streaming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.distributable_amount > 0
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              }`}
            >
              {formatCurrency(summary.distributable_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              After {formatCurrency(summary.distributions_ytd)} distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EOFY Countdown</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'
                }
              >
                {summary.days_until_eofy} days
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Until 30 June</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7
    ? `${year}-${(year + 1).toString().slice(-2)}`
    : `${year - 1}-${year.toString().slice(-2)}`;
}
