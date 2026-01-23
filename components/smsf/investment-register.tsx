/**
 * @fileoverview SMSF Investment Register Component
 * @description Displays and manages SMSF investments with asset allocation
 * breakdown, performance metrics, and CRUD functionality.
 *
 * @features
 * - Summary cards with total value, gain/loss, income, and holdings count
 * - Asset allocation chart with visual progress bars
 * - Investment list with mobile cards / desktop table
 * - Add/Edit/Delete investment functionality
 * - Color-coded asset types
 *
 * @mobile 2x2 summary grid, stacked allocation + list on mobile
 */
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
import { PieChart, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { InvestmentDialog } from './investment-dialog';
import { deleteSmsfInvestment, type SmsfInvestment } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

/** Props interface for InvestmentRegister component */
interface InvestmentRegisterProps {
  /** SMSF fund ID */
  fundId: string;
  /** Array of investments in the fund */
  investments: SmsfInvestment[];
}

/**
 * Asset type display labels
 */
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

/**
 * Asset type colors for allocation chart
 */
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
 * Investment Register Component
 *
 * Displays SMSF investments with allocation breakdown, performance tracking,
 * and management functionality.
 *
 * @param props - Component props
 * @returns Rendered investment register
 */
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

  /**
   * Handles investment deletion with confirmation
   * @param id - Investment ID to delete
   */
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
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-1 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs">Total Value</CardDescription>
            <CardTitle className="text-xl sm:text-2xl tabular-nums">{formatCurrency(totalValue)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br pointer-events-none ${totalGainLoss >= 0 ? 'from-green-500/5' : 'from-red-500/5'} to-transparent`} />
          <CardHeader className="pb-1 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs">Gain/Loss</CardDescription>
            <CardTitle className={`text-xl sm:text-2xl flex items-center gap-1 tabular-nums ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="truncate">{formatCurrency(Math.abs(totalGainLoss))}</span>
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(1)}%
            </p>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-1 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs">Income YTD</CardDescription>
            <CardTitle className="text-xl sm:text-2xl tabular-nums">{formatCurrency(totalIncome)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-1 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs">Holdings</CardDescription>
            <CardTitle className="text-xl sm:text-2xl tabular-nums">{investments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Allocation and List Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Asset Allocation */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocationData.map((item) => (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="font-medium tabular-nums shrink-0">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {allocationData.length === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  No investments yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Investments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Holdings and values
                </CardDescription>
              </div>
              <InvestmentDialog fundId={fundId} />
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {investments.length === 0 ? (
              <div className="p-4 sm:p-0 text-center py-6 sm:py-8 text-muted-foreground">
                <p className="text-sm sm:text-base">No investments recorded.</p>
                <p className="text-xs sm:text-sm mt-1">Add your first investment to get started.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y">
                  {investments.map((investment) => {
                    const gainLoss = Number(investment.current_value) - Number(investment.cost_base);
                    const gainLossPercent = Number(investment.cost_base) > 0
                      ? (gainLoss / Number(investment.cost_base)) * 100
                      : 0;

                    return (
                      <div key={investment.id} className="p-4 space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{investment.name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {ASSET_TYPE_LABELS[investment.asset_type] || investment.asset_type}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={deleting === investment.id}
                              >
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
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(investment.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Values Row */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground text-[10px]">Cost</p>
                            <p className="font-medium tabular-nums">{formatCurrency(Number(investment.cost_base))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">Value</p>
                            <p className="font-semibold tabular-nums">{formatCurrency(Number(investment.current_value))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">Gain/Loss</p>
                            <p className={`font-medium tabular-nums ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                              <span className="block text-[10px]">
                                ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investment</TableHead>
                        <TableHead className="text-right">Cost Base</TableHead>
                        <TableHead className="text-right">Current</TableHead>
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
                          <TableRow key={investment.id} className="group">
                            <TableCell>
                              <div>
                                <p className="font-medium">{investment.name}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {ASSET_TYPE_LABELS[investment.asset_type] || investment.asset_type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(Number(investment.cost_base))}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(Number(investment.current_value))}
                            </TableCell>
                            <TableCell className={`text-right tabular-nums ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={deleting === investment.id}
                                  >
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
                                    className="text-destructive focus:text-destructive"
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
