/**
 * @fileoverview SMSF Page - Self-Managed Super Fund Management
 * @description Server component that handles SMSF data fetching and renders
 * the comprehensive fund management interface with members, investments, and compliance.
 *
 * @features
 * - Fund overview with total value
 * - Member contribution tracking with cap monitoring
 * - Investment register with asset allocation
 * - Compliance checklist for regulatory requirements
 *
 * @mobile Full responsive design optimized for iPhone 17 Pro
 */
import { PageHeader } from '@/components/page-header';
import { SmsfDashboard } from '@/components/smsf/smsf-dashboard';
import { EmptySmsfState } from '@/components/smsf/empty-smsf-state';
import {
  getSmsfFunds,
  getSmsfInvestments,
  getSmsfDashboard,
  getMemberContributionSummary,
  type SmsfFund,
} from '@/lib/smsf/actions';
import { getFinancialYear } from '@/lib/smsf/utils';

/**
 * SMSF Page - Server Component
 *
 * Fetches and displays all SMSF-related data for the user's fund.
 * Shows empty state if no fund is configured.
 *
 * @returns Rendered SMSF management interface
 */
export default async function SmsfPage() {
  // Get user's SMSF funds
  let funds: SmsfFund[] = [];
  try {
    funds = await getSmsfFunds();
  } catch (error) {
    // User not authenticated or error - show empty state
    funds = [];
  }

  // If no funds, show empty state
  if (funds.length === 0) {
    return (
      <>
        <PageHeader title="SMSF" description="Self-Managed Super Fund management" />
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <EmptySmsfState />
        </main>
      </>
    );
  }

  // Get first fund's data (for now, just support single fund)
  const fund = funds[0];

  // Get dashboard data
  const dashboardData = await getSmsfDashboard(fund.id);

  // Get contribution summaries for each member
  const currentFY = getFinancialYear();
  const contributionSummaries = await Promise.all(
    dashboardData.members.map((member) =>
      getMemberContributionSummary(member.id, currentFY)
    )
  );

  // Get investments for the register
  const investments = await getSmsfInvestments(fund.id);

  // Update dashboard data with actual investments
  const fullDashboardData = {
    ...dashboardData,
    investments: {
      ...dashboardData.investments,
    },
  };

  return (
    <>
      <PageHeader title="SMSF" description="G & S Super Fund management" />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <SmsfDashboard
          data={fullDashboardData}
          contributionSummaries={contributionSummaries}
          investments={investments}
        />
      </main>
    </>
  );
}
