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
  year?: number;
}

export function SchoolFeesSummary({ year }: SchoolFeesSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [allFees, setAllFees] = useState<SchoolFee[]>([]);
  const [upcomingFees, setUpcomingFees] = useState<SchoolFee[]>([]);
  const [overdueFees, setOverdueFees] = useState<SchoolFee[]>([]);
  const currentYear = year || new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, [currentYear]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalFees = allFees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = allFees.filter((f) => f.is_paid).reduce((sum, f) => sum + (f.paid_amount || f.amount), 0);
  const remainingFees = totalFees - paidFees;
  const paidPercentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

  // Group by child
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

  // Group by fee type
  const feesByType = allFees.reduce((acc, fee) => {
    const typeName = fee.fee_type?.name || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = 0;
    }
    acc[typeName] += fee.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Fees</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-muted-foreground">{currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Paid</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(paidFees)}</p>
            <Progress value={paidPercentage} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{paidPercentage.toFixed(0)}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Remaining</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(remainingFees)}</p>
            <p className="text-xs text-muted-foreground">
              {allFees.filter((f) => !f.is_paid).length} fees unpaid
            </p>
          </CardContent>
        </Card>

        <Card className={overdueFees.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${overdueFees.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium text-muted-foreground">Overdue</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${overdueFees.length > 0 ? 'text-destructive' : ''}`}>
              {overdueFees.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {overdueFees.length > 0
                ? formatCurrency(overdueFees.reduce((sum, f) => sum + f.amount, 0))
                : 'All caught up!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Child */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fees by Child</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(feesByChild).length === 0 ? (
              <p className="text-sm text-muted-foreground">No fees recorded</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(feesByChild).map(([name, data]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span>{formatCurrency(data.total)}</span>
                    </div>
                    <Progress
                      value={data.total > 0 ? (data.paid / data.total) * 100 : 0}
                      className="mt-1 h-2"
                    />
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(data.paid)} paid • {formatCurrency(data.total - data.paid)} remaining
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming fees due</p>
            ) : (
              <div className="space-y-2">
                {upcomingFees.slice(0, 5).map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{fee.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee.enrolment?.family_member?.name} •{' '}
                        {fee.due_date && formatDate(fee.due_date)}
                      </p>
                    </div>
                    <Badge variant="secondary">{formatCurrency(fee.amount)}</Badge>
                  </div>
                ))}
                {upcomingFees.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground">
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
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Overdue Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueFees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div>
                    <p className="font-medium">{fee.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {fee.enrolment?.family_member?.name} •{' '}
                      {fee.enrolment?.school?.name}
                    </p>
                    <p className="text-xs text-destructive">
                      Due: {fee.due_date && formatDate(fee.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{formatCurrency(fee.amount)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown by Type */}
      {Object.keys(feesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fees by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(feesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">{type}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
