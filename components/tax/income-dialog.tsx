/**
 * @fileoverview Income Dialog Component
 * @description Modal dialog for adding income entries with type selection,
 * amount, franking credits, and tax withheld tracking.
 *
 * @features
 * - Income type selection (salary, dividend, trust, etc.)
 * - Amount and date input
 * - Franking credits with auto-calculated max for dividends
 * - Tax withheld tracking
 * - Taxable/non-taxable toggle
 * - Optional notes
 * - Mobile-optimized form layout
 *
 * @mobile Full-width dialog with stacked form fields, touch-friendly inputs
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

/** Props interface for IncomeDialog component */
interface IncomeDialogProps {
  /** Person to add income for */
  person: PersonType;
  /** Whether dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
}

/**
 * Income Dialog Component
 *
 * Provides a comprehensive form for recording income entries
 * with support for various income types, franking credits,
 * and tax withheld tracking.
 *
 * @param props - Component props
 * @returns Rendered income dialog
 */
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

  /**
   * Calculate maximum franking credits for fully-franked dividends
   * Formula: Dividend amount * (30/70) for 30% corporate tax rate
   */
  const maxFranking = incomeType === 'dividend' && amount ? Number(amount) * (30 / 70) : 0;

  /**
   * Handles form submission
   * @param e - Form event
   */
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
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /** Resets form to initial state */
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Income for {personName}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record salary, dividends, trust distributions, or other taxable income.
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
                  onValueChange={(value) => setIncomeType(value as IncomeType)}
                >
                  <SelectTrigger id="incomeType" className="h-10 text-sm sm:h-9">
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
                placeholder="e.g., Employer Name, CBA Dividend, Trust Distribution"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                className="h-10 text-sm sm:h-9"
              />
            </div>

            {/* Amount, Franking, Tax Withheld */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
                  Franking ($)
                  {incomeType === 'dividend' && maxFranking > 0 && (
                    <span className="text-muted-foreground ml-1 text-[10px] sm:text-xs">
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
                  className="h-10 text-sm sm:h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taxWithheld" className="text-xs sm:text-sm">
                  Tax Withheld ($)
                </Label>
                <Input
                  id="taxWithheld"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={taxWithheld}
                  onChange={(e) => setTaxWithheld(e.target.value)}
                  className="h-10 text-sm sm:h-9"
                />
              </div>
            </div>

            {/* Taxable Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Switch id="isTaxable" checked={isTaxable} onCheckedChange={setIsTaxable} />
                <Label htmlFor="isTaxable" className="text-xs sm:text-sm">
                  Taxable income
                </Label>
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
              {isLoading ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
