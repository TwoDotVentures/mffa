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

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
}: TransactionDialogProps) {
  const router = useRouter();
  const isEditing = !!transaction;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category picker state
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

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
  }, [transaction, accounts]);

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setNewCategoryLoading(true);
    const result = await createCategory(newCategoryName.trim(), transactionType);

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories(prev => [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(result.category.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setCategoryPickerOpen(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setNewCategoryLoading(false);
  };

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

  // Show all categories, grouped by type for better UX
  // First show categories matching the transaction type, then others
  const sortedCategories = [...localCategories].sort((a, b) => {
    const aMatches = a.category_type === transactionType ? 0 : 1;
    const bMatches = b.category_type === transactionType ? 0 : 1;
    if (aMatches !== bMatches) return aMatches - bMatches;
    return a.name.localeCompare(b.name);
  });

  // Filter categories for search
  const filteredCategories = sortedCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Get selected category name
  const selectedCategoryName = localCategories.find(c => c.id === categoryId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update transaction details.' : 'Add a new transaction.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={transactionType}
                  onValueChange={(v) => {
                    setTransactionType(v as TransactionType);
                    setCategoryId('');
                  }}
                >
                  <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="account">Account *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Woolworths groceries"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Popover open={categoryPickerOpen} onOpenChange={(open) => {
                  setCategoryPickerOpen(open);
                  if (!open) {
                    setCategorySearch('');
                    setShowNewCategoryInput(false);
                    setNewCategoryName('');
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between font-normal"
                    >
                      {selectedCategoryName || 'Uncategorised'}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-2" align="start">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8 mb-2"
                      autoFocus
                    />
                    <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                      {!categorySearch && (
                        <button
                          type="button"
                          className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${!categoryId ? 'bg-muted' : ''}`}
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
                          className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${categoryId === category.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setCategoryId(category.id);
                            setCategoryPickerOpen(false);
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                      {filteredCategories.length === 0 && categorySearch && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No categories found
                        </p>
                      )}
                    </div>
                    <div className="border-t mt-2 pt-2">
                      {showNewCategoryInput ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="New category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-8"
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
                              className="flex-1 h-7"
                              onClick={handleCreateCategory}
                              disabled={newCategoryLoading || !newCategoryName.trim()}
                            >
                              {newCategoryLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7"
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
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors flex items-center gap-1 text-primary"
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

            <div className="grid gap-2">
              <Label htmlFor="payee">Payee</Label>
              <Input
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g., Woolworths"
              />
            </div>

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
            <Button type="submit" disabled={loading || !accountId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
