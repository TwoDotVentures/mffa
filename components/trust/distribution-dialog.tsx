'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addTrustDistribution } from '@/lib/trust/actions';
import type { TrustBeneficiary, TrustDistributionType } from '@/lib/types';

interface DistributionDialogProps {
  trustId: string;
  beneficiaries: TrustBeneficiary[];
  maxAmount: number;
  frankingAvailable: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DistributionDialog({
  trustId,
  beneficiaries,
  maxAmount,
  frankingAvailable,
  open,
  onOpenChange,
}: DistributionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [frankingCredits, setFrankingCredits] = useState('');
  const [distributionType, setDistributionType] =
    useState<TrustDistributionType>('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!beneficiaryId) {
      setError('Please select a beneficiary');
      return;
    }

    const numAmount = Number(amount);
    if (numAmount > maxAmount) {
      setError(`Amount exceeds distributable amount of ${formatCurrency(maxAmount)}`);
      return;
    }

    const numFranking = Number(frankingCredits) || 0;
    if (numFranking > frankingAvailable) {
      setError(
        `Franking credits exceed available balance of ${formatCurrency(frankingAvailable)}`
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await addTrustDistribution(trustId, {
        beneficiary_id: beneficiaryId,
        amount: numAmount,
        franking_credits_streamed: numFranking,
        distribution_type: distributionType,
        date,
        notes: notes || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || 'Failed to record distribution');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBeneficiaryId('');
    setAmount('');
    setFrankingCredits('');
    setDistributionType('income');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Distribution</DialogTitle>
          <DialogDescription>
            Record a distribution to a beneficiary. Distributable amount:{' '}
            <span className="font-medium">{formatCurrency(maxAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiary</Label>
              <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
                <SelectTrigger id="beneficiary">
                  <SelectValue placeholder="Select beneficiary" />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Distribution Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ($)
                <span className="ml-1 text-xs text-muted-foreground">
                  (max {formatCurrency(maxAmount)})
                </span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributionType">Type</Label>
              <Select
                value={distributionType}
                onValueChange={(value) =>
                  setDistributionType(value as TrustDistributionType)
                }
              >
                <SelectTrigger id="distributionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="capital">Capital</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frankingCredits">
              Franking Credits to Stream ($)
              <span className="ml-1 text-xs text-muted-foreground">
                (available: {formatCurrency(frankingAvailable)})
              </span>
            </Label>
            <Input
              id="frankingCredits"
              type="number"
              step="0.01"
              min="0"
              max={frankingAvailable}
              placeholder="0.00"
              value={frankingCredits}
              onChange={(e) => setFrankingCredits(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Stream franking credits to beneficiaries who will benefit most from the
              tax offset.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Distribution resolution reference, payment details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Recording...' : 'Record Distribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
