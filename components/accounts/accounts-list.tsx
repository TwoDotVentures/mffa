/**
 * Accounts List Component
 *
 * Displays a list of financial accounts with responsive design:
 * - Desktop: Full table view with all columns
 * - Mobile: Card-based layout for better touch interaction
 *
 * Features:
 * - Group accounts by type (Family, Trust, SMSF)
 * - Xero integration with sync status
 * - Touch-friendly action menus (min 44px targets)
 * - Swipe-friendly card design on mobile
 *
 * @module components/accounts/accounts-list
 */

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
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Link2,
  Link2Off,
  Building2,
} from 'lucide-react';
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

/** Xero account link information */
interface XeroLinkInfo {
  xeroAccountName: string;
  connectionId: string;
  mappingId: string;
  lastSyncAt: string | null;
}

/** Available Xero account for linking */
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

/** Human-readable account type labels */
const accountTypeLabels: Record<string, string> = {
  bank: 'Bank',
  credit: 'Credit',
  investment: 'Investment',
  loan: 'Loan',
  cash: 'Cash',
};

/**
 * Account type badge colors with proper dark mode support
 * Using semantic color names for consistency
 */
const accountTypeColors: Record<string, string> = {
  bank: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  credit:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  investment:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  loan: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  cash: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

/**
 * Formats a number as Australian currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Formats a date string as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';

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
  if (diffDays === 1) return 'Yesterday';
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
      const accountIds = accounts.map((a) => a.id);
      getXeroLinkStatusForAccounts(accountIds).then((result) => {
        if (!result.error) {
          setXeroLinks(result.links);
        }
      });
    }
  }, [accounts]);

  // Update relative time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Opens the Xero link dialog and fetches available accounts
   */
  const openLinkDialog = async (account: Account) => {
    setLinkingAccount(account);
    setSelectedXeroMapping('');
    const result = await getAvailableXeroAccountsForLinking();
    if (!result.error) {
      setAvailableXeroAccounts(result.accounts.filter((a) => !a.isLinked));
    }
  };

  /**
   * Links a local account to a Xero account
   */
  const handleLink = async () => {
    if (!linkingAccount || !selectedXeroMapping) return;

    setLinkLoading(true);
    const result = await linkLocalAccountToXero(linkingAccount.id, selectedXeroMapping);

    if (result.success) {
      toast.success('Account linked to Xero');
      const accountIds = accounts.map((a) => a.id);
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

  /**
   * Unlinks a local account from Xero
   */
  const handleUnlink = async (account: Account) => {
    const result = await unlinkLocalAccountFromXero(account.id);
    if (result.success) {
      toast.success('Account unlinked from Xero');
      const accountIds = accounts.map((a) => a.id);
      const linkResult = await getXeroLinkStatusForAccounts(accountIds);
      if (!linkResult.error) {
        setXeroLinks(linkResult.links);
      }
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to unlink account');
    }
  };

  /**
   * Syncs transactions from Xero for an account
   */
  const handleSync = async (account: Account) => {
    setSyncingAccountId(account.id);
    try {
      const result = await syncAccountTransactions(account.id);
      if (result.success) {
        toast.success(
          `Synced ${result.transactionsImported} new transactions (${result.transactionsSkipped} already existed)`
        );
        const accountIds = accounts.map((a) => a.id);
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

  /**
   * Deletes an account after confirmation
   */
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
  const groupedAccounts = ACCOUNT_GROUP_ORDER.reduce(
    (acc, group) => {
      acc[group] = accounts.filter((a) => (a.account_group || 'family') === group);
      return acc;
    },
    {} as Record<AccountGroup, Account[]>
  );

  /**
   * Calculates the total balance for a group of accounts
   * Debt accounts (credit, loan) are subtracted
   */
  const getGroupTotal = (groupAccounts: Account[]) => {
    return groupAccounts.reduce((sum, account) => {
      const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
      const balance = account.calculated_balance ?? account.current_balance;
      return sum + (isDebt ? -Math.abs(balance) : balance);
    }, 0);
  };

  // Empty state with helpful guidance - using EmptyState component
  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No accounts yet"
        description="Add your first account to start tracking your finances. You can add bank accounts, credit cards, loans, and more."
        height="lg"
      />
    );
  }

  /**
   * Renders a single account as a mobile-friendly card
   * Touch targets are minimum 44px for accessibility
   */
  const renderMobileAccountCard = (account: Account) => {
    const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
    const balance = account.calculated_balance ?? account.current_balance;
    const displayBalance = isDebt ? -Math.abs(balance) : balance;
    const isSyncing = syncingAccountId === account.id;
    const xeroLink = xeroLinks[account.id];

    return (
      <div
        key={account.id}
        className="hover:bg-muted/50 active:bg-muted flex items-center justify-between border-b p-4 transition-colors duration-150 last:border-b-0"
      >
        {/* Account info - left side */}
        <div className="min-w-0 flex-1 pr-3">
          {/* Account name with Xero badge */}
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-sm font-medium">{account.name}</span>
            {xeroLink ? (
              isSyncing ? (
                <Badge
                  variant="outline"
                  className="shrink-0 border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  <Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" />
                  Syncing
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  <Link2 className="mr-0.5 h-2.5 w-2.5" />
                  Xero
                </Badge>
              )
            ) : null}
          </div>

          {/* Institution and type row */}
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className={`px-1.5 py-0 text-[10px] font-normal ${accountTypeColors[account.account_type]}`}
            >
              {accountTypeLabels[account.account_type]}
            </Badge>
            {account.institution && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="truncate">{account.institution}</span>
              </>
            )}
          </div>

          {/* Sync status for linked accounts */}
          {xeroLink && (
            <div className="text-muted-foreground mt-1 text-[10px]">
              Synced {formatRelativeTime(xeroLink.lastSyncAt)}
            </div>
          )}
        </div>

        {/* Balance and actions - right side */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Balance */}
          <span
            className={`text-sm font-semibold tabular-nums ${
              displayBalance < 0 ? 'text-rose-600 dark:text-rose-400' : ''
            }`}
          >
            {formatCurrency(displayBalance)}
          </span>

          {/* Action menu with touch-friendly target */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 touch-manipulation">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {xeroLink ? (
                <>
                  <DropdownMenuItem
                    onClick={() => handleSync(account)}
                    disabled={isSyncing}
                    className="py-3"
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync from Xero
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUnlink(account)} className="py-3">
                    <Link2Off className="mr-2 h-4 w-4" />
                    Unlink from Xero
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openLinkDialog(account)} className="py-3">
                    <Link2 className="mr-2 h-4 w-4" />
                    Link to Xero
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setEditingAccount(account)} className="py-3">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeletingAccount(account)}
                className="text-destructive py-3"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  /**
   * Renders a single account as a desktop table row
   */
  const renderDesktopAccountRow = (account: Account) => {
    const isDebt = account.account_type === 'credit' || account.account_type === 'loan';
    const balance = account.calculated_balance ?? account.current_balance;
    const displayBalance = isDebt ? -Math.abs(balance) : balance;
    const isSyncing = syncingAccountId === account.id;
    const xeroLink = xeroLinks[account.id];

    return (
      <TableRow key={account.id} className="group">
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span className="truncate">{account.name}</span>
            {xeroLink ? (
              isSyncing ? (
                <Badge
                  variant="outline"
                  className="shrink-0 animate-pulse border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Syncing
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 border-emerald-200 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  <Link2 className="mr-1 h-3 w-3" />
                  Xero
                </Badge>
              )
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 cursor-pointer border-gray-200 bg-gray-50 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:bg-gray-800/50"
                onClick={() => openLinkDialog(account)}
              >
                <Link2Off className="mr-1 h-3 w-3" />
                Link
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`font-normal ${accountTypeColors[account.account_type]}`}
          >
            {accountTypeLabels[account.account_type]}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{account.institution || '—'}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {xeroLink ? formatRelativeTime(xeroLink.lastSyncAt) : '—'}
        </TableCell>
        <TableCell
          className={`text-right font-medium tabular-nums ${
            displayBalance < 0 ? 'text-rose-600 dark:text-rose-400' : ''
          }`}
        >
          {formatCurrency(displayBalance)}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {xeroLink ? (
                <>
                  <DropdownMenuItem onClick={() => handleSync(account)} disabled={isSyncing}>
                    {isSyncing ? (
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
      {/*
        Mobile View: Card-based layout
        - Full width cards for better readability
        - Touch-friendly action targets
        - Collapsible groups with totals
      */}
      <div className="sm:hidden">
        {ACCOUNT_GROUP_ORDER.map((group) => {
          const groupAccounts = groupedAccounts[group];
          if (groupAccounts.length === 0) return null;

          const groupTotal = getGroupTotal(groupAccounts);

          return (
            <div key={group} className="mb-4 last:mb-0">
              {/* Group header */}
              <div className="bg-muted/50 flex items-center justify-between border-y px-4 py-3">
                <span className="text-sm font-semibold">{ACCOUNT_GROUP_LABELS[group]}</span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    groupTotal < 0 ? 'text-rose-600 dark:text-rose-400' : ''
                  }`}
                >
                  {formatCurrency(groupTotal)}
                </span>
              </div>
              {/* Account cards */}
              <div className="bg-card">{groupAccounts.map(renderMobileAccountCard)}</div>
            </div>
          );
        })}
      </div>

      {/*
        Desktop View: Table layout
        - Full columns for detailed information
        - Hover states for rows
        - Grouped by account type with subtotals
      */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                      <span className="text-foreground text-sm font-semibold">
                        {ACCOUNT_GROUP_LABELS[group]}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          groupTotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                        }`}
                      >
                        {formatCurrency(groupTotal)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3"></TableCell>
                  </TableRow>
                  {/* Account Rows */}
                  {groupAccounts.map(renderDesktopAccountRow)}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <AccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        account={editingAccount}
      />

      {/* Delete Confirmation Dialog - using ConfirmDialog component */}
      <ConfirmDialog
        open={!!deletingAccount}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title="Delete Account"
        description={
          <>
            Are you sure you want to delete &ldquo;{deletingAccount?.name}&rdquo;? This action
            cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
        destructive
      />

      {/* Link to Xero Dialog - mobile optimized */}
      <Dialog open={!!linkingAccount} onOpenChange={(open) => !open && setLinkingAccount(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Xero Account</DialogTitle>
            <DialogDescription>
              Select a Xero account to link with &ldquo;{linkingAccount?.name}&rdquo;. This will
              allow syncing transactions from Xero.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedXeroMapping} onValueChange={setSelectedXeroMapping}>
              <SelectTrigger className="h-12 sm:h-10">
                <SelectValue placeholder="Select a Xero account..." />
              </SelectTrigger>
              <SelectContent>
                {availableXeroAccounts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No unlinked Xero accounts available
                  </SelectItem>
                ) : (
                  availableXeroAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="py-3">
                      {acc.xeroAccountName} {acc.xeroAccountCode && `(${acc.xeroAccountCode})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLinkingAccount(null)}
              className="h-11 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={linkLoading || !selectedXeroMapping}
              className="h-11 sm:h-10"
            >
              {linkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
