'use client';

import { useState, useEffect, Fragment } from 'react';
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
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Pencil, Trash2, Loader2, RefreshCw, Link2, Link2Off } from 'lucide-react';
import { AccountDialog } from './account-dialog';
import { deleteAccount } from '@/lib/accounts/actions';
import {
  syncAccountTransactions,
  getXeroLinkStatusForAccounts,
  getAvailableXeroAccountsForLinking,
  linkLocalAccountToXero,
  unlinkLocalAccountFromXero,
} from '@/lib/xero/actions';
import { toast } from 'sonner';
import type { Account, AccountGroup } from '@/lib/types';
import { ACCOUNT_GROUP_LABELS, ACCOUNT_GROUP_ORDER } from '@/lib/types';

interface XeroLinkInfo {
  xeroAccountName: string;
  connectionId: string;
  mappingId: string;
  lastSyncAt: string | null;
}

interface XeroAccountOption {
  id: string;
  connectionId: string;
  xeroAccountId: string;
  xeroAccountName: string;
  xeroAccountCode: string;
  isLinked: boolean;
}

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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Xero link state
  const [xeroLinks, setXeroLinks] = useState<Record<string, XeroLinkInfo | null>>({});
  const [linkingAccount, setLinkingAccount] = useState<Account | null>(null);
  const [availableXeroAccounts, setAvailableXeroAccounts] = useState<XeroAccountOption[]>([]);
  const [selectedXeroMapping, setSelectedXeroMapping] = useState<string>('');
  const [linkLoading, setLinkLoading] = useState(false);

  // State to force re-render every minute for relative time display
  const [, setTick] = useState(0);

  // Fetch Xero link status on mount
  useEffect(() => {
    if (accounts.length > 0) {
      const accountIds = accounts.map(a => a.id);
      getXeroLinkStatusForAccounts(accountIds).then(result => {
        if (!result.error) {
          setXeroLinks(result.links);
        }
      });
    }
  }, [accounts]);

  // Update relative time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available Xero accounts when opening link dialog
  const openLinkDialog = async (account: Account) => {
    setLinkingAccount(account);
    setSelectedXeroMapping('');
    const result = await getAvailableXeroAccountsForLinking();
    if (!result.error) {
      // Filter to only show unlinked accounts
      setAvailableXeroAccounts(result.accounts.filter(a => !a.isLinked));
    }
  };

  const handleLink = async () => {
    if (!linkingAccount || !selectedXeroMapping) return;

    setLinkLoading(true);
    const result = await linkLocalAccountToXero(linkingAccount.id, selectedXeroMapping);

    if (result.success) {
      toast.success('Account linked to Xero');
      // Refresh link status
      const accountIds = accounts.map(a => a.id);
      const linkResult = await getXeroLinkStatusForAccounts(accountIds);
      if (!linkResult.error) {
        setXeroLinks(linkResult.links);
      }
      setLinkingAccount(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to link account');
    }
    setLinkLoading(false);
  };

  const handleUnlink = async (account: Account) => {
    const result = await unlinkLocalAccountFromXero(account.id);
    if (result.success) {
      toast.success('Account unlinked from Xero');
      // Refresh link status
      const accountIds = accounts.map(a => a.id);
      const linkResult = await getXeroLinkStatusForAccounts(accountIds);
      if (!linkResult.error) {
        setXeroLinks(linkResult.links);
      }
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to unlink account');
    }
  };

  const handleSync = async (account: Account) => {
    setSyncingAccountId(account.id);
    try {
      const result = await syncAccountTransactions(account.id);
      if (result.success) {
        toast.success(
          `Synced ${result.transactionsImported} new transactions (${result.transactionsSkipped} already existed)`
        );
        // Refresh link status to update the "Synced" time
        const accountIds = accounts.map(a => a.id);
        const linkResult = await getXeroLinkStatusForAccounts(accountIds);
        if (!linkResult.error) {
          setXeroLinks(linkResult.links);
        }
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to sync transactions');
      }
    } catch (error) {
      toast.error('Failed to sync transactions');
      console.error(error);
    } finally {
      setSyncingAccountId(null);
    }
  };

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

  // Group accounts by account_group
  const groupedAccounts = ACCOUNT_GROUP_ORDER.reduce((acc, group) => {
    acc[group] = accounts.filter(a => (a.account_group || 'family') === group);
    return acc;
  }, {} as Record<AccountGroup, Account[]>);

  // Calculate group totals
  const getGroupTotal = (groupAccounts: Account[]) => {
    return groupAccounts.reduce((sum, account) => {
      const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
      const balance = account.calculated_balance ?? account.current_balance;
      return sum + (isDebt ? -Math.abs(balance) : balance);
    }, 0);
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

  const renderAccountRow = (account: Account) => {
    const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
    // Use calculated_balance (starting + transactions) if available, otherwise fall back to current_balance
    const balance = account.calculated_balance ?? account.current_balance;
    const displayBalance = isDebt ? -Math.abs(balance) : balance;
    const isSyncing = syncingAccountId === account.id;

    return (
      <TableRow key={account.id}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {account.name}
            {xeroLinks[account.id] ? (
              isSyncing ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  Xero
                </Badge>
              )
            ) : (
              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-500 border-gray-200 text-xs cursor-pointer hover:bg-gray-100"
                onClick={() => openLinkDialog(account)}
              >
                <Link2Off className="h-3 w-3 mr-1" />
                Link
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={accountTypeColors[account.account_type]}>
            {accountTypeLabels[account.account_type]}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {account.institution || '—'}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {xeroLinks[account.id] ? formatRelativeTime(xeroLinks[account.id]?.lastSyncAt ?? null) : '—'}
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
              {xeroLinks[account.id] ? (
                <>
                  <DropdownMenuItem
                    onClick={() => handleSync(account)}
                    disabled={syncingAccountId === account.id}
                  >
                    {syncingAccountId === account.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync from Xero
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUnlink(account)}>
                    <Link2Off className="mr-2 h-4 w-4" />
                    Unlink from Xero
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openLinkDialog(account)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Link to Xero
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
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
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Name</TableHead>
            <TableHead className="w-[12%]">Type</TableHead>
            <TableHead className="w-[20%]">Institution</TableHead>
            <TableHead className="w-[12%]">Synced</TableHead>
            <TableHead className="w-[15%] text-right">Balance</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ACCOUNT_GROUP_ORDER.map((group) => {
            const groupAccounts = groupedAccounts[group];
            if (groupAccounts.length === 0) return null;

            const groupTotal = getGroupTotal(groupAccounts);

            return (
              <Fragment key={group}>
                {/* Group Header Row */}
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4} className="py-3">
                    <span className="text-base font-semibold text-foreground">
                      {ACCOUNT_GROUP_LABELS[group]}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className={`text-sm font-semibold ${groupTotal < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {formatCurrency(groupTotal)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3"></TableCell>
                </TableRow>
                {/* Account Rows */}
                {groupAccounts.map(renderAccountRow)}
              </Fragment>
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

      {/* Link to Xero Dialog */}
      <Dialog open={!!linkingAccount} onOpenChange={(open) => !open && setLinkingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Xero Account</DialogTitle>
            <DialogDescription>
              Select a Xero account to link with &ldquo;{linkingAccount?.name}&rdquo;.
              This will allow syncing transactions from Xero.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedXeroMapping} onValueChange={setSelectedXeroMapping}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Xero account..." />
              </SelectTrigger>
              <SelectContent>
                {availableXeroAccounts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No unlinked Xero accounts available
                  </SelectItem>
                ) : (
                  availableXeroAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.xeroAccountName} {acc.xeroAccountCode && `(${acc.xeroAccountCode})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingAccount(null)}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={linkLoading || !selectedXeroMapping}>
              {linkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
