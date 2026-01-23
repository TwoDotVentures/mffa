/**
 * @fileoverview Family Trust Page - Trust Income & Distribution Management
 * @description Server component that handles trust data fetching and renders
 * the comprehensive trust management interface with income, distributions,
 * and beneficiary tracking.
 *
 * @features
 * - Trust summary dashboard with key metrics
 * - Beneficiary cards with distribution totals
 * - Income tracking with franking credits
 * - Distribution management and modelling
 * - EOFY countdown and warnings
 *
 * @mobile Full responsive design optimized for iPhone 17 Pro
 */
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

/**
 * Family Trust Page - Server Component
 *
 * Fetches and displays all trust-related data including income,
 * distributions, and beneficiary information.
 *
 * @returns Rendered trust management interface
 */
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
        <main className="flex-1 p-3 sm:p-4 md:p-6">
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
      <main className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        {/* Dashboard Summary */}
        <TrustDashboard summary={summary} />

        {/* Beneficiary Summary */}
        <BeneficiaryCards
          beneficiaries={summary.beneficiaries}
          distributions={distributions}
        />

        {/* Tabbed Content */}
        <Tabs defaultValue="income" className="space-y-3 sm:space-y-4">
          {/* Tabs and Action Buttons */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Tabs - Full width on mobile with horizontal scroll */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="w-full grid grid-cols-3 sm:w-auto sm:inline-flex">
                <TabsTrigger
                  value="income"
                  className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                >
                  Income
                </TabsTrigger>
                <TabsTrigger
                  value="distributions"
                  className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                >
                  Distributions
                </TabsTrigger>
                <TabsTrigger
                  value="modeller"
                  className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                >
                  Modeller
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Action Buttons - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap">
              <AddIncomeButton trustId={summary.trust.id} />
              <AddDistributionButton
                trustId={summary.trust.id}
                beneficiaries={summary.beneficiaries}
                maxAmount={summary.distributable_amount}
                frankingAvailable={frankingAvailable}
              />
            </div>
          </div>

          <TabsContent value="income" className="mt-3 sm:mt-4">
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <TrustIncomeList income={income} />
            </Suspense>
          </TabsContent>

          <TabsContent value="distributions" className="mt-3 sm:mt-4">
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <DistributionList distributions={distributions} />
            </Suspense>
          </TabsContent>

          <TabsContent value="modeller" className="mt-3 sm:mt-4">
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
