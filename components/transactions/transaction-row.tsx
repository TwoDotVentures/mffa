'use client';

import { memo, useCallback, useRef } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wand2,
} from 'lucide-react';
import type { Transaction } from '@/lib/types';

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

export interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onCreateRule: (transaction: Transaction) => void;
  /** Callback to open the shared category popover */
  onOpenCategoryPopover: (transaction: Transaction, anchorElement: HTMLElement) => void;
  /** Whether a category update is in progress for this transaction */
  isLoadingCategory?: boolean;
  /** Style prop for virtualized rows */
  style?: React.CSSProperties;
}

function TransactionRowComponent({
  transaction,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onCreateRule,
  onOpenCategoryPopover,
  isLoadingCategory = false,
  style,
}: TransactionRowProps) {
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const TypeIcon = typeIcons[transaction.transaction_type];
  const isExpense = transaction.transaction_type === 'expense';

  const handleToggleSelect = useCallback(() => {
    onToggleSelect(transaction.id);
  }, [onToggleSelect, transaction.id]);

  const handleEdit = useCallback(() => {
    onEdit(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete(transaction);
  }, [onDelete, transaction]);

  const handleCreateRule = useCallback(() => {
    onCreateRule(transaction);
  }, [onCreateRule, transaction]);

  const handleCategoryClick = useCallback(() => {
    if (categoryButtonRef.current && !isLoadingCategory) {
      onOpenCategoryPopover(transaction, categoryButtonRef.current);
    }
  }, [transaction, onOpenCategoryPopover, isLoadingCategory]);

  return (
    <TableRow className={isSelected ? 'bg-muted/50' : undefined} style={style}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggleSelect}
          aria-label={`Select transaction ${transaction.description}`}
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(transaction.date)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TypeIcon className={`h-4 w-4 ${typeColors[transaction.transaction_type]}`} />
          <div>
            <span className="font-medium">{transaction.description}</span>
            {transaction.payee && (
              <p className="text-muted-foreground text-sm">{transaction.payee}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {transaction.account?.name || '\u2014'}
      </TableCell>
      <TableCell>
        {isLoadingCategory ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : (
          <button
            ref={categoryButtonRef}
            className="hover:bg-muted/50 -mx-1 rounded px-1 py-0.5 text-left transition-colors"
            onClick={handleCategoryClick}
          >
            {transaction.category ? (
              <Badge variant="secondary" className="cursor-pointer">
                {transaction.category.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm italic">+ Add category</span>
            )}
          </button>
        )}
      </TableCell>
      <TableCell
        className={`text-right font-medium ${
          isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}
      >
        {isExpense ? '-' : '+'}
        {formatCurrency(Math.abs(transaction.amount))}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateRule}>
              <Wand2 className="mr-2 h-4 w-4" />
              Create Rule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Memoize to prevent re-renders when other rows change
export const TransactionRow = memo(TransactionRowComponent);
