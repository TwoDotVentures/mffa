'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import { deleteSuperContribution } from '@/lib/super/actions';
import type { SuperContribution, SuperContributionSummary } from '@/lib/types';
import { SUPER_CONTRIBUTION_TYPE_LABELS } from '@/lib/types';

interface SuperContributionListProps {
  contributions: SuperContribution[];
  summary: SuperContributionSummary;
}

const typeColors: Record<string, string> = {
  employer_sg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  salary_sacrifice: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  personal_deductible: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  personal_non_deductible: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  spouse: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  government_co_contribution: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  low_income_super_offset: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function SuperContributionList({
  contributions,
  summary,
}: SuperContributionListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;

    setIsDeleting(id);
    try {
      await deleteSuperContribution(id);
    } catch (error) {
      console.error('Error deleting contribution:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const concessionalPercent =
    (summary.concessional_contributions / summary.concessional_cap) * 100;
  const nonConcessionalPercent =
    (summary.non_concessional_contributions / summary.non_concessional_cap) * 100;

  const personName = summary.person === 'grant' ? 'Grant' : 'Shannon';

  return (
    <div className="space-y-6">
      {/* Cap Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Concessional Cap</CardTitle>
            <CardDescription>
              Pre-tax contributions (employer SG, salary sacrifice, personal deductible)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress
              value={Math.min(concessionalPercent, 100)}
              className={`h-3 ${concessionalPercent > 100 ? 'bg-red-200' : ''}`}
            />
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(summary.concessional_contributions)}</span>
              <span className="text-muted-foreground">
                of {formatCurrency(summary.concessional_cap)}
              </span>
            </div>
            {concessionalPercent > 100 && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cap exceeded by {formatCurrency(summary.concessional_contributions - summary.concessional_cap)}
              </p>
            )}
            {concessionalPercent <= 100 && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(summary.concessional_remaining)} remaining
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Non-Concessional Cap</CardTitle>
            <CardDescription>
              After-tax contributions (personal non-deductible, spouse)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress
              value={Math.min(nonConcessionalPercent, 100)}
              className={`h-3 ${nonConcessionalPercent > 100 ? 'bg-red-200' : ''}`}
            />
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(summary.non_concessional_contributions)}</span>
              <span className="text-muted-foreground">
                of {formatCurrency(summary.non_concessional_cap)}
              </span>
            </div>
            {nonConcessionalPercent > 100 && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cap exceeded by {formatCurrency(summary.non_concessional_contributions - summary.non_concessional_cap)}
              </p>
            )}
            {nonConcessionalPercent <= 100 && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(summary.non_concessional_remaining)} remaining
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contributions List */}
      <Card>
        <CardHeader>
          <CardTitle>Super Contributions - {personName}</CardTitle>
          <CardDescription>
            {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} for{' '}
            {summary.financial_year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No super contributions recorded. Add employer SG, salary sacrifice, or personal contributions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Concessional</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="font-medium">{item.fund_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeColors[item.contribution_type]}>
                        {SUPER_CONTRIBUTION_TYPE_LABELS[item.contribution_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.amount))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.is_concessional ? 'default' : 'outline'}>
                        {item.is_concessional ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting === item.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
