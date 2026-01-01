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
import { addTrustIncome } from '@/lib/trust/actions';
import type { TrustIncomeType } from '@/lib/types';

interface TrustIncomeDialogProps {
  trustId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrustIncomeDialog({
  trustId,
  open,
  onOpenChange,
}: TrustIncomeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [incomeType, setIncomeType] = useState<TrustIncomeType>('dividend');
  const [amount, setAmount] = useState('');
  const [frankingCredits, setFrankingCredits] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Auto-calculate max franking credits for dividends
  const maxFranking = incomeType === 'dividend' && amount
    ? Number(amount) * (30 / 70) // 30% company tax rate
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await addTrustIncome(trustId, {
        source,
        income_type: incomeType,
        amount: Number(amount),
        franking_credits: Number(frankingCredits) || 0,
        date,
        notes: notes || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || 'Failed to add income');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSource('');
    setIncomeType('dividend');
    setAmount('');
    setFrankingCredits('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Trust Income</DialogTitle>
          <DialogDescription>
            Record dividend income, interest, or other income received by the trust.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="incomeType">Income Type</Label>
              <Select
                value={incomeType}
                onValueChange={(value) => setIncomeType(value as TrustIncomeType)}
              >
                <SelectTrigger id="incomeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dividend">Dividend</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="capital_gain">Capital Gain</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date Received</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="e.g., CBA Dividend, Vanguard ETF Distribution"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frankingCredits">
                Franking Credits ($)
                {incomeType === 'dividend' && maxFranking > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (max ${maxFranking.toFixed(2)})
                  </span>
                )}
              </Label>
              <Input
                id="frankingCredits"
                type="number"
                step="0.01"
                min="0"
                max={maxFranking || undefined}
                placeholder="0.00"
                value={frankingCredits}
                onChange={(e) => setFrankingCredits(e.target.value)}
                disabled={incomeType !== 'dividend'}
              />
              {incomeType === 'dividend' && (
                <p className="text-xs text-muted-foreground">
                  Check your dividend statement for the exact franking credit amount.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
