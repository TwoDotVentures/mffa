/**
 * @fileoverview Trust Income Dialog Component
 * @description Modal dialog for adding new trust income entries including
 * dividends, interest, rent, capital gains, and other income types.
 *
 * @features
 * - Income type selection with automatic franking credit handling
 * - Auto-calculated maximum franking credits for dividends
 * - Mobile-optimized form layout with touch-friendly inputs
 * - Form validation with error display
 * - Loading state during submission
 *
 * @mobile Full-width dialog with stacked form fields
 */
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
  DialogBody,
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
import { Loader2 } from 'lucide-react';
import { addTrustIncome } from '@/lib/trust/actions';
import type { TrustIncomeType } from '@/lib/types';

/** Props interface for TrustIncomeDialog component */
interface TrustIncomeDialogProps {
  /** Trust ID for the income entry */
  trustId: string;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Trust Income Dialog Component
 *
 * Provides a form for recording new trust income including
 * source, type, amount, and franking credits.
 *
 * @param props - Component props
 * @returns Rendered income dialog
 */
export function TrustIncomeDialog({ trustId, open, onOpenChange }: TrustIncomeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [incomeType, setIncomeType] = useState<TrustIncomeType>('dividend');
  const [amount, setAmount] = useState('');
  const [frankingCredits, setFrankingCredits] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Auto-calculate max franking credits for dividends (30% company tax rate)
  const maxFranking = incomeType === 'dividend' && amount ? Number(amount) * (30 / 70) : 0;

  /**
   * Handles form submission
   *
   * @param e - Form event
   */
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

  /**
   * Resets all form fields to initial state
   */
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Trust Income</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record dividend income, interest, or other income received by the trust.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Income Type & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="incomeType" className="text-xs sm:text-sm">
                  Income Type
                </Label>
                <Select
                  value={incomeType}
                  onValueChange={(value) => setIncomeType(value as TrustIncomeType)}
                >
                  <SelectTrigger id="incomeType" className="h-10 text-sm sm:h-9">
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

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs sm:text-sm">
                  Date Received
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-10 text-sm sm:h-9"
                />
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-xs sm:text-sm">
                Source
              </Label>
              <Input
                id="source"
                placeholder="e.g., CBA Dividend, Vanguard ETF Distribution"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                className="h-10 text-sm sm:h-9"
              />
            </div>

            {/* Amount & Franking */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs sm:text-sm">
                  Amount ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-10 text-sm sm:h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="frankingCredits" className="text-xs sm:text-sm">
                  Franking Credits ($)
                  {incomeType === 'dividend' && maxFranking > 0 && (
                    <span className="text-muted-foreground ml-1 text-[10px]">
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
                  className="h-10 text-sm sm:h-9"
                />
                {incomeType === 'dividend' && (
                  <p className="text-muted-foreground text-[10px] sm:text-xs">
                    Check your dividend statement for the exact franking credit amount.
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs sm:text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Error Display */}
            {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}
          </DialogBody>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11 sm:min-h-10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-h-11 sm:min-h-10">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
