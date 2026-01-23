/**
 * @fileoverview SMSF Investment Dialog Component
 * @description Modal dialog for adding or editing SMSF investments
 * with asset type, valuation details, and performance tracking.
 *
 * @features
 * - Asset type selection (shares, property, cash, etc.)
 * - Investment name and description
 * - Units/shares and acquisition date
 * - Cost base and current value with gain/loss calculation
 * - Income YTD tracking
 * - Mobile-optimized form layout with touch-friendly inputs
 * - Loading state during submission
 *
 * @mobile Full-width dialog with stacked form fields
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, TrendingUp } from 'lucide-react';
import { createSmsfInvestment, updateSmsfInvestment, type SmsfInvestment, type SmsfInvestmentFormData } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

/** Props interface for InvestmentDialog component */
interface InvestmentDialogProps {
  /** SMSF fund ID */
  fundId: string;
  /** Existing investment for editing (optional) */
  investment?: SmsfInvestment;
  /** Custom trigger element (optional) */
  trigger?: React.ReactNode;
}

/** Asset type options */
const ASSET_TYPES = [
  { value: 'australian_shares', label: 'Australian Shares' },
  { value: 'international_shares', label: 'International Shares' },
  { value: 'property', label: 'Property' },
  { value: 'fixed_income', label: 'Fixed Income / Bonds' },
  { value: 'cash', label: 'Cash & Term Deposits' },
  { value: 'cryptocurrency', label: 'Cryptocurrency' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'other', label: 'Other' },
];

/**
 * Formats a number as Australian currency
 *
 * @param amount - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);

/**
 * Investment Dialog Component
 *
 * Provides a form for adding or editing SMSF investments
 * with asset details and valuation information.
 *
 * @param props - Component props
 * @returns Rendered investment dialog
 */
export function InvestmentDialog({ fundId, investment, trigger }: InvestmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<SmsfInvestmentFormData>({
    fund_id: fundId,
    asset_type: investment?.asset_type || 'australian_shares',
    name: investment?.name || '',
    description: investment?.description || '',
    units: investment?.units || undefined,
    cost_base: investment?.cost_base || 0,
    current_value: investment?.current_value || 0,
    acquisition_date: investment?.acquisition_date || '',
    income_ytd: investment?.income_ytd || 0,
  });

  /**
   * Handles form submission
   *
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (investment) {
        await updateSmsfInvestment(investment.id, formData);
      } else {
        await createSmsfInvestment(formData);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Calculate unrealised gain/loss
  const gainLoss = formData.current_value - formData.cost_base;
  const gainLossPercent = formData.cost_base > 0 ? (gainLoss / formData.cost_base) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-9 sm:h-8 text-xs sm:text-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Investment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {investment ? 'Edit Investment' : 'Add Investment'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {investment ? 'Update investment details.' : 'Add an investment to your SMSF portfolio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Asset Type */}
            <div className="space-y-1.5">
              <Label htmlFor="asset_type" className="text-xs sm:text-sm">Asset Type *</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(value: SmsfInvestmentFormData['asset_type']) =>
                  setFormData({ ...formData, asset_type: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Investment Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm">Investment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VAS - Vanguard Australian Shares ETF"
                required
                className="h-10 sm:h-9 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes about this investment"
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {/* Units & Acquisition Date */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="units" className="text-xs sm:text-sm">Units/Shares</Label>
                <Input
                  id="units"
                  type="number"
                  step="0.000001"
                  value={formData.units || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, units: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  placeholder="0"
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acquisition_date" className="text-xs sm:text-sm">Acquisition Date</Label>
                <Input
                  id="acquisition_date"
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
            </div>

            {/* Cost Base & Current Value */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cost_base" className="text-xs sm:text-sm">Cost Base *</Label>
                <Input
                  id="cost_base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_base || ''}
                  onChange={(e) => setFormData({ ...formData, cost_base: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current_value" className="text-xs sm:text-sm">Current Value *</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_value || ''}
                  onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
            </div>

            {/* Gain/Loss Preview */}
            {formData.cost_base > 0 && (
              <div className="rounded-lg bg-muted p-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Unrealised Gain/Loss:</span>
                  <span className={`font-medium tabular-nums ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Income YTD */}
            <div className="space-y-1.5">
              <Label htmlFor="income_ytd" className="text-xs sm:text-sm">Income YTD</Label>
              <Input
                id="income_ytd"
                type="number"
                step="0.01"
                min="0"
                value={formData.income_ytd || ''}
                onChange={(e) => setFormData({ ...formData, income_ytd: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-10 sm:h-9 text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Dividends, distributions, and interest received this financial year
              </p>
            </div>

            {/* Error Display */}
            {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 sm:h-9 text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-10 sm:h-9 text-sm">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {investment ? 'Save Changes' : 'Add Investment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
