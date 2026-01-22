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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, Check, AlertTriangle } from 'lucide-react';
import { deleteDeduction, approveDeduction } from '@/lib/deductions/actions';
import type { Deduction } from '@/lib/types';
import { DEDUCTION_CATEGORY_LABELS } from '@/lib/types';

interface DeductionListProps {
  deductions: Deduction[];
}

const categoryColors: Record<string, string> = {
  work_from_home: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  vehicle: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  travel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  clothing_laundry: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  self_education: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  tools_equipment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  professional_subscriptions: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  union_fees: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  phone_internet: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  donations: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  income_protection: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  tax_agent_fees: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  investment_expenses: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  rental_property: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function DeductionList({ deductions }: DeductionListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

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
    if (!confirm('Are you sure you want to delete this deduction?')) return;

    setIsLoading(id);
    try {
      await deleteDeduction(id);
    } catch (error) {
      console.error('Error deleting deduction:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setIsLoading(id);
    try {
      await approveDeduction(id);
    } catch (error) {
      console.error('Error approving deduction:', error);
    } finally {
      setIsLoading(null);
    }
  };

  if (deductions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
          <CardDescription>No deductions recorded for this financial year.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add work-related deductions, donations, or other tax deductions using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  const flaggedCount = deductions.filter((d) => !d.is_approved).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Deductions
          {flaggedCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {flaggedCount} needs review
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {deductions.length} deduction{deductions.length !== 1 ? 's' : ''} totalling{' '}
          {formatCurrency(totalDeductions)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deductions.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {item.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={categoryColors[item.category]}>
                    {DEDUCTION_CATEGORY_LABELS[item.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(item.amount))}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_approved ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="mr-1 h-3 w-3" />
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Review
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!item.is_approved && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleApprove(item.id)}
                            disabled={isLoading === item.id}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading === item.id}
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
