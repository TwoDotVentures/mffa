import { PageHeader } from '@/components/page-header';
import { SmsfDashboard } from '@/components/smsf/smsf-dashboard';
import { EmptySmsfState } from '@/components/smsf/empty-smsf-state';
import {
  getSmsfFunds,
  getSmsfMembers,
  getSmsfInvestments,
  getSmsfDashboard,
  getMemberContributionSummary,
  type SmsfFund,
} from '@/lib/smsf/actions';
import { getFinancialYear } from '@/lib/smsf/utils';

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
        <main className="flex-1 p-4 md:p-6">
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
      // The InvestmentRegister needs the raw investments array
    },
  };

  return (
    <>
      <PageHeader title="SMSF" description="G & S Super Fund management" />
      <main className="flex-1 p-4 md:p-6">
        <SmsfDashboard
          data={fullDashboardData}
          contributionSummaries={contributionSummaries}
          investments={investments}
        />
      </main>
    </>
  );
}
