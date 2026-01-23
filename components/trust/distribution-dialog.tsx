/**
 * @fileoverview Distribution Dialog Component
 * @description Modal dialog for recording trust distributions to beneficiaries
 * with franking credit streaming support.
 *
 * @features
 * - Beneficiary selection dropdown
 * - Distribution type selection (Income/Capital/Mixed)
 * - Amount validation against distributable balance
 * - Franking credit streaming with available balance
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
import { addTrustDistribution } from '@/lib/trust/actions';
import type { TrustBeneficiary, TrustDistributionType } from '@/lib/types';

/** Props interface for DistributionDialog component */
interface DistributionDialogProps {
  /** Trust ID for the distribution */
  trustId: string;
  /** Array of available beneficiaries */
  beneficiaries: TrustBeneficiary[];
  /** Maximum amount available for distribution */
  maxAmount: number;
  /** Available franking credits to stream */
  frankingAvailable: number;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Formats a number as Australian currency without decimal places
 *
 * @param num - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (num: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

/**
 * Distribution Dialog Component
 *
 * Provides a form for recording trust distributions to
 * beneficiaries including franking credit streaming.
 *
 * @param props - Component props
 * @returns Rendered distribution dialog
 */
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
  const [distributionType, setDistributionType] = useState<TrustDistributionType>('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  /**
   * Handles form submission with validation
   *
   * @param e - Form event
   */
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
      setError(`Franking credits exceed available balance of ${formatCurrency(frankingAvailable)}`);
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

  /**
   * Resets all form fields to initial state
   */
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Record Distribution</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record a distribution to a beneficiary. Distributable amount:{' '}
              <span className="font-semibold tabular-nums">{formatCurrency(maxAmount)}</span>
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Beneficiary & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary" className="text-xs sm:text-sm">
                  Beneficiary
                </Label>
                <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
                  <SelectTrigger id="beneficiary" className="h-10 text-sm sm:h-9">
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

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs sm:text-sm">
                  Distribution Date
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

            {/* Amount & Type */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs sm:text-sm">
                  Amount ($)
                  <span className="text-muted-foreground ml-1 text-[10px]">
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
                  className="h-10 text-sm sm:h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="distributionType" className="text-xs sm:text-sm">
                  Type
                </Label>
                <Select
                  value={distributionType}
                  onValueChange={(value) => setDistributionType(value as TrustDistributionType)}
                >
                  <SelectTrigger id="distributionType" className="h-10 text-sm sm:h-9">
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

            {/* Franking Credits */}
            <div className="space-y-1.5">
              <Label htmlFor="frankingCredits" className="text-xs sm:text-sm">
                Franking Credits to Stream ($)
                <span className="text-muted-foreground ml-1 text-[10px]">
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
                className="h-10 text-sm sm:h-9"
              />
              <p className="text-muted-foreground text-[10px] sm:text-xs">
                Stream franking credits to beneficiaries who will benefit most from the tax offset.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs sm:text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Distribution resolution reference, payment details..."
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
              {isLoading ? 'Recording...' : 'Record Distribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
