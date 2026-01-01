'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, TrendingUp, PiggyBank } from 'lucide-react';
import { FundSetupDialog } from './fund-setup-dialog';

export function EmptySmsfState() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="text-center">
        <Building2 className="mx-auto h-16 w-16 text-primary mb-4" />
        <h2 className="text-3xl font-bold">Set Up Your SMSF</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Track your Self-Managed Super Fund with powerful tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center">
            <PiggyBank className="mx-auto h-8 w-8 text-primary" />
            <CardTitle className="text-base">Contribution Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Monitor concessional and non-concessional caps with carry-forward calculations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-primary" />
            <CardTitle className="text-base">Investment Register</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Track all investments with performance metrics and asset allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Shield className="mx-auto h-8 w-8 text-primary" />
            <CardTitle className="text-base">Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Stay on top of audit requirements, lodgements, and annual obligations
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Set up your SMSF fund to start tracking contributions, investments, and compliance requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FundSetupDialog />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          <strong>Important:</strong> This tool is for personal tracking purposes only.
          Always consult with a licensed financial adviser and SMSF auditor for compliance matters.
        </p>
      </div>
    </div>
  );
}
