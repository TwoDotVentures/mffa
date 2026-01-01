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
import { MoreHorizontal, Pencil, Trash2, Loader2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Wand2 } from 'lucide-react';
import { TransactionDialog } from './transaction-dialog';
import { CreateRuleDialog } from './create-rule-dialog';
import { deleteTransaction } from '@/lib/transactions/actions';
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

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    const result = await deleteTransaction(deletingTransaction.id);

    if (result.success) {
      setDeletingTransaction(null);
      router.refresh();
    }

    setDeleteLoading(false);
  };

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const TypeIcon = typeIcons[transaction.transaction_type];
            const isExpense = transaction.transaction_type === 'expense';

            return (
              <TableRow key={transaction.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TypeIcon
                      className={`h-4 w-4 ${typeColors[transaction.transaction_type]}`}
                    />
                    <span className="font-medium">{transaction.description}</span>
                  </div>
                  {transaction.payee && (
                    <p className="text-xs text-muted-foreground">{transaction.payee}</p>
                  )}
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
    </>
  );
}
