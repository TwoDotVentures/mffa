/**
 * @fileoverview SMSF Member Dialog Component
 * @description Modal dialog for adding or editing SMSF fund members
 * with personal details, preservation age, and member status.
 *
 * @features
 * - Add new member or edit existing
 * - Personal details (name, date of birth)
 * - Preservation age input (55-60 range)
 * - Total super balance for cap calculations
 * - Member status selection (accumulation/TTR/pension)
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
import { Loader2, UserPlus } from 'lucide-react';
import { createSmsfMember, updateSmsfMember, type SmsfMember, type SmsfMemberFormData } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

/** Props interface for MemberDialog component */
interface MemberDialogProps {
  /** SMSF fund ID */
  fundId: string;
  /** Existing member for editing (optional) */
  member?: SmsfMember;
  /** Custom trigger element (optional) */
  trigger?: React.ReactNode;
}

/**
 * Member Dialog Component
 *
 * Provides a form for adding or editing SMSF fund members
 * with personal details and super balance information.
 *
 * @param props - Component props
 * @returns Rendered member dialog
 */
export function MemberDialog({ fundId, member, trigger }: MemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<SmsfMemberFormData>({
    fund_id: fundId,
    name: member?.name || '',
    date_of_birth: member?.date_of_birth || '',
    preservation_age: member?.preservation_age || undefined,
    total_super_balance: member?.total_super_balance || 0,
    member_status: member?.member_status || 'accumulation',
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
      if (member) {
        await updateSmsfMember(member.id, formData);
      } else {
        await createSmsfMember(formData);
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
          <Button variant="outline" size="sm" className="h-9 sm:h-8 text-xs sm:text-sm">
            <UserPlus className="mr-1.5 h-4 w-4" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {member ? 'Edit Member' : 'Add Fund Member'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {member ? 'Update member details.' : 'Add a member to your SMSF fund.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Member Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm">Member Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
                className="h-10 sm:h-9 text-sm"
              />
            </div>

            {/* Date of Birth & Preservation Age */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth" className="text-xs sm:text-sm">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preservation_age" className="text-xs sm:text-sm">Preservation Age</Label>
                <Input
                  id="preservation_age"
                  type="number"
                  min="55"
                  max="60"
                  value={formData.preservation_age || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, preservation_age: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="55-60"
                  className="h-10 sm:h-9 text-sm"
                />
              </div>
            </div>

            {/* Total Super Balance */}
            <div className="space-y-1.5">
              <Label htmlFor="total_super_balance" className="text-xs sm:text-sm">Total Super Balance</Label>
              <Input
                id="total_super_balance"
                type="number"
                step="0.01"
                value={formData.total_super_balance || ''}
                onChange={(e) =>
                  setFormData({ ...formData, total_super_balance: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className="h-10 sm:h-9 text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Include balances from all super funds (for contribution cap calculations)
              </p>
            </div>

            {/* Member Status */}
            <div className="space-y-1.5">
              <Label htmlFor="member_status" className="text-xs sm:text-sm">Member Status</Label>
              <Select
                value={formData.member_status}
                onValueChange={(value: 'accumulation' | 'transition_to_retirement' | 'pension') =>
                  setFormData({ ...formData, member_status: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accumulation">Accumulation</SelectItem>
                  <SelectItem value="transition_to_retirement">Transition to Retirement</SelectItem>
                  <SelectItem value="pension">Pension</SelectItem>
                </SelectContent>
              </Select>
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
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
