/**
 * @fileoverview SMSF Fund Setup Dialog Component
 * @description Modal dialog for creating or editing SMSF fund details
 * including fund name, ABN, trustee information, and status.
 *
 * @features
 * - Create new SMSF fund or edit existing
 * - Fund name and ABN input
 * - Trustee name and ABN input
 * - Establishment date and fund status
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
import { Plus, Loader2, Building2 } from 'lucide-react';
import { createSmsfFund, updateSmsfFund, type SmsfFund, type SmsfFundFormData } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

/** Props interface for FundSetupDialog component */
interface FundSetupDialogProps {
  /** Existing fund for editing (optional) */
  fund?: SmsfFund;
  /** Custom trigger element (optional) */
  trigger?: React.ReactNode;
}

/**
 * Fund Setup Dialog Component
 *
 * Provides a form for creating or editing SMSF fund details
 * including fund name, ABN, and trustee information.
 *
 * @param props - Component props
 * @returns Rendered fund setup dialog
 */
export function FundSetupDialog({ fund, trigger }: FundSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<SmsfFundFormData>({
    name: fund?.name || '',
    abn: fund?.abn || '',
    trustee_name: fund?.trustee_name || '',
    trustee_abn: fund?.trustee_abn || '',
    establishment_date: fund?.establishment_date || '',
    fund_status: fund?.fund_status || 'active',
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
      if (fund) {
        await updateSmsfFund(fund.id, formData);
      } else {
        await createSmsfFund(formData);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11 sm:h-10 text-sm">
            <Plus className="mr-2 h-4 w-4" />
            Set Up SMSF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              {fund ? 'Edit SMSF Fund' : 'Set Up Your SMSF'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {fund
                ? 'Update your SMSF fund details.'
                : 'Enter your Self-Managed Super Fund details to get started.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Fund Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm">Fund Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Moyle Family Super Fund"
                required
                className="h-10 sm:h-9 text-sm"
              />
            </div>

            {/* Fund ABN */}
            <div className="space-y-1.5">
              <Label htmlFor="abn" className="text-xs sm:text-sm">Fund ABN</Label>
              <Input
                id="abn"
                value={formData.abn}
                onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                placeholder="XX XXX XXX XXX"
                className="h-10 sm:h-9 text-sm"
              />
            </div>

            {/* Trustee Name & ABN */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="trustee_name" className="text-xs sm:text-sm">Trustee Name</Label>
                <Input
                  id="trustee_name"
                  value={formData.trustee_name}
                  onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value })}
                  placeholder="Corporate trustee name"
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trustee_abn" className="text-xs sm:text-sm">Trustee ABN</Label>
                <Input
                  id="trustee_abn"
                  value={formData.trustee_abn}
                  onChange={(e) => setFormData({ ...formData, trustee_abn: e.target.value })}
                  placeholder="XX XXX XXX XXX"
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
            </div>

            {/* Establishment Date & Status */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="establishment_date" className="text-xs sm:text-sm">Establishment Date</Label>
                <Input
                  id="establishment_date"
                  type="date"
                  value={formData.establishment_date}
                  onChange={(e) => setFormData({ ...formData, establishment_date: e.target.value })}
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fund_status" className="text-xs sm:text-sm">Fund Status</Label>
                <Select
                  value={formData.fund_status}
                  onValueChange={(value: 'active' | 'winding_up' | 'wound_up') =>
                    setFormData({ ...formData, fund_status: value })
                  }
                >
                  <SelectTrigger className="h-10 sm:h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="winding_up">Winding Up</SelectItem>
                    <SelectItem value="wound_up">Wound Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {fund ? 'Save Changes' : 'Create Fund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
