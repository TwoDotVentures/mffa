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

interface InvestmentDialogProps {
  fundId: string;
  investment?: SmsfInvestment;
  trigger?: React.ReactNode;
}

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

  const gainLoss = formData.current_value - formData.cost_base;
  const gainLossPercent = formData.cost_base > 0 ? (gainLoss / formData.cost_base) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {investment ? 'Edit Investment' : 'Add Investment'}
            </DialogTitle>
            <DialogDescription>
              {investment ? 'Update investment details.' : 'Add an investment to your SMSF portfolio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset_type">Asset Type *</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(value: SmsfInvestmentFormData['asset_type']) =>
                  setFormData({ ...formData, asset_type: value })
                }
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="name">Investment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VAS - Vanguard Australian Shares ETF"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes about this investment"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="units">Units/Shares</Label>
                <Input
                  id="units"
                  type="number"
                  step="0.000001"
                  value={formData.units || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, units: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="acquisition_date">Acquisition Date</Label>
                <Input
                  id="acquisition_date"
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost_base">Cost Base *</Label>
                <Input
                  id="cost_base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_base || ''}
                  onChange={(e) => setFormData({ ...formData, cost_base: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_value">Current Value *</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_value || ''}
                  onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.cost_base > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>Unrealised Gain/Loss:</span>
                  <span className={gainLoss >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="income_ytd">Income YTD</Label>
              <Input
                id="income_ytd"
                type="number"
                step="0.01"
                min="0"
                value={formData.income_ytd || ''}
                onChange={(e) => setFormData({ ...formData, income_ytd: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Dividends, distributions, and interest received this financial year
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {investment ? 'Save Changes' : 'Add Investment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
