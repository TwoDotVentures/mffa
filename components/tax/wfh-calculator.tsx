/**
 * @fileoverview Work From Home Calculator Component
 * @description Calculates WFH deductions using the ATO fixed-rate method (67c per hour).
 * Features interactive inputs for work periods and automatic calculation.
 *
 * @features
 * - Fixed rate method calculation (67 cents per hour for 2024-25)
 * - Hours per week and weeks worked inputs
 * - Period date range selection
 * - Real-time calculation preview
 * - Mobile-optimized form layout with touch-friendly inputs
 *
 * @mobile Full-width form fields with 44px minimum touch targets
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Calculator, Check, Loader2 } from 'lucide-react';
import { addWFHDeduction } from '@/lib/deductions/actions';
import type { PersonType } from '@/lib/types';

/** Props interface for WFHCalculator component */
interface WFHCalculatorProps {
  /** Person for whom the deduction is being calculated */
  person: PersonType;
}

/** Fixed hourly rate for WFH deductions as per ATO guidelines (2024-25) */
const WFH_RATE = 0.67;

/**
 * Work From Home Calculator Component
 *
 * Provides an interactive calculator for WFH deductions using the
 * ATO fixed-rate method. Calculates based on hours per week and weeks worked.
 *
 * @param props - Component props
 * @returns Rendered WFH calculator
 */
export function WFHCalculator({ person }: WFHCalculatorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [weeksWorked, setWeeksWorked] = useState('48');
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const fyStart =
      now.getMonth() >= 6
        ? new Date(now.getFullYear(), 6, 1)
        : new Date(now.getFullYear() - 1, 6, 1);
    return fyStart.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate totals
  const totalHours = (Number(hoursPerWeek) || 0) * (Number(weeksWorked) || 0);
  const totalDeduction = totalHours * WFH_RATE;

  /**
   * Handles form submission to save the WFH deduction
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await addWFHDeduction(
        person,
        totalHours,
        periodStart,
        periodEnd,
        `${hoursPerWeek} hours/week for ${weeksWorked} weeks`
      );

      if (result.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => {
          setHoursPerWeek('');
          setWeeksWorked('48');
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to add WFH deduction');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const personName = person === 'grant' ? 'Grant' : 'Shannon';

  /**
   * Formats a number as Australian currency
   * @param amount - Number to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Home className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
          WFH Calculator
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Calculate WFH deduction using the fixed rate method (
          <span className="font-medium">67c/hour</span> for 2024-25)
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Hours and Weeks Inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek" className="text-xs sm:text-sm">
                Hours per Week
              </Label>
              <Input
                id="hoursPerWeek"
                type="number"
                min="0"
                max="50"
                step="0.5"
                placeholder="e.g., 20"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className="h-11 text-sm sm:h-10"
                required
              />
              <p className="text-muted-foreground text-[10px] sm:text-xs">
                Average hours worked from home each week
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeksWorked" className="text-xs sm:text-sm">
                Weeks Worked
              </Label>
              <Input
                id="weeksWorked"
                type="number"
                min="1"
                max="52"
                placeholder="48"
                value={weeksWorked}
                onChange={(e) => setWeeksWorked(e.target.value)}
                className="h-11 text-sm sm:h-10"
                required
              />
              <p className="text-muted-foreground text-[10px] sm:text-xs">
                Total weeks (excluding leave)
              </p>
            </div>
          </div>

          {/* Period Date Range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodStart" className="text-xs sm:text-sm">
                Period Start
              </Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="h-11 text-sm sm:h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd" className="text-xs sm:text-sm">
                Period End
              </Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-11 text-sm sm:h-10"
                required
              />
            </div>
          </div>

          {/* Calculation Preview */}
          {totalHours > 0 && (
            <div className="bg-primary/5 space-y-3 rounded-lg border-2 border-dashed p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium sm:text-base">
                <Calculator className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                Calculation Preview
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-medium tabular-nums">{totalHours.toFixed(1)} hours</span>
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium tabular-nums">${WFH_RATE} per hour</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium sm:text-base">Deduction:</span>
                <span className="text-primary text-xl font-bold sm:text-2xl">
                  {formatCurrency(totalDeduction)}
                </span>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                WFH deduction of {formatCurrency(totalDeduction)} added for {personName}!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">{error}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || totalHours === 0}
            className="h-11 w-full gap-2 sm:h-10 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>Add WFH Deduction for {personName}</>
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
