'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ContributionSummary } from '@/lib/smsf/actions';

interface ContributionTrackerProps {
  summary: ContributionSummary;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function CapProgress({
  label,
  used,
  cap,
  remaining,
  percentage,
  type,
}: {
  label: string;
  used: number;
  cap: number;
  remaining: number;
  percentage: number;
  type: 'concessional' | 'non_concessional';
}) {
  const isNearCap = percentage >= 80;
  const isAtCap = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={isAtCap ? 'destructive' : isNearCap ? 'secondary' : 'outline'}>
          {formatCurrency(remaining)} remaining
        </Badge>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-3" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Used: {formatCurrency(used)}</span>
        <span>Cap: {formatCurrency(cap)}</span>
      </div>
      {isNearCap && !isAtCap && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Approaching contribution cap
        </p>
      )}
      {isAtCap && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Cap reached - excess contributions may be taxed
        </p>
      )}
    </div>
  );
}

export function ContributionTracker({ summary }: ContributionTrackerProps) {
  const hasCarryForward = summary.carryForward.available > 0 && summary.carryForward.eligible;
  const totalConcessionalCap = summary.concessional.cap + (hasCarryForward ? summary.carryForward.available : 0);
  const effectiveConcessionalRemaining = totalConcessionalCap - summary.concessional.used;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {summary.memberName}&apos;s Contribution Caps
        </CardTitle>
        <CardDescription>
          Financial Year {summary.financialYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Concessional (Before-Tax) */}
        <CapProgress
          label="Concessional (Before-Tax)"
          used={summary.concessional.used}
          cap={summary.concessional.cap}
          remaining={summary.concessional.remaining}
          percentage={summary.concessional.percentage}
          type="concessional"
        />

        {/* Carry-Forward Info */}
        {summary.carryForward.eligible && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {hasCarryForward ? (
                <>
                  <strong>Carry-forward available:</strong> {formatCurrency(summary.carryForward.available)}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Total concessional cap including carry-forward: {formatCurrency(totalConcessionalCap)}
                    {effectiveConcessionalRemaining > 0 && (
                      <> ({formatCurrency(effectiveConcessionalRemaining)} remaining)</>
                    )}
                  </span>
                  <ul className="mt-2 text-xs">
                    {summary.carryForward.breakdown.map((cf) => (
                      <li key={cf.year}>
                        {cf.year}: {formatCurrency(cf.amount)} unused
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <strong>Eligible for carry-forward</strong>
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Total super balance is under $500,000. Any unused concessional cap from previous years can be carried forward.
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!summary.carryForward.eligible && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Not eligible for carry-forward</strong>
              <br />
              <span className="text-xs">
                Total super balance exceeds $500,000 threshold.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Non-Concessional (After-Tax) */}
        <CapProgress
          label="Non-Concessional (After-Tax)"
          used={summary.nonConcessional.used}
          cap={summary.nonConcessional.cap}
          remaining={summary.nonConcessional.remaining}
          percentage={summary.nonConcessional.percentage}
          type="non_concessional"
        />

        {/* Summary */}
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Contribution Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Contributed (FY)</p>
              <p className="font-semibold">
                {formatCurrency(summary.concessional.used + summary.nonConcessional.used)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Remaining Caps</p>
              <p className="font-semibold">
                {formatCurrency(effectiveConcessionalRemaining + summary.nonConcessional.remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          {summary.concessional.percentage < 80 && summary.nonConcessional.percentage < 80 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-700">Well within contribution limits</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-amber-700">Monitor contribution levels carefully</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
