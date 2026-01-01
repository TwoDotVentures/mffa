'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PieChart, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { InvestmentDialog } from './investment-dialog';
import { deleteSmsfInvestment, type SmsfInvestment } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

interface InvestmentRegisterProps {
  fundId: string;
  investments: SmsfInvestment[];
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  australian_shares: 'AU Shares',
  international_shares: 'Intl Shares',
  property: 'Property',
  fixed_income: 'Fixed Income',
  cash: 'Cash',
  cryptocurrency: 'Crypto',
  collectibles: 'Collectibles',
  other: 'Other',
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  australian_shares: 'bg-blue-500',
  international_shares: 'bg-purple-500',
  property: 'bg-amber-500',
  fixed_income: 'bg-green-500',
  cash: 'bg-gray-500',
  cryptocurrency: 'bg-orange-500',
  collectibles: 'bg-pink-500',
  other: 'bg-slate-500',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function InvestmentRegister({ fundId, investments }: InvestmentRegisterProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  // Calculate totals
  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalCostBase = investments.reduce((sum, inv) => sum + Number(inv.cost_base), 0);
  const totalGainLoss = totalValue - totalCostBase;
  const totalGainLossPercent = totalCostBase > 0 ? (totalGainLoss / totalCostBase) * 100 : 0;
  const totalIncome = investments.reduce((sum, inv) => sum + Number(inv.income_ytd), 0);

  // Calculate allocation by type
  const allocationByType = investments.reduce((acc, inv) => {
    const type = inv.asset_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(inv.current_value);
    return acc;
  }, {} as Record<string, number>);

  const allocationData = Object.entries(allocationByType)
    .map(([type, value]) => ({
      type,
      label: ASSET_TYPE_LABELS[type] || type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: ASSET_TYPE_COLORS[type] || 'bg-gray-500',
    }))
    .sort((a, b) => b.value - a.value);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    setDeleting(id);
    try {
      await deleteSmsfInvestment(id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete investment:', error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unrealised Gain/Loss</CardDescription>
            <CardTitle className={`text-2xl flex items-center gap-2 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatCurrency(Math.abs(totalGainLoss))}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(1)}%
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income YTD</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalIncome)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Holdings</CardDescription>
            <CardTitle className="text-2xl">{investments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocationData.map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {allocationData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No investments yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Investment Register</CardTitle>
              <CardDescription>All SMSF investments and their current values</CardDescription>
            </div>
            <InvestmentDialog fundId={fundId} />
          </CardHeader>
          <CardContent>
            {investments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No investments recorded yet.</p>
                <p className="text-sm">Add your first investment to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment</TableHead>
                    <TableHead className="text-right">Cost Base</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => {
                    const gainLoss = Number(investment.current_value) - Number(investment.cost_base);
                    const gainLossPercent = Number(investment.cost_base) > 0
                      ? (gainLoss / Number(investment.cost_base)) * 100
                      : 0;

                    return (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{investment.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {ASSET_TYPE_LABELS[investment.asset_type] || investment.asset_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(investment.cost_base))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(investment.current_value))}
                        </TableCell>
                        <TableCell className={`text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <div>
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                            <p className="text-xs">
                              {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={deleting === investment.id}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <InvestmentDialog
                                fundId={fundId}
                                investment={investment}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                }
                              />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(investment.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
