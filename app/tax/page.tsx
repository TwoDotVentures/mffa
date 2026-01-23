/**
 * @fileoverview Tax & Super Page - Main tax management interface
 * @description Server component that handles tax-related data fetching and renders
 * the comprehensive tax tracking interface with income, deductions, and super contributions.
 *
 * @features
 * - Person selector tabs for Grant/Shannon
 * - Tax dashboard with summary metrics
 * - Income tracking with franking credits
 * - Deduction management with category-based organization
 * - Super contribution tracking with cap monitoring
 * - WFH calculator for fixed-rate method deductions
 *
 * @mobile Full responsive design optimized for iPhone 17 Pro
 */
import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { TaxDashboard } from '@/components/tax/tax-dashboard';
import { IncomeList } from '@/components/tax/income-list';
import { DeductionList } from '@/components/tax/deduction-list';
import { SuperContributionList } from '@/components/tax/super-contribution-list';
import { WFHCalculator } from '@/components/tax/wfh-calculator';
import { AddIncomeButton } from '@/components/tax/add-income-button';
import { AddDeductionButton } from '@/components/tax/add-deduction-button';
import { AddSuperButton } from '@/components/tax/add-super-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'lucide-react';
import { getTaxSummary, getIncome } from '@/lib/income/actions';
import { getDeductions } from '@/lib/deductions/actions';
import { getSuperContributions, getContributionSummary } from '@/lib/super/actions';
import { getCurrentFinancialYear, getDaysUntilEOFY } from '@/lib/income/utils';
import type { PersonType } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Props interface for tax page with search params */
interface TaxPageProps {
  searchParams: Promise<{ person?: string }>;
}

/**
 * Tax Page - Server Component
 *
 * Fetches and displays all tax-related data for the selected person.
 * Supports switching between Grant and Shannon via query params.
 *
 * @param props - Page props including search parameters
 * @returns Rendered tax management interface
 */
export default async function TaxPage({ searchParams }: TaxPageProps) {
  const params = await searchParams;
  const person = (params.person === 'shannon' ? 'shannon' : 'grant') as Exclude<PersonType, 'joint'>;
  const fy = getCurrentFinancialYear();
  const daysUntilEOFY = getDaysUntilEOFY();

  // Fetch all data for the selected person in parallel
  const [taxSummary, income, deductions, superContributions, superSummary] = await Promise.all([
    getTaxSummary(fy, person),
    getIncome(fy, person),
    getDeductions(fy, person),
    getSuperContributions(fy, person),
    getContributionSummary(fy, person),
  ]);

  return (
    <>
      <PageHeader
        title="Tax & Super"
        description={`Track income, deductions, and super contributions for ${fy}`}
      />
      <main className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        {/* Person Selector & Action Buttons - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Person Tabs - Full width on mobile with horizontal scroll */}
          <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <Tabs defaultValue={person} className="w-full min-w-max sm:w-auto">
              <TabsList className="w-full grid grid-cols-2 sm:w-auto sm:inline-flex">
                <TabsTrigger value="grant" asChild>
                  <a
                    href="/tax?person=grant"
                    className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Grant</span>
                  </a>
                </TabsTrigger>
                <TabsTrigger value="shannon" asChild>
                  <a
                    href="/tax?person=shannon"
                    className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Shannon</span>
                  </a>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap">
            <AddIncomeButton person={person} />
            <AddDeductionButton person={person} />
            <AddSuperButton person={person} />
          </div>
        </div>

        {/* Dashboard - Responsive cards grid */}
        {taxSummary && (
          <TaxDashboard
            summary={taxSummary}
            superSummary={superSummary}
            daysUntilEOFY={daysUntilEOFY}
          />
        )}

        {/* Tabbed Content - Full width tabs on mobile */}
        <Tabs defaultValue="income" className="space-y-3 sm:space-y-4">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-full grid grid-cols-4 sm:w-auto sm:inline-flex">
              <TabsTrigger value="income" className="min-h-[44px] text-xs sm:text-sm sm:min-h-0">
                Income
              </TabsTrigger>
              <TabsTrigger value="deductions" className="min-h-[44px] text-xs sm:text-sm sm:min-h-0">
                Deductions
              </TabsTrigger>
              <TabsTrigger value="super" className="min-h-[44px] text-xs sm:text-sm sm:min-h-0">
                Super
              </TabsTrigger>
              <TabsTrigger value="wfh" className="min-h-[44px] text-xs sm:text-sm sm:min-h-0">
                WFH
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="income" className="mt-3 sm:mt-4">
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <IncomeList income={income} />
            </Suspense>
          </TabsContent>

          <TabsContent value="deductions" className="mt-3 sm:mt-4">
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <DeductionList deductions={deductions} />
            </Suspense>
          </TabsContent>

          <TabsContent value="super" className="mt-3 sm:mt-4">
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <SuperContributionList
                contributions={superContributions}
                summary={superSummary}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="wfh" className="mt-3 sm:mt-4">
            <WFHCalculator person={person} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
