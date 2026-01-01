'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { modelDistribution } from '@/lib/trust/actions';
import type { DistributionScenario } from '@/lib/types';

interface DistributionModellerProps {
  distributableAmount: number;
  frankingCredits: number;
}

const PRESET_SPLITS = [
  { grant: 50, shannon: 50 },
  { grant: 60, shannon: 40 },
  { grant: 70, shannon: 30 },
  { grant: 40, shannon: 60 },
  { grant: 100, shannon: 0 },
  { grant: 0, shannon: 100 },
];

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const bestScenario =
    scenarios.length > 0
      ? scenarios.reduce((best, s) => (s.total_tax < best.total_tax ? s : best))
      : null;

  if (distributableAmount <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution Modeller</CardTitle>
          <CardDescription>
            No distributable amount available. Add income to the trust first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Modeller</CardTitle>
        <CardDescription>
          Compare different distribution splits between Grant and Shannon to minimise
          total tax payable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Distributable Summary */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Distributable Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(distributableAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Franking Credits</p>
              <p className="text-2xl font-bold">{formatCurrency(frankingCredits)}</p>
            </div>
          </div>
        </div>

        {/* Other Income Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grantIncome">Grant&apos;s Other Income (excl. trust)</Label>
            <Input
              id="grantIncome"
              type="number"
              value={grantOtherIncome}
              onChange={(e) => setGrantOtherIncome(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shannonIncome">Shannon&apos;s Other Income (excl. trust)</Label>
            <Input
              id="shannonIncome"
              type="number"
              value={shannonOtherIncome}
              onChange={(e) => setShannonOtherIncome(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Scenario Comparison Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Split</th>
                <th className="p-3 text-right text-sm font-medium">Grant Receives</th>
                <th className="p-3 text-right text-sm font-medium">Shannon Receives</th>
                <th className="p-3 text-right text-sm font-medium">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Calculating scenarios...
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
                    <td className="p-3">
                      <span className="font-medium">
                        {s.grant_percentage}/{s.shannon_percentage}
                      </span>
                      {bestScenario?.grant_percentage === s.grant_percentage && (
                        <Badge className="ml-2" variant="secondary">
                          Optimal
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(s.grant_amount)}
                      <span className="block text-xs text-muted-foreground">
                        +{formatCurrency(s.grant_franking)} FC
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(s.shannon_amount)}
                      <span className="block text-xs text-muted-foreground">
                        +{formatCurrency(s.shannon_franking)} FC
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(s.total_tax)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        {bestScenario && scenarios.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p className="font-medium text-green-800 dark:text-green-200">
              Recommended: {bestScenario.grant_percentage}/
              {bestScenario.shannon_percentage} split
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Saves {formatCurrency(scenarios[0].total_tax - bestScenario.total_tax)} in
              tax compared to 50/50 split
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
