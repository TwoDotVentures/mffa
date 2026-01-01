'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from 'lucide-react';
import { createAccount, updateAccount } from '@/lib/accounts/actions';
import type { Account, AccountType } from '@/lib/types';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'loan', label: 'Loan' },
  { value: 'cash', label: 'Cash' },
];

export function AccountDialog({ open, onOpenChange, account }: AccountDialogProps) {
  const router = useRouter();
  const isEditing = !!account;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(account?.name || '');
  const [accountType, setAccountType] = useState<AccountType>(account?.account_type || 'bank');
  const [institution, setInstitution] = useState(account?.institution || '');
  const [accountNumber, setAccountNumber] = useState(account?.account_number || '');
  const [bsb, setBsb] = useState(account?.bsb || '');
  const [currentBalance, setCurrentBalance] = useState(account?.current_balance?.toString() || '0');
  const [creditLimit, setCreditLimit] = useState(account?.credit_limit?.toString() || '');
  const [interestRate, setInterestRate] = useState(account?.interest_rate?.toString() || '');
  const [notes, setNotes] = useState(account?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      name,
      account_type: accountType,
      institution: institution || undefined,
      account_number: accountNumber || undefined,
      bsb: bsb || undefined,
      current_balance: parseFloat(currentBalance) || 0,
      credit_limit: creditLimit ? parseFloat(creditLimit) : undefined,
      interest_rate: interestRate ? parseFloat(interestRate) : undefined,
      notes: notes || undefined,
    };

    const result = isEditing
      ? await updateAccount(account.id, formData)
      : await createAccount(formData);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error || 'An error occurred');
    }

    setLoading(false);
  };

  const showCreditFields = accountType === 'credit';
  const showLoanFields = accountType === 'loan';
  const showBankFields = accountType === 'bank';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Account' : 'Add Account'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update your account details.' : 'Add a new account to track.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Everyday Account"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g., Commonwealth Bank"
              />
            </div>

            {showBankFields && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bsb">BSB</Label>
                  <Input
                    id="bsb"
                    value={bsb}
                    onChange={(e) => setBsb(e.target.value)}
                    placeholder="000-000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="balance">
                {showCreditFields || showLoanFields ? 'Current Owing' : 'Current Balance'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {showCreditFields && (
              <div className="grid gap-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {(showCreditFields || showLoanFields) && (
              <div className="grid gap-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
