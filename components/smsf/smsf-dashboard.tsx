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
  Plus,
} from 'lucide-react';
import { FundSetupDialog } from './fund-setup-dialog';
import { MemberDialog } from './member-dialog';
import { ContributionDialog } from './contribution-dialog';
import { ContributionTracker } from './contribution-tracker';
import { InvestmentRegister } from './investment-register';
import { ComplianceChecklist } from './compliance-checklist';
import type { SmsfDashboardData, ContributionSummary, SmsfInvestment } from '@/lib/smsf/actions';

interface SmsfDashboardProps {
  data: SmsfDashboardData;
  contributionSummaries: ContributionSummary[];
  investments?: SmsfInvestment[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SmsfDashboard({ data, contributionSummaries, investments: investmentsList = [] }: SmsfDashboardProps) {
  const { fund, members, investments, contributions, compliance, recentTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Fund Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{fund.name}</h2>
            <Badge variant={fund.fund_status === 'active' ? 'default' : 'secondary'}>
              {fund.fund_status}
            </Badge>
          </div>
          {fund.abn && (
            <p className="text-sm text-muted-foreground mt-1">ABN: {fund.abn}</p>
          )}
        </div>
        <div className="flex gap-2">
          <FundSetupDialog
            fund={fund}
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Fund Settings
              </Button>
            }
          />
          <MemberDialog fundId={fund.id} />
          <ContributionDialog fundId={fund.id} members={members} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.investments.total)}</div>
            <p className={`text-xs ${data.investments.performance.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.investments.performance.gainLoss >= 0 ? '+' : ''}
              {formatCurrency(data.investments.performance.gainLoss)} (
              {data.investments.performance.gainLossPercent >= 0 ? '+' : ''}
              {data.investments.performance.gainLossPercent.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contributions FY</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(contributions.currentFY)}</div>
            <p className="text-xs text-muted-foreground">
              {contributions.byType.length} contribution type{contributions.byType.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {compliance ? (
                compliance.audit_status === 'completed' && compliance.lodgement_status === 'lodged'
                  ? 'Complete'
                  : 'In Progress'
              ) : (
                'Not Started'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {compliance?.audit_status === 'completed' ? 'Audit done' : 'Audit pending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fund Members
            </CardTitle>
            <CardDescription>Member balances and contribution status</CardDescription>
          </div>
          <MemberDialog fundId={fund.id} />
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members added yet.</p>
              <p className="text-sm">Add members to start tracking contributions.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {members.map((member) => (
                <Card key={member.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <Badge variant="outline" className="mt-1">
                          {member.member_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {formatCurrency(Number(member.total_super_balance))}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Balance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="contributions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="space-y-4">
          {contributionSummaries.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {contributionSummaries.map((summary) => (
                <ContributionTracker key={summary.memberId} summary={summary} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members to track contributions for.</p>
                <p className="text-sm">Add members to see contribution tracking.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentRegister fundId={fund.id} investments={investmentsList} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceChecklist fundId={fund.id} compliance={compliance} />
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Fund transactions for the current financial year</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{tx.description || tx.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('en-AU')}
                          {tx.member && ` • ${tx.member.name}`}
                        </p>
                      </div>
                      <div className={`font-semibold ${
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
