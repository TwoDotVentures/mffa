/**
 * @fileoverview Deduction Dialog Component
 * @description Modal dialog for adding tax deduction entries with category
 * selection, amount, receipt tracking, and optional notes.
 *
 * @features
 * - Deduction category selection (WFH, donations, etc.)
 * - Amount and date input
 * - Receipt URL tracking
 * - Optional notes
 * - Warning display for flagged deductions
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { addDeduction } from '@/lib/deductions/actions';
import type { DeductionCategory, PersonType } from '@/lib/types';
import { DEDUCTION_CATEGORY_LABELS } from '@/lib/types';

/** Props interface for DeductionDialog component */
interface DeductionDialogProps {
  /** Person to add deduction for */
  person: PersonType;
  /** Whether dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
}

/**
 * Deduction Dialog Component
 *
 * Provides a comprehensive form for recording tax deductions
 * with category selection, receipt tracking, and automatic
 * flagging for unusual amounts.
 *
 * @param props - Component props
 * @returns Rendered deduction dialog
 */
export function DeductionDialog({ person, open, onOpenChange }: DeductionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [category, setCategory] = useState<DeductionCategory>('work_from_home');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  /**
   * Handles form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);
    setIsLoading(true);

    try {
      const result = await addDeduction({
        person,
        category,
        description,
        amount: Number(amount),
        date,
        receipt_url: receiptUrl || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        if (result.flagged?.flag) {
          setWarning(result.flagged.reason || 'Deduction flagged for review');
        }
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || 'Failed to add deduction');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /** Resets form to initial state */
  const resetForm = () => {
    setCategory('work_from_home');
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptUrl('');
    setNotes('');
    setError(null);
    setWarning(null);
  };

  const personName = person === 'grant' ? 'Grant' : 'Shannon';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Add Deduction for {personName}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record work-related expenses, donations, or other tax deductions.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Category & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs sm:text-sm">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as DeductionCategory)}
                >
                  <SelectTrigger id="category" className="h-10 text-sm sm:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEDUCTION_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs sm:text-sm">
                  Date
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

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs sm:text-sm">
                Description
              </Label>
              <Input
                id="description"
                placeholder="e.g., Home office internet, Professional membership"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-10 text-sm sm:h-9"
              />
            </div>

            {/* Amount & Receipt URL */}
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
                <Label htmlFor="receiptUrl" className="text-xs sm:text-sm">
                  Receipt URL (optional)
                </Label>
                <Input
                  id="receiptUrl"
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="h-10 text-sm sm:h-9"
                />
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

            {/* Warning Display */}
            {warning && (
              <Alert className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">{warning}</AlertDescription>
              </Alert>
            )}

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
              {isLoading ? 'Adding...' : 'Add Deduction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
