/**
 * @fileoverview SMSF Dashboard Component
 * @description Main dashboard for Self-Managed Super Fund management displaying
 * fund overview, member balances, contributions, investments, and compliance.
 *
 * @features
 * - Fund overview cards with key metrics
 * - Member cards with balances and status
 * - Tabbed content for contributions, investments, compliance, and transactions
 * - Mobile-optimized responsive layout
 *
 * @mobile 2x2 grid on mobile for overview cards, stacked member cards
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  TrendingUp,
  PiggyBank,
  ClipboardCheck,
  DollarSign,
  Settings,
} from 'lucide-react';
import { FundSetupDialog } from './fund-setup-dialog';
import { MemberDialog } from './member-dialog';
import { ContributionDialog } from './contribution-dialog';
import { ContributionTracker } from './contribution-tracker';
import { InvestmentRegister } from './investment-register';
import { ComplianceChecklist } from './compliance-checklist';
import type { SmsfDashboardData, ContributionSummary, SmsfInvestment } from '@/lib/smsf/actions';

/** Props interface for SmsfDashboard component */
interface SmsfDashboardProps {
  /** Dashboard data including fund, members, investments, and compliance */
  data: SmsfDashboardData;
  /** Contribution summaries for each member */
  contributionSummaries: ContributionSummary[];
  /** Optional array of investments */
  investments?: SmsfInvestment[];
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
 * SMSF Dashboard Component
 *
 * Main dashboard displaying comprehensive SMSF management interface with
 * fund metrics, member tracking, and tabbed content sections.
 *
 * @param props - Component props
 * @returns Rendered SMSF dashboard
 */
export function SmsfDashboard({ data, contributionSummaries, investments: investmentsList = [] }: SmsfDashboardProps) {
  const { fund, members, investments, contributions, compliance, recentTransactions } = data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Fund Header - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <h2 className="text-lg sm:text-2xl font-bold truncate">{fund.name}</h2>
              <Badge
                variant={fund.fund_status === 'active' ? 'default' : 'secondary'}
                className="text-xs shrink-0"
              >
                {fund.fund_status}
              </Badge>
            </div>
            {fund.abn && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">ABN: {fund.abn}</p>
            )}
          </div>
        </div>

        {/* Action Buttons - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap">
          <FundSetupDialog
            fund={fund}
            trigger={
              <Button variant="outline" size="sm" className="shrink-0 h-9 sm:h-8">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            }
          />
          <MemberDialog fundId={fund.id} />
          <ContributionDialog fundId={fund.id} members={members} />
        </div>
      </div>

      {/* Overview Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Total Balance Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight">
              {formatCurrency(data.totalBalance)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Investments Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Investments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight">
              {formatCurrency(data.investments.total)}
            </div>
            <p className={`text-[10px] sm:text-xs mt-1 font-medium ${
              data.investments.performance.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.investments.performance.gainLoss >= 0 ? '+' : ''}
              {formatCurrency(data.investments.performance.gainLoss)}
              <span className="hidden sm:inline">
                {' '}({data.investments.performance.gainLossPercent >= 0 ? '+' : ''}
                {data.investments.performance.gainLossPercent.toFixed(1)}%)
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Contributions Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Contributions
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight">
              {formatCurrency(contributions.currentFY)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              This FY
            </p>
          </CardContent>
        </Card>

        {/* Compliance Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Compliance
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold tracking-tight">
              {compliance ? (
                compliance.audit_status === 'completed' && compliance.lodgement_status === 'lodged'
                  ? 'Done'
                  : 'Pending'
              ) : (
                'Setup'
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              {compliance?.audit_status === 'completed' ? 'Audit OK' : 'Audit needed'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Fund Members
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Member balances and status
              </CardDescription>
            </div>
            <MemberDialog fundId={fund.id} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {members.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No members added yet.</p>
              <p className="text-xs sm:text-sm mt-1">Add members to start tracking contributions.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {members.map((member) => (
                <Card key={member.id} className="bg-muted/30 border-muted">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm sm:text-base truncate">{member.name}</h4>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {member.member_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-semibold tabular-nums">
                          {formatCurrency(Number(member.total_super_balance))}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content - Full width on mobile */}
      <Tabs defaultValue="contributions" className="space-y-3 sm:space-y-4">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-full grid grid-cols-4 sm:w-auto sm:inline-flex">
            <TabsTrigger
              value="contributions"
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
            >
              Contrib.
            </TabsTrigger>
            <TabsTrigger
              value="investments"
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
            >
              Invest.
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
            >
              Comply
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-0"
            >
              Trans.
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contributions" className="mt-3 sm:mt-4">
          {contributionSummaries.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {contributionSummaries.map((summary) => (
                <ContributionTracker key={summary.memberId} summary={summary} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-6 sm:py-8 text-muted-foreground">
                <PiggyBank className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No members to track contributions for.</p>
                <p className="text-xs sm:text-sm mt-1">Add members to see contribution tracking.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="investments" className="mt-3 sm:mt-4">
          <InvestmentRegister fundId={fund.id} investments={investmentsList} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-3 sm:mt-4">
          <ComplianceChecklist fundId={fund.id} compliance={compliance} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-3 sm:mt-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Fund transactions for the current financial year
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {recentTransactions.length === 0 ? (
                <div className="p-4 sm:p-0 text-center py-6 sm:py-8 text-muted-foreground">
                  <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No transactions recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y sm:space-y-2 sm:divide-y-0">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 p-3 sm:p-3 sm:rounded-lg sm:border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {tx.description || tx.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('en-AU')}
                          {tx.member && (
                            <span className="hidden sm:inline"> - {tx.member.name}</span>
                          )}
                        </p>
                      </div>
                      <div className={`font-semibold text-sm sm:text-base tabular-nums shrink-0 ${
                        ['contribution', 'investment_income', 'transfer_in'].includes(tx.type)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {['contribution', 'investment_income', 'transfer_in'].includes(tx.type) ? '+' : '-'}
                        {formatCurrency(Math.abs(Number(tx.amount)))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
