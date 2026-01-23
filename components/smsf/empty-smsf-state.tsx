/**
 * @fileoverview Empty SMSF State Component
 * @description Landing page shown when no SMSF fund has been set up yet,
 * with feature highlights and quick setup option.
 *
 * @features
 * - Feature showcase cards for contributions, investments, compliance
 * - Call-to-action for fund setup
 * - Important disclaimer for personal tracking
 * - Mobile-optimized card grid layout
 *
 * @mobile Single column feature cards, centered content
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, TrendingUp, PiggyBank } from 'lucide-react';
import { FundSetupDialog } from './fund-setup-dialog';

/**
 * Empty SMSF State Component
 *
 * Displays a welcome screen with feature highlights when no
 * SMSF fund exists, prompting the user to set up their fund.
 *
 * @returns Rendered empty state with setup option
 */
export function EmptySmsfState() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 py-6 sm:py-8 px-1">
      {/* Hero Section */}
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-3 sm:mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold">Set Up Your SMSF</h2>
        <p className="mt-2 text-sm sm:text-lg text-muted-foreground">
          Track your Self-Managed Super Fund with powerful tools
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Contribution Tracking */}
        <Card>
          <CardHeader className="text-center pb-2 sm:pb-3">
            <PiggyBank className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <CardTitle className="text-sm sm:text-base">Contribution Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Monitor concessional and non-concessional caps with carry-forward calculations
            </p>
          </CardContent>
        </Card>

        {/* Investment Register */}
        <Card>
          <CardHeader className="text-center pb-2 sm:pb-3">
            <TrendingUp className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <CardTitle className="text-sm sm:text-base">Investment Register</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Track all investments with performance metrics and asset allocation
            </p>
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card>
          <CardHeader className="text-center pb-2 sm:pb-3">
            <Shield className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <CardTitle className="text-sm sm:text-base">Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Stay on top of audit requirements, lodgements, and annual obligations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Get Started Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Get Started</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Set up your SMSF fund to start tracking contributions, investments, and compliance requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FundSetupDialog />
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs sm:text-sm text-muted-foreground px-2">
        <p>
          <strong>Important:</strong> This tool is for personal tracking purposes only.
          Always consult with a licensed financial adviser and SMSF auditor for compliance matters.
        </p>
      </div>
    </div>
  );
}
