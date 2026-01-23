/**
 * @fileoverview Distribution Modeller Component
 * @description Compares different distribution splits between beneficiaries
 * to minimize total tax payable using franking credit optimization.
 *
 * @features
 * - Distribution scenario comparison table
 * - Optimal split recommendation with tax savings
 * - Other income inputs for accurate tax calculations
 * - Franking credit allocation display
 * - Mobile-responsive table with horizontal scroll
 *
 * @mobile Horizontally scrollable comparison table
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Loader2 } from 'lucide-react';
import { modelDistribution } from '@/lib/trust/actions';
import type { DistributionScenario } from '@/lib/types';

/** Props interface for DistributionModeller component */
interface DistributionModellerProps {
  /** Total distributable amount available */
  distributableAmount: number;
  /** Total franking credits available to stream */
  frankingCredits: number;
}

/** Preset distribution splits to compare */
const PRESET_SPLITS = [
  { grant: 50, shannon: 50 },
  { grant: 60, shannon: 40 },
  { grant: 70, shannon: 30 },
  { grant: 40, shannon: 60 },
  { grant: 100, shannon: 0 },
  { grant: 0, shannon: 100 },
];

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
 * Distribution Modeller Component
 *
 * Allows comparison of different distribution splits to find
 * the optimal allocation that minimizes total tax payable.
 *
 * @param props - Component props
 * @returns Rendered distribution modeller
 */
export function DistributionModeller({
  distributableAmount,
  frankingCredits,
}: DistributionModellerProps) {
  const [grantOtherIncome, setGrantOtherIncome] = useState(100000);
  const [shannonOtherIncome, setShannonOtherIncome] = useState(50000);
  const [scenarios, setScenarios] = useState<DistributionScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      setIsLoading(true);
      try {
        const results = await modelDistribution(
          distributableAmount,
          frankingCredits,
          grantOtherIncome,
          shannonOtherIncome,
          PRESET_SPLITS
        );
        setScenarios(results);
      } catch (error) {
        console.error('Error modelling distribution:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, [distributableAmount, frankingCredits, grantOtherIncome, shannonOtherIncome]);

  const bestScenario =
    scenarios.length > 0
      ? scenarios.reduce((best, s) => (s.total_tax < best.total_tax ? s : best))
      : null;

  if (distributableAmount <= 0) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
            Distribution Modeller
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            No distributable amount available. Add income to the trust first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calculator className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
          Distribution Modeller
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Compare different distribution splits to minimise total tax payable.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Distributable Summary */}
        <div className="bg-muted/50 rounded-lg border p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Distributable Amount</p>
              <p className="text-lg font-bold tabular-nums sm:text-2xl">
                {formatCurrency(distributableAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Franking Credits</p>
              <p className="text-lg font-bold tabular-nums sm:text-2xl">
                {formatCurrency(frankingCredits)}
              </p>
            </div>
          </div>
        </div>

        {/* Other Income Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="grantIncome" className="text-xs sm:text-sm">
              Grant&apos;s Other Income (excl. trust)
            </Label>
            <Input
              id="grantIncome"
              type="number"
              value={grantOtherIncome}
              onChange={(e) => setGrantOtherIncome(Number(e.target.value))}
              className="h-10 text-sm sm:h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shannonIncome" className="text-xs sm:text-sm">
              Shannon&apos;s Other Income (excl. trust)
            </Label>
            <Input
              id="shannonIncome"
              type="number"
              value={shannonOtherIncome}
              onChange={(e) => setShannonOtherIncome(Number(e.target.value))}
              className="h-10 text-sm sm:h-9"
            />
          </div>
        </div>

        {/* Scenario Comparison Table - Mobile horizontal scroll */}
        <div className="-mx-4 overflow-hidden rounded-lg border sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left text-xs font-medium sm:p-3 sm:text-sm">Split</th>
                  <th className="p-2 text-right text-xs font-medium sm:p-3 sm:text-sm">Grant</th>
                  <th className="p-2 text-right text-xs font-medium sm:p-3 sm:text-sm">Shannon</th>
                  <th className="p-2 text-right text-xs font-medium sm:p-3 sm:text-sm">
                    Total Tax
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs sm:text-sm">Calculating scenarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  scenarios.map((s, i) => (
                    <tr
                      key={i}
                      className={`border-t ${
                        bestScenario?.grant_percentage === s.grant_percentage
                          ? 'bg-green-50 dark:bg-green-950'
                          : ''
                      }`}
                    >
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs font-medium sm:text-sm">
                            {s.grant_percentage}/{s.shannon_percentage}
                          </span>
                          {bestScenario?.grant_percentage === s.grant_percentage && (
                            <Badge className="text-[10px] sm:text-xs" variant="secondary">
                              Best
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right sm:p-3">
                        <span className="text-xs font-medium tabular-nums sm:text-sm">
                          {formatCurrency(s.grant_amount)}
                        </span>
                        <span className="text-muted-foreground block text-[10px] tabular-nums sm:text-xs">
                          +{formatCurrency(s.grant_franking)} FC
                        </span>
                      </td>
                      <td className="p-2 text-right sm:p-3">
                        <span className="text-xs font-medium tabular-nums sm:text-sm">
                          {formatCurrency(s.shannon_amount)}
                        </span>
                        <span className="text-muted-foreground block text-[10px] tabular-nums sm:text-xs">
                          +{formatCurrency(s.shannon_franking)} FC
                        </span>
                      </td>
                      <td className="p-2 text-right text-xs font-semibold tabular-nums sm:p-3 sm:text-sm">
                        {formatCurrency(s.total_tax)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation */}
        {bestScenario && scenarios.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 sm:text-base dark:text-green-200">
              Recommended: {bestScenario.grant_percentage}/{bestScenario.shannon_percentage} split
            </p>
            <p className="mt-1 text-xs text-green-700 sm:text-sm dark:text-green-300">
              Saves{' '}
              <span className="font-semibold tabular-nums">
                {formatCurrency(scenarios[0].total_tax - bestScenario.total_tax)}
              </span>{' '}
              in tax compared to 50/50 split
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
