'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { AccountDialog } from './account-dialog';
import { deleteAccount } from '@/lib/accounts/actions';
import type { Account } from '@/lib/types';

interface AccountsListProps {
  accounts: Account[];
}

const accountTypeLabels: Record<string, string> = {
  bank: 'Bank',
  credit: 'Credit Card',
  investment: 'Investment',
  loan: 'Loan',
  cash: 'Cash',
};

const accountTypeColors: Record<string, string> = {
  bank: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  credit: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  investment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  loan: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cash: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deletingAccount) return;

    setDeleteLoading(true);
    const result = await deleteAccount(deletingAccount.id);

    if (result.success) {
      setDeletingAccount(null);
      router.refresh();
    }

    setDeleteLoading(false);
  };

  if (accounts.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="mb-2">No accounts added yet.</p>
          <p className="text-sm">Add your first account to start tracking your finances.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
            const displayBalance = isDebt ? -Math.abs(account.current_balance) : account.current_balance;

            return (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={accountTypeColors[account.account_type]}>
                    {accountTypeLabels[account.account_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {account.institution || '—'}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    displayBalance < 0 ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  {formatCurrency(displayBalance)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingAccount(account)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <AccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        account={editingAccount}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingAccount?.name}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAccount(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
