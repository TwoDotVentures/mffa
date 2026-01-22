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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addIncome } from '@/lib/income/actions';
import type { IncomeType, PersonType } from '@/lib/types';
import { INCOME_TYPE_LABELS } from '@/lib/types';

interface IncomeDialogProps {
  person: PersonType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncomeDialog({ person, open, onOpenChange }: IncomeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [amount, setAmount] = useState('');
  const [frankingCredits, setFrankingCredits] = useState('');
  const [taxWithheld, setTaxWithheld] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaxable, setIsTaxable] = useState(true);
  const [notes, setNotes] = useState('');

  // Auto-calculate max franking credits for dividends
  const maxFranking =
    incomeType === 'dividend' && amount ? Number(amount) * (30 / 70) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await addIncome({
        person,
        source,
        income_type: incomeType,
        amount: Number(amount),
        franking_credits: Number(frankingCredits) || 0,
        tax_withheld: Number(taxWithheld) || 0,
        date,
        is_taxable: isTaxable,
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
    setIncomeType('salary');
    setAmount('');
    setFrankingCredits('');
    setTaxWithheld('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsTaxable(true);
    setNotes('');
    setError(null);
  };

  const personName = person === 'grant' ? 'Grant' : 'Shannon';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Income for {personName}</DialogTitle>
          <DialogDescription>
            Record salary, dividends, trust distributions, or other taxable income.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="incomeType">Income Type</Label>
              <Select
                value={incomeType}
                onValueChange={(value) => setIncomeType(value as IncomeType)}
              >
                <SelectTrigger id="incomeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
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
              placeholder="e.g., Employer Name, CBA Dividend, Trust Distribution"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
                Franking ($)
                {incomeType === 'dividend' && maxFranking > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (max ${maxFranking.toFixed(0)})
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
                disabled={incomeType !== 'dividend' && incomeType !== 'trust_distribution'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxWithheld">Tax Withheld ($)</Label>
              <Input
                id="taxWithheld"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={taxWithheld}
                onChange={(e) => setTaxWithheld(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="isTaxable"
                checked={isTaxable}
                onCheckedChange={setIsTaxable}
              />
              <Label htmlFor="isTaxable">Taxable income</Label>
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
