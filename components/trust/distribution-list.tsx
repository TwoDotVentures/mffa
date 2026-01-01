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
import { MoreHorizontal, Trash2, CheckCircle, Clock } from 'lucide-react';
import { deleteTrustDistribution } from '@/lib/trust/actions';
import type { TrustDistribution } from '@/lib/types';

interface DistributionListProps {
  distributions: TrustDistribution[];
}

const typeLabels: Record<string, string> = {
  income: 'Income',
  capital: 'Capital',
  mixed: 'Mixed',
};

export function DistributionList({ distributions }: DistributionListProps) {
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
    if (!confirm('Are you sure you want to delete this distribution?')) return;

    setIsDeleting(id);
    try {
      await deleteTrustDistribution(id);
    } catch (error) {
      console.error('Error deleting distribution:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (distributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>
            No distributions recorded for this financial year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Record distributions to beneficiaries using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDistributed = distributions.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );
  const totalFranking = distributions.reduce(
    (sum, d) => sum + Number(d.franking_credits_streamed),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution History</CardTitle>
        <CardDescription>
          {distributions.length} distribution{distributions.length !== 1 ? 's' : ''}{' '}
          totalling {formatCurrency(totalDistributed)} with{' '}
          {formatCurrency(totalFranking)} franking credits streamed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Franking</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributions.map((distribution) => (
              <TableRow key={distribution.id}>
                <TableCell>{formatDate(distribution.date)}</TableCell>
                <TableCell className="font-medium">
                  {distribution.beneficiary?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {typeLabels[distribution.distribution_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(distribution.amount))}
                </TableCell>
                <TableCell className="text-right">
                  {Number(distribution.franking_credits_streamed) > 0
                    ? formatCurrency(Number(distribution.franking_credits_streamed))
                    : '-'}
                </TableCell>
                <TableCell>
                  {distribution.is_paid ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
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
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(distribution.id)}
                        disabled={isDeleting === distribution.id}
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
