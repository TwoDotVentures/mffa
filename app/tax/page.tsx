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

interface TaxPageProps {
  searchParams: Promise<{ person?: string }>;
}

export default async function TaxPage({ searchParams }: TaxPageProps) {
  const params = await searchParams;
  const person = (params.person === 'shannon' ? 'shannon' : 'grant') as Exclude<PersonType, 'joint'>;
  const fy = getCurrentFinancialYear();
  const daysUntilEOFY = getDaysUntilEOFY();

  // Fetch all data for the selected person
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
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Person Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue={person} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="grant" asChild>
                <a href="/tax?person=grant" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Grant
                </a>
              </TabsTrigger>
              <TabsTrigger value="shannon" asChild>
                <a href="/tax?person=shannon" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Shannon
                </a>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <AddIncomeButton person={person} />
            <AddDeductionButton person={person} />
            <AddSuperButton person={person} />
          </div>
        </div>

        {/* Dashboard */}
        {taxSummary && (
          <TaxDashboard
            summary={taxSummary}
            superSummary={superSummary}
            daysUntilEOFY={daysUntilEOFY}
          />
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="income" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
            <TabsTrigger value="super">Super</TabsTrigger>
            <TabsTrigger value="wfh">WFH Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <IncomeList income={income} />
            </Suspense>
          </TabsContent>

          <TabsContent value="deductions">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <DeductionList deductions={deductions} />
            </Suspense>
          </TabsContent>

          <TabsContent value="super">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <SuperContributionList
                contributions={superContributions}
                summary={superSummary}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="wfh">
            <WFHCalculator person={person} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
