/**
 * Account Dialog Component
 *
 * Mobile-first dialog for creating and editing financial accounts.
 * Supports bank accounts, credit cards, investments, loans, and cash.
 *
 * Mobile Optimizations:
 * - Full screen on mobile with slide-up animation
 * - Sticky header and footer
 * - Large touch targets (min 44px)
 * - Proper input modes for numeric fields
 *
 * @module components/accounts/account-dialog
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
import { Loader2 } from 'lucide-react';
import { createAccount, updateAccount } from '@/lib/accounts/actions';
import type { Account, AccountType, AccountGroup } from '@/lib/types';

interface AccountDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Account to edit, or null/undefined for creating a new account */
  account?: Account | null;
}

/** Available account types with human-readable labels */
const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'loan', label: 'Loan' },
  { value: 'cash', label: 'Cash' },
];

/** Available account groups with human-readable labels */
const accountGroups: { value: AccountGroup; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'trust', label: 'Trust' },
  { value: 'smsf', label: 'SMSF' },
];

export function AccountDialog({ open, onOpenChange, account }: AccountDialogProps) {
  const router = useRouter();
  const isEditing = !!account;

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form field values
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [accountGroup, setAccountGroup] = useState<AccountGroup>('family');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bsb, setBsb] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [notes, setNotes] = useState('');

  /**
   * Sync form state when account prop changes (for editing)
   * Resets form when switching between create/edit modes
   */
  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setAccountType(account.account_type || 'bank');
      setAccountGroup(account.account_group || 'family');
      setInstitution(account.institution || '');
      setAccountNumber(account.account_number || '');
      setBsb(account.bsb || '');
      setCurrentBalance(account.current_balance?.toString() || '0');
      setCreditLimit(account.credit_limit?.toString() || '');
      setInterestRate(account.interest_rate?.toString() || '');
      setNotes(account.notes || '');
      setError(null);
    } else {
      // Reset form for new account
      setName('');
      setAccountType('bank');
      setAccountGroup('family');
      setInstitution('');
      setAccountNumber('');
      setBsb('');
      setCurrentBalance('0');
      setCreditLimit('');
      setInterestRate('');
      setNotes('');
      setError(null);
    }
  }, [account]);

  /** Handles form submission for creating or updating an account */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      name,
      account_type: accountType,
      account_group: accountGroup,
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

  // Determine which conditional fields to show based on account type
  const showCreditFields = accountType === 'credit';
  const showLoanFields = accountType === 'loan';
  const showBankFields = accountType === 'bank';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Account' : 'Add Account'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update your account details.' : 'Add a new account to track.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Account Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Everyday Account"
                  required
                  className="h-11 sm:h-10"
                />
              </div>

              {/* Account Type and Group */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={accountType}
                    onValueChange={(v) => setAccountType(v as AccountType)}
                  >
                    <SelectTrigger className="h-11 sm:h-10">
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

                <div className="space-y-2">
                  <Label htmlFor="group">
                    Group <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={accountGroup}
                    onValueChange={(v) => setAccountGroup(v as AccountGroup)}
                  >
                    <SelectTrigger className="h-11 sm:h-10">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountGroups.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g., Commonwealth Bank"
                  className="h-11 sm:h-10"
                />
              </div>

              {/* BSB and Account Number - Bank accounts only */}
              {showBankFields && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="bsb">BSB</Label>
                    <Input
                      id="bsb"
                      value={bsb}
                      onChange={(e) => setBsb(e.target.value)}
                      placeholder="000-000"
                      className="h-11 sm:h-10"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="12345678"
                      className="h-11 sm:h-10"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              {/* Starting Balance / Amount Owing */}
              <div className="space-y-2">
                <Label htmlFor="balance">
                  {showCreditFields || showLoanFields ? 'Amount Owing' : 'Starting Balance'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    className="pl-7 h-11 sm:h-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Credit Limit - Credit cards only */}
              {showCreditFields && (
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="pl-7 h-11 sm:h-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Interest Rate - Credit cards and loans */}
              {(showCreditFields || showLoanFields) && (
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate</Label>
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="pr-7 h-11 sm:h-10"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="h-11 sm:h-10"
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
            <Button
              type="submit"
              disabled={loading}
              className="min-h-11 sm:min-h-10"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
