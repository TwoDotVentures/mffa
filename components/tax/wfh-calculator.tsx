'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Calculator, Check } from 'lucide-react';
import { addWFHDeduction } from '@/lib/deductions/actions';
import type { PersonType, WFHCalculation } from '@/lib/types';

interface WFHCalculatorProps {
  person: PersonType;
}

const WFH_RATE = 0.67; // 67 cents per hour for 2024-25

export function WFHCalculator({ person }: WFHCalculatorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [weeksWorked, setWeeksWorked] = useState('48'); // Default 48 weeks
  const [periodStart, setPeriodStart] = useState(() => {
    // Default to start of current FY
    const now = new Date();
    const fyStart = now.getMonth() >= 6
      ? new Date(now.getFullYear(), 6, 1)
      : new Date(now.getFullYear() - 1, 6, 1);
    return fyStart.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    // Default to today or end of FY
    return new Date().toISOString().split('T')[0];
  });

  // Calculate totals
  const totalHours = (Number(hoursPerWeek) || 0) * (Number(weeksWorked) || 0);
  const totalDeduction = totalHours * WFH_RATE;

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
        // Reset form after a short delay
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Work From Home Calculator
        </CardTitle>
        <CardDescription>
          Calculate WFH deduction using the fixed rate method (67c/hour for 2024-25)
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours per Week</Label>
              <Input
                id="hoursPerWeek"
                type="number"
                min="0"
                max="50"
                step="0.5"
                placeholder="e.g., 20"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Average hours worked from home each week
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeksWorked">Weeks Worked</Label>
              <Input
                id="weeksWorked"
                type="number"
                min="1"
                max="52"
                placeholder="48"
                value={weeksWorked}
                onChange={(e) => setWeeksWorked(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Total weeks (excluding leave)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Calculation Preview */}
          {totalHours > 0 && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Calculation Preview
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-medium">{totalHours.toFixed(1)} hours</span>
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">${WFH_RATE} per hour</span>
                <span className="text-muted-foreground">Deduction:</span>
                <span className="font-bold text-green-600">
                  ${totalDeduction.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                WFH deduction of ${totalDeduction.toFixed(2)} added for {personName}!
              </AlertDescription>
            </Alert>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isLoading || totalHours === 0}>
            {isLoading ? 'Adding...' : `Add WFH Deduction for ${personName}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
