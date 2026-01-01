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
import { Plus, Loader2, UserPlus } from 'lucide-react';
import { createSmsfMember, updateSmsfMember, type SmsfMember, type SmsfMemberFormData } from '@/lib/smsf/actions';
import { useRouter } from 'next/navigation';

interface MemberDialogProps {
  fundId: string;
  member?: SmsfMember;
  trigger?: React.ReactNode;
}

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
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{member ? 'Edit Member' : 'Add Fund Member'}</DialogTitle>
            <DialogDescription>
              {member ? 'Update member details.' : 'Add a member to your SMSF fund.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Member Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preservation_age">Preservation Age</Label>
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
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="total_super_balance">Total Super Balance</Label>
              <Input
                id="total_super_balance"
                type="number"
                step="0.01"
                value={formData.total_super_balance || ''}
                onChange={(e) =>
                  setFormData({ ...formData, total_super_balance: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Include balances from all super funds (for contribution cap calculations)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="member_status">Member Status</Label>
              <Select
                value={formData.member_status}
                onValueChange={(value: 'accumulation' | 'transition_to_retirement' | 'pension') =>
                  setFormData({ ...formData, member_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accumulation">Accumulation</SelectItem>
                  <SelectItem value="transition_to_retirement">Transition to Retirement</SelectItem>
                  <SelectItem value="pension">Pension</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
