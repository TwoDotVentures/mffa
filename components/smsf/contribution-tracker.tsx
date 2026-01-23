/**
 * @fileoverview SMSF Contribution Tracker Component
 * @description Displays contribution cap tracking for SMSF members with
 * concessional and non-concessional caps and carry-forward information.
 *
 * @features
 * - Concessional cap progress with percentage
 * - Non-concessional cap progress
 * - Carry-forward availability alerts
 * - Cap warning indicators (approaching/exceeded)
 * - Summary totals
 * - Mobile-optimized layout
 *
 * @mobile Full-width progress bars with clear numerical displays
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ContributionSummary } from '@/lib/smsf/actions';

/** Props interface for ContributionTracker component */
interface ContributionTrackerProps {
  /** Contribution summary data for a member */
  summary: ContributionSummary;
}

/**
 * Formats a number as Australian currency without decimal places
 *
 * @param amount - Number to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Cap Progress Sub-component
 *
 * Renders a progress bar for contribution cap tracking with
 * percentage, used amount, and cap limit.
 */
interface CapProgressProps {
  /** Label for the cap type */
  label: string;
  /** Amount used so far */
  used: number;
  /** Maximum cap amount */
  cap: number;
  /** Remaining amount */
  remaining: number;
  /** Usage percentage (0-100) */
  percentage: number;
  /** Type of contribution cap */
  type: 'concessional' | 'non_concessional';
}

function CapProgress({
  label,
  used,
  cap,
  remaining,
  percentage,
}: CapProgressProps) {
  const isNearCap = percentage >= 80;
  const isAtCap = percentage >= 100;

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium">{label}</span>
        <Badge
          variant={isAtCap ? 'destructive' : isNearCap ? 'secondary' : 'outline'}
          className="text-[10px] sm:text-xs"
        >
          {formatCurrency(remaining)} left
        </Badge>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2.5 sm:h-3" />
      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
        <span>Used: <span className="font-medium text-foreground tabular-nums">{formatCurrency(used)}</span></span>
        <span>Cap: <span className="font-medium text-foreground tabular-nums">{formatCurrency(cap)}</span></span>
      </div>
      {isNearCap && !isAtCap && (
        <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Approaching cap
        </p>
      )}
      {isAtCap && (
        <p className="text-[10px] sm:text-xs text-destructive flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Cap reached - excess may be taxed
        </p>
      )}
    </div>
  );
}

/**
 * Contribution Tracker Component
 *
 * Displays comprehensive contribution cap tracking for an SMSF member
 * including concessional, non-concessional, and carry-forward.
 *
 * @param props - Component props
 * @returns Rendered contribution tracker card
 */
export function ContributionTracker({ summary }: ContributionTrackerProps) {
  const hasCarryForward = summary.carryForward.available > 0 && summary.carryForward.eligible;
  const totalConcessionalCap = summary.concessional.cap + (hasCarryForward ? summary.carryForward.available : 0);
  const effectiveConcessionalRemaining = totalConcessionalCap - summary.concessional.used;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          <span className="truncate">{summary.memberName}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          FY {summary.financialYear} Caps
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Concessional (Before-Tax) */}
        <CapProgress
          label="Concessional (Pre-tax)"
          used={summary.concessional.used}
          cap={summary.concessional.cap}
          remaining={summary.concessional.remaining}
          percentage={summary.concessional.percentage}
          type="concessional"
        />

        {/* Carry-Forward Info */}
        {summary.carryForward.eligible && (
          <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs sm:text-sm">
              {hasCarryForward ? (
                <div className="space-y-1">
                  <p>
                    <strong>Carry-forward:</strong>{' '}
                    <span className="tabular-nums">{formatCurrency(summary.carryForward.available)}</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Total cap: {formatCurrency(totalConcessionalCap)}
                    {effectiveConcessionalRemaining > 0 && (
                      <span> ({formatCurrency(effectiveConcessionalRemaining)} remaining)</span>
                    )}
                  </p>
                  <ul className="mt-2 text-[10px] sm:text-xs space-y-0.5">
                    {summary.carryForward.breakdown.map((cf) => (
                      <li key={cf.year} className="text-muted-foreground">
                        {cf.year}: {formatCurrency(cf.amount)} unused
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p><strong>Carry-forward eligible</strong></p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Balance under $500k threshold
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!summary.carryForward.eligible && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              <p><strong>Not eligible for carry-forward</strong></p>
              <p className="text-[10px] sm:text-xs mt-0.5">
                Balance exceeds $500k threshold
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Non-Concessional (After-Tax) */}
        <CapProgress
          label="Non-Concessional (Post-tax)"
          used={summary.nonConcessional.used}
          cap={summary.nonConcessional.cap}
          remaining={summary.nonConcessional.remaining}
          percentage={summary.nonConcessional.percentage}
          type="non_concessional"
        />

        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
          <h4 className="font-medium text-xs sm:text-sm mb-2 sm:mb-3">Summary</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Total Contributed</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(summary.concessional.used + summary.nonConcessional.used)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Remaining Caps</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(effectiveConcessionalRemaining + summary.nonConcessional.remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {summary.concessional.percentage < 80 && summary.nonConcessional.percentage < 80 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-green-700 dark:text-green-400">Within contribution limits</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">Monitor contributions</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
