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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createRuleFromTransaction } from '@/lib/transactions/actions';
import type { Transaction, Category } from '@/lib/types';

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  categories: Category[];
}

export function CreateRuleDialog({
  open,
  onOpenChange,
  transaction,
  categories,
}: CreateRuleDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(transaction.category_id || '');
  const [matchField, setMatchField] = useState<'description' | 'payee'>('description');
  const [matchType, setMatchType] = useState<'contains' | 'exact'>('contains');

  const handleCreate = async () => {
    if (!categoryId) return;

    setLoading(true);
    const result = await createRuleFromTransaction(
      transaction.id,
      categoryId,
      matchField,
      matchType
    );

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    }

    setLoading(false);
  };

  const filteredCategories = categories.filter(
    (c) => c.category_type === transaction.transaction_type
  );

  const matchValue = matchField === 'description' ? transaction.description : transaction.payee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create Categorisation Rule</DialogTitle>
          <DialogDescription>
            Create a rule to automatically categorise similar transactions in the future.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Match Field</Label>
            <Select value={matchField} onValueChange={(v) => setMatchField(v as typeof matchField)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="payee" disabled={!transaction.payee}>
                  Payee {!transaction.payee && '(not available)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Match Type</Label>
            <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="exact">Exact match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              When <span className="font-medium text-foreground">{matchField}</span>{' '}
              {matchType === 'contains' ? 'contains' : 'exactly matches'}:
            </p>
            <p className="mt-1 font-mono text-sm">&quot;{matchValue || 'N/A'}&quot;</p>
          </div>

          <div className="grid gap-2">
            <Label>Assign Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !categoryId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
