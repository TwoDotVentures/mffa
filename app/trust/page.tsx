import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { TrustDashboard } from '@/components/trust/trust-dashboard';
import { TrustIncomeList } from '@/components/trust/trust-income-list';
import { DistributionModeller } from '@/components/trust/distribution-modeller';
import { DistributionList } from '@/components/trust/distribution-list';
import { BeneficiaryCards } from '@/components/trust/beneficiary-cards';
import { AddIncomeButton } from '@/components/trust/add-income-button';
import { AddDistributionButton } from '@/components/trust/add-distribution-button';
import { TrustSetupDialog } from '@/components/trust/trust-setup-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getTrustSummary,
  getTrustIncome,
  getTrustDistributions,
  getFrankingCredits,
} from '@/lib/trust/actions';

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const summary = await getTrustSummary();

  // If no trust exists, show setup
  if (!summary) {
    return (
      <>
        <PageHeader
          title="Family Trust"
          description="Set up your family trust to start tracking income and distributions"
        />
        <main className="flex-1 p-4 md:p-6">
          <TrustSetupDialog />
        </main>
      </>
    );
  }

  const [income, distributions, frankingCredits] = await Promise.all([
    getTrustIncome(summary.trust.id),
    getTrustDistributions(summary.trust.id),
    getFrankingCredits(summary.trust.id),
  ]);

  const frankingAvailable =
    (frankingCredits?.credits_received || 0) -
    (frankingCredits?.credits_distributed || 0);

  return (
    <>
      <PageHeader
        title={summary.trust.name}
        description={`Trustee: ${summary.trust.trustee_name}`}
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Dashboard Summary */}
        <TrustDashboard summary={summary} />

        {/* Beneficiary Summary */}
        <BeneficiaryCards
          beneficiaries={summary.beneficiaries}
          distributions={distributions}
        />

        {/* Tabbed Content */}
        <Tabs defaultValue="income" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="distributions">Distributions</TabsTrigger>
              <TabsTrigger value="modeller">Distribution Modeller</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <AddIncomeButton trustId={summary.trust.id} />
              <AddDistributionButton
                trustId={summary.trust.id}
                beneficiaries={summary.beneficiaries}
                maxAmount={summary.distributable_amount}
                frankingAvailable={frankingAvailable}
              />
            </div>
          </div>

          <TabsContent value="income">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <TrustIncomeList income={income} />
            </Suspense>
          </TabsContent>

          <TabsContent value="distributions">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <DistributionList distributions={distributions} />
            </Suspense>
          </TabsContent>

          <TabsContent value="modeller">
            <DistributionModeller
              distributableAmount={summary.distributable_amount}
              frankingCredits={summary.franking_credits_ytd}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
