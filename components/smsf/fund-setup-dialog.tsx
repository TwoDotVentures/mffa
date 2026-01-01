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

interface FundSetupDialogProps {
  fund?: SmsfFund;
  trigger?: React.ReactNode;
}

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Set Up SMSF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {fund ? 'Edit SMSF Fund' : 'Set Up Your SMSF'}
            </DialogTitle>
            <DialogDescription>
              {fund
                ? 'Update your SMSF fund details.'
                : 'Enter your Self-Managed Super Fund details to get started.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Fund Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Moyle Family Super Fund"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="abn">Fund ABN</Label>
              <Input
                id="abn"
                value={formData.abn}
                onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                placeholder="XX XXX XXX XXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="trustee_name">Trustee Name</Label>
                <Input
                  id="trustee_name"
                  value={formData.trustee_name}
                  onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value })}
                  placeholder="Corporate trustee name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trustee_abn">Trustee ABN</Label>
                <Input
                  id="trustee_abn"
                  value={formData.trustee_abn}
                  onChange={(e) => setFormData({ ...formData, trustee_abn: e.target.value })}
                  placeholder="XX XXX XXX XXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="establishment_date">Establishment Date</Label>
                <Input
                  id="establishment_date"
                  type="date"
                  value={formData.establishment_date}
                  onChange={(e) => setFormData({ ...formData, establishment_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fund_status">Fund Status</Label>
                <Select
                  value={formData.fund_status}
                  onValueChange={(value: 'active' | 'winding_up' | 'wound_up') =>
                    setFormData({ ...formData, fund_status: value })
                  }
                >
                  <SelectTrigger>
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

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fund ? 'Save Changes' : 'Create Fund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
