/**
 * CreateRuleDialog Component
 *
 * Dialog for creating a categorisation rule from an existing transaction.
 * Allows users to quickly set up rules based on transaction patterns.
 * Fully optimized for mobile with large touch targets.
 *
 * @mobile Full-screen dialog with large inputs
 * @desktop Standard modal dialog
 * @touch Minimum 44px touch targets for all controls
 */
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
  DialogBody,
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

/** Props for CreateRuleDialog component */
interface CreateRuleDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Transaction to create rule from */
  transaction: Transaction;
  /** Available categories for rule assignment */
  categories: Category[];
}

/**
 * Dialog for creating a categorisation rule from a transaction
 */
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

  /**
   * Handles rule creation and closes dialog
   */
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

  // Filter categories to match transaction type
  const filteredCategories = categories.filter(
    (c) => c.category_type === transaction.transaction_type
  );

  // Get the value that will be matched
  const matchValue = matchField === 'description' ? transaction.description : transaction.payee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-hidden flex flex-col p-0 sm:p-6 gap-0 sm:gap-4">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-0 sm:pt-0 border-b sm:border-0 flex-shrink-0">
          <DialogTitle className="text-lg">Create Categorisation Rule</DialogTitle>
          <DialogDescription className="text-sm">
            Create a rule to automatically categorise similar transactions in the future.
          </DialogDescription>
        </DialogHeader>

        {/* Form Content */}
        <DialogBody className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 space-y-4">
          {/* Match Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Match Field</Label>
            <Select value={matchField} onValueChange={(v) => setMatchField(v as typeof matchField)}>
              <SelectTrigger className="h-11 sm:h-10">
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

          {/* Match Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Match Type</Label>
            <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
              <SelectTrigger className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="exact">Exact match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Box */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              When <span className="font-medium text-foreground">{matchField}</span>{' '}
              {matchType === 'contains' ? 'contains' : 'exactly matches'}:
            </p>
            <p className="mt-2 font-mono text-sm bg-background rounded px-2 py-1.5 border overflow-x-auto">
              &quot;{matchValue || 'N/A'}&quot;
            </p>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-11 sm:h-10">
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
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="px-4 py-4 sm:px-0 sm:pt-0 border-t sm:border-0 bg-background flex-shrink-0 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 sm:h-10 flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !categoryId}
            className="h-11 sm:h-10 flex-1 sm:flex-initial"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
