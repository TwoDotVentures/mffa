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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Pencil, Trash2, Loader2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Wand2, Search, X } from 'lucide-react';
import { TransactionDialog } from './transaction-dialog';
import { CreateRuleDialog } from './create-rule-dialog';
import { deleteTransaction, deleteTransactions } from '@/lib/transactions/actions';
import { toast } from 'sonner';
import type { Transaction, Account, Category } from '@/lib/types';

interface TransactionsListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowRightLeft,
};

const typeColors = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
};

export function TransactionsList({ transactions, accounts, categories }: TransactionsListProps) {
  const router = useRouter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [ruleTransaction, setRuleTransaction] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter state
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    // Account filter
    if (accountFilter !== 'all' && t.account_id !== accountFilter) {
      return false;
    }
    // Search filter (searches description, payee, category, account name)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesDescription = t.description?.toLowerCase().includes(search);
      const matchesPayee = t.payee?.toLowerCase().includes(search);
      const matchesCategory = t.category?.name?.toLowerCase().includes(search);
      const matchesAccount = t.account?.name?.toLowerCase().includes(search);
      const matchesAmount = t.amount.toString().includes(search);
      if (!matchesDescription && !matchesPayee && !matchesCategory && !matchesAccount && !matchesAmount) {
        return false;
      }
    }
    return true;
  });

  const allSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredTransactions.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    const result = await deleteTransaction(deletingTransaction.id);

    if (result.success) {
      setDeletingTransaction(null);
      // Also remove from selection if selected
      const newSelected = new Set(selectedIds);
      newSelected.delete(deletingTransaction.id);
      setSelectedIds(newSelected);
      router.refresh();
    }

    setDeleteLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setBulkDeleteLoading(true);
    const result = await deleteTransactions(Array.from(selectedIds));

    if (result.success) {
      toast.success(`Deleted ${result.deleted} transactions`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete transactions');
    }

    setBulkDeleteLoading(false);
  };

  // Clear selection when filters change
  const clearFilters = () => {
    setAccountFilter('all');
    setSearchTerm('');
    setSelectedIds(new Set());
  };

  const hasActiveFilters = accountFilter !== 'all' || searchTerm !== '';

  if (transactions.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="mb-2">No transactions yet.</p>
          <p className="text-sm">Import a bank statement or add transactions manually.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Results Info */}
      {hasActiveFilters && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}

      {/* No Results Message */}
      {hasActiveFilters && filteredTransactions.length === 0 && (
        <div className="flex h-[200px] items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="mb-2">No transactions match your filters.</p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => {
            const TypeIcon = typeIcons[transaction.transaction_type];
            const isExpense = transaction.transaction_type === 'expense';
            const isSelected = selectedIds.has(transaction.id);

            return (
              <TableRow key={transaction.id} className={isSelected ? 'bg-muted/50' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(transaction.id)}
                    aria-label={`Select transaction ${transaction.description}`}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TypeIcon
                      className={`h-4 w-4 ${typeColors[transaction.transaction_type]}`}
                    />
                    <div>
                      <span className="font-medium">{transaction.description}</span>
                      {transaction.payee && (
                        <p className="text-sm text-muted-foreground">{transaction.payee}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.account?.name || '—'}
                </TableCell>
                <TableCell>
                  {transaction.category ? (
                    <Badge variant="secondary">{transaction.category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRuleTransaction(transaction)}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Create Rule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingTransaction(transaction)}
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
      )}

      {/* Edit Dialog */}
      <TransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      {ruleTransaction && (
        <CreateRuleDialog
          open={!!ruleTransaction}
          onOpenChange={(open) => !open && setRuleTransaction(null)}
          transaction={ruleTransaction}
          categories={categories}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
