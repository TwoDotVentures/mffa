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
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { deleteTrustIncome } from '@/lib/trust/actions';
import type { TrustIncome } from '@/lib/types';

interface TrustIncomeListProps {
  income: TrustIncome[];
}

const incomeTypeLabels: Record<string, string> = {
  dividend: 'Dividend',
  interest: 'Interest',
  rent: 'Rent',
  capital_gain: 'Capital Gain',
  other: 'Other',
};

const incomeTypeColors: Record<string, string> = {
  dividend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  interest: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  capital_gain: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function TrustIncomeList({ income }: TrustIncomeListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
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
    if (!confirm('Are you sure you want to delete this income record?')) return;

    setIsDeleting(id);
    try {
      await deleteTrustIncome(id);
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (income.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trust Income</CardTitle>
          <CardDescription>No income recorded for this financial year.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add dividend income, interest, or other income sources using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalFranking = income.reduce((sum, i) => sum + Number(i.franking_credits), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Income</CardTitle>
        <CardDescription>
          {income.length} income record{income.length !== 1 ? 's' : ''} totalling{' '}
          {formatCurrency(totalIncome)} with {formatCurrency(totalFranking)} franking credits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Franking</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {income.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell className="font-medium">{item.source}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={incomeTypeColors[item.income_type]}
                  >
                    {incomeTypeLabels[item.income_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(item.amount))}
                </TableCell>
                <TableCell className="text-right">
                  {Number(item.franking_credits) > 0
                    ? formatCurrency(Number(item.franking_credits))
                    : '-'}
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
      </CardContent>
    </Card>
  );
}
