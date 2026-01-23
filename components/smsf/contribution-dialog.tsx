/**
 * @fileoverview SMSF Contribution Dialog Component
 * @description Modal dialog for recording super contributions with
 * member selection, contribution type, and cap information.
 *
 * @features
 * - Member selection dropdown
 * - Contribution type selection with cap descriptions
 * - Amount and date input
 * - Optional description field
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
import { Plus, Loader2 } from 'lucide-react';
import { createSmsfContribution, type SmsfMember, type SmsfContributionFormData } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

/** Props interface for ContributionDialog component */
interface ContributionDialogProps {
  /** SMSF fund ID */
  fundId: string;
  /** Array of fund members */
  members: SmsfMember[];
  /** Custom trigger element (optional) */
  trigger?: React.ReactNode;
}

/** Contribution type options with descriptions */
const CONTRIBUTION_TYPES = [
  { value: 'concessional', label: 'Concessional (Before-Tax)', description: '$30,000 cap' },
  { value: 'non_concessional', label: 'Non-Concessional (After-Tax)', description: '$120,000 cap' },
  { value: 'government_co_contribution', label: 'Government Co-contribution', description: 'Up to $500' },
  { value: 'spouse', label: 'Spouse Contribution', description: 'Tax offset available' },
  { value: 'downsizer', label: 'Downsizer Contribution', description: 'Up to $300,000 each' },
];

/**
 * Contribution Dialog Component
 *
 * Provides a form for recording super contributions with
 * member selection and contribution type.
 *
 * @param props - Component props
 * @returns Rendered contribution dialog
 */
export function ContributionDialog({ fundId, members, trigger }: ContributionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<SmsfContributionFormData>({
    fund_id: fundId,
    member_id: members[0]?.id || '',
    contribution_type: 'concessional',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
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
      await createSmsfContribution(formData);
      setOpen(false);
      setFormData({
        ...formData,
        amount: 0,
        description: '',
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = CONTRIBUTION_TYPES.find((t) => t.value === formData.contribution_type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-9 sm:h-8 text-xs sm:text-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Record Contribution
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Record Contribution</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record a super contribution for a fund member.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Member Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="member" className="text-xs sm:text-sm">Member *</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contribution Type */}
            <div className="space-y-1.5">
              <Label htmlFor="contribution_type" className="text-xs sm:text-sm">Contribution Type *</Label>
              <Select
                value={formData.contribution_type}
                onValueChange={(value: SmsfContributionFormData['contribution_type']) =>
                  setFormData({ ...formData, contribution_type: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedType.description}</p>
              )}
            </div>

            {/* Amount & Date */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs sm:text-sm">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs sm:text-sm">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes about this contribution"
                rows={2}
                className="text-sm resize-none"
              />
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
            <Button type="submit" disabled={loading || !formData.member_id} className="h-10 sm:h-9 text-sm">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Contribution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
