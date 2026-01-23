/**
 * Budget Dialog Component
 *
 * Mobile-first dialog for creating and editing budget limits.
 * Handles category-specific or total expense budgets.
 *
 * Mobile Optimizations:
 * - Full screen on mobile with slide-up animation
 * - Sticky header and footer
 * - Large touch targets (min 44px)
 * - Proper input modes for numeric fields
 *
 * @module components/budgets/budget-dialog
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Wallet, Bell, AlertCircle } from 'lucide-react';
import { createBudget, updateBudget } from '@/lib/budgets/actions';
import type { Budget, BudgetPeriod, Category } from '@/lib/types';
import { BUDGET_PERIOD_LABELS } from '@/lib/types';

/** Props for the BudgetDialog component */
interface BudgetDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Existing budget for edit mode (optional) */
  budget?: Budget | null;
  /** Available expense categories for budget assignment */
  categories: Category[];
}

export function BudgetDialog({ open, onOpenChange, budget, categories }: BudgetDialogProps) {
  const router = useRouter();
  const isEditing = !!budget;

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [alertEnabled, setAlertEnabled] = useState(true);

  /** Reset form fields when dialog opens */
  useEffect(() => {
    if (open) {
      setName(budget?.name || '');
      setCategoryId(budget?.category_id || '');
      setAmount(budget?.amount?.toString() || '');
      setPeriod(budget?.period || 'monthly');
      setAlertThreshold(budget?.alert_threshold?.toString() || '80');
      setAlertEnabled(budget?.alert_enabled ?? true);
      setError(null);
    }
  }, [open, budget]);

  /** Handles form submission for create/update */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      name,
      category_id: categoryId || undefined,
      amount: parseFloat(amount) || 0,
      period,
      alert_threshold: parseInt(alertThreshold) || 80,
      alert_enabled: alertEnabled,
    };

    const result = isEditing
      ? await updateBudget(budget.id, formData)
      : await createBudget(formData);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error || 'An error occurred');
    }

    setLoading(false);
  };

  // Filter to expense categories only
  const expenseCategories = categories.filter((c) => c.category_type === 'expense');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 hidden rounded-full p-2.5 sm:flex">
                <Wallet className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle>{isEditing ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? 'Update your budget settings.'
                    : 'Set a spending limit for a category.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 mb-4 flex items-start gap-3 rounded-lg p-4">
                <AlertCircle
                  className="text-destructive mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Budget Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Budget Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Groceries"
                  className="h-11 sm:h-10"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue placeholder="All expenses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All expenses</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">Leave empty to track all expenses</p>
              </div>

              {/* Amount and Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-11 tabular-nums sm:h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                    <SelectTrigger className="h-11 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUDGET_PERIOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Alert Threshold */}
              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="100"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="h-11 tabular-nums sm:h-10"
                />
                <p className="text-muted-foreground text-xs">
                  Get notified when spending reaches this percentage
                </p>
              </div>

              {/* Alert Toggle */}
              <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/10 p-2">
                    <Bell className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  </div>
                  <div>
                    <Label htmlFor="alert-toggle" className="cursor-pointer font-medium">
                      Enable Alerts
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Receive notifications when approaching limit
                    </p>
                  </div>
                </div>
                <Switch
                  id="alert-toggle"
                  checked={alertEnabled}
                  onCheckedChange={setAlertEnabled}
                />
              </div>
            </div>
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
            <Button type="submit" disabled={loading} className="min-h-11 sm:min-h-10">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEditing ? 'Save Changes' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
