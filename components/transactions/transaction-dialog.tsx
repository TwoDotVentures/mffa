/**
 * TransactionDialog Component
 *
 * Modal dialog for creating and editing transactions.
 * Fully optimized for mobile with full-screen presentation,
 * large input fields, and touch-friendly controls.
 *
 * @mobile Full-screen dialog with large touch targets
 * @desktop Standard modal dialog with compact layout
 * @a11y Proper form labeling and keyboard navigation
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plus, ChevronDown } from 'lucide-react';
import { createTransaction, updateTransaction, createCategory } from '@/lib/transactions/actions';
import { toast } from 'sonner';
import type { Transaction, TransactionType, Account, Category } from '@/lib/types';

/** Props for TransactionDialog component */
interface TransactionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Transaction to edit (null for new transaction) */
  transaction?: Transaction | null;
  /** Available accounts for selection */
  accounts: Account[];
  /** Available categories for selection */
  categories: Category[];
}

/**
 * Dialog for creating or editing transactions with mobile-optimized layout
 */
export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
}: TransactionDialogProps) {
  const router = useRouter();
  const isEditing = !!transaction;

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category picker state
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  // Transaction fields
  const [accountId, setAccountId] = useState(transaction?.account_id || '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction?.transaction_type || 'expense'
  );
  const [payee, setPayee] = useState(transaction?.payee || '');
  const [notes, setNotes] = useState(transaction?.notes || '');

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id || '');
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setTransactionType(transaction.transaction_type);
      setPayee(transaction.payee || '');
      setNotes(transaction.notes || '');
    } else {
      setAccountId(accounts[0]?.id || '');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setAmount('');
      setTransactionType('expense');
      setPayee('');
      setNotes('');
    }
    setError(null);
  }, [transaction, accounts]);

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  /**
   * Creates a new category and selects it
   */
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setNewCategoryLoading(true);
    const result = await createCategory(newCategoryName.trim(), transactionType);

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories((prev) =>
        [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCategoryId(result.category.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setCategoryPickerOpen(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setNewCategoryLoading(false);
  };

  /**
   * Handles form submission for creating/updating transaction
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      account_id: accountId,
      category_id: categoryId || undefined,
      date,
      description,
      amount: parseFloat(amount) || 0,
      transaction_type: transactionType,
      payee: payee || undefined,
      notes: notes || undefined,
    };

    const result = isEditing
      ? await updateTransaction(transaction.id, formData)
      : await createTransaction(formData);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error || 'An error occurred');
    }

    setLoading(false);
  };

  // Sort categories: matching type first, then alphabetically
  const sortedCategories = [...localCategories].sort((a, b) => {
    const aMatches = a.category_type === transactionType ? 0 : 1;
    const bMatches = b.category_type === transactionType ? 0 : 1;
    if (aMatches !== bMatches) return aMatches - bMatches;
    return a.name.localeCompare(b.name);
  });

  // Filter categories by search term
  const filteredCategories = sortedCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Get selected category name for display
  const selectedCategoryName = localCategories.find((c) => c.id === categoryId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? 'Update transaction details.' : 'Add a new transaction.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            {/* Date and Type Row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type *
                </Label>
                <Select
                  value={transactionType}
                  onValueChange={(v) => {
                    setTransactionType(v as TransactionType);
                    setCategoryId(''); // Reset category when type changes
                  }}
                >
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label htmlFor="account" className="text-sm font-medium">
                Account *
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Woolworths groceries"
                required
                className="h-11 sm:h-10"
              />
            </div>

            {/* Amount and Category Row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount *
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 pl-7 sm:h-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Popover
                  open={categoryPickerOpen}
                  onOpenChange={(open) => {
                    setCategoryPickerOpen(open);
                    if (!open) {
                      setCategorySearch('');
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-11 w-full justify-between font-normal sm:h-10"
                    >
                      <span className="truncate">{selectedCategoryName || 'Uncategorised'}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-2" align="start">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="mb-2 h-10"
                      autoFocus
                    />
                    <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
                      {!categorySearch && (
                        <button
                          type="button"
                          className={`hover:bg-muted w-full rounded px-2 py-2 text-left text-sm transition-colors ${!categoryId ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setCategoryId('');
                            setCategoryPickerOpen(false);
                          }}
                        >
                          Uncategorised
                        </button>
                      )}
                      {filteredCategories.map((category) => (
                        <button
                          type="button"
                          key={category.id}
                          className={`hover:bg-muted w-full rounded px-2 py-2 text-left text-sm transition-colors ${categoryId === category.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setCategoryId(category.id);
                            setCategoryPickerOpen(false);
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                      {filteredCategories.length === 0 && categorySearch && (
                        <p className="text-muted-foreground py-2 text-center text-sm">
                          No categories found
                        </p>
                      )}
                    </div>
                    <div className="mt-2 border-t pt-2">
                      {showNewCategoryInput ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="New category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-10"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCategory();
                              } else if (e.key === 'Escape') {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 flex-1"
                              onClick={handleCreateCategory}
                              disabled={newCategoryLoading || !newCategoryName.trim()}
                            >
                              {newCategoryLoading && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-9"
                              onClick={() => {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="hover:bg-muted text-primary flex w-full items-center gap-1 rounded px-2 py-2 text-left text-sm transition-colors"
                          onClick={() => setShowNewCategoryInput(true)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add new category
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Payee */}
            <div className="space-y-2">
              <Label htmlFor="payee" className="text-sm font-medium">
                Payee
              </Label>
              <Input
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g., Woolworths"
                className="h-11 sm:h-10"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="h-11 sm:h-10"
              />
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
            <Button type="submit" disabled={loading || !accountId} className="min-h-11 sm:min-h-10">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
