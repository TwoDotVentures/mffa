'use client';

/**
 * @fileoverview Review Xero Accounts Dialog Component
 *
 * Modal dialog for reviewing and linking Xero bank accounts with local accounts.
 * Features mobile-optimized layout with stats summary and batch import.
 *
 * @module components/xero/review-xero-accounts-dialog
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Landmark,
} from 'lucide-react';
import { XeroAccountComparisonResult } from '@/lib/xero/types';
import { Account } from '@/lib/types';
import {
  reviewXeroAccounts,
  importAllUnmatchedXeroAccounts,
} from '@/lib/xero/actions';
import { getAccounts } from '@/lib/accounts/actions';
import { XeroAccountReviewRow } from './xero-account-review-row';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Props for ReviewXeroAccountsDialog component
 * @interface ReviewXeroAccountsDialogProps
 */
interface ReviewXeroAccountsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change dialog open state */
  onOpenChange: (open: boolean) => void;
  /** The Xero connection ID to review */
  connectionId: string;
  /** Display name of the Xero tenant */
  tenantName: string;
}

/**
 * ReviewXeroAccountsDialog Component
 *
 * @description Modal for reviewing Xero accounts and linking them to local accounts.
 *
 * Features:
 * - Stats summary showing linked/suggested/new counts
 * - Mobile-optimized scrollable list
 * - Batch import for all unmatched accounts
 * - Loading and error states
 * - Refresh capability
 *
 * @param {ReviewXeroAccountsDialogProps} props - Component props
 * @returns {JSX.Element} Review accounts dialog
 */
export function ReviewXeroAccountsDialog({
  open,
  onOpenChange,
  connectionId,
  tenantName,
}: ReviewXeroAccountsDialogProps) {
  /** Loading state for data fetching */
  const [isLoading, setIsLoading] = useState(true);
  /** Loading state for batch import */
  const [isImportingAll, setIsImportingAll] = useState(false);
  /** Account comparison results from Xero */
  const [comparisons, setComparisons] = useState<XeroAccountComparisonResult[]>([]);
  /** Local accounts for linking */
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  /** Error message if loading failed */
  const [error, setError] = useState<string | null>(null);

  /**
   * Load account comparison data
   * @description Fetches Xero accounts and compares with local accounts
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [reviewResult, accounts] = await Promise.all([
        reviewXeroAccounts(connectionId),
        getAccounts(),
      ]);

      if (!reviewResult.success) {
        setError(reviewResult.error || 'Failed to review accounts');
        setComparisons([]);
      } else {
        setComparisons(reviewResult.comparisons);
      }

      setLocalAccounts(accounts);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  /** Load data when dialog opens */
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, connectionId]);

  /**
   * Import all unmatched accounts at once
   * @description Creates local accounts for all Xero accounts without matches
   */
  const handleImportAll = async () => {
    const unmatchedCount = comparisons.filter((c) => c.matchStatus === 'no_match').length;
    if (unmatchedCount === 0) {
      toast.info('No unmatched accounts to import');
      return;
    }

    setIsImportingAll(true);
    try {
      const result = await importAllUnmatchedXeroAccounts(connectionId);
      if (result.success) {
        toast.success(`Imported ${result.importedCount} accounts`);
        await loadData(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to import accounts');
      }
    } catch (error) {
      toast.error('Failed to import accounts');
      console.error(error);
    } finally {
      setIsImportingAll(false);
    }
  };

  /** Count stats for summary display */
  const matchedCount = comparisons.filter((c) => c.matchStatus === 'matched').length;
  const suggestedCount = comparisons.filter((c) => c.matchStatus === 'suggested').length;
  const unmatchedCount = comparisons.filter((c) => c.matchStatus === 'no_match').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden">
        {/*
          Dialog Header
          @description Title and description
        */}
        <DialogHeader className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30">
          <DialogTitle className="text-base md:text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Review Xero Bank Accounts
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Compare your Xero accounts from{' '}
            <span className="font-medium text-foreground">{tenantName}</span> with
            local accounts
          </DialogDescription>
        </DialogHeader>

        {/*
          Stats Summary
          @description Shows counts of linked, suggested, and new accounts
        */}
        {!isLoading && !error && comparisons.length > 0 && (
          <div className="flex flex-wrap gap-3 md:gap-4 px-4 py-3 md:px-6 md:py-4 bg-muted/30 border-b">
            {/* Linked Count */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-xs md:text-sm">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {matchedCount}
                </span>{' '}
                <span className="text-muted-foreground">linked</span>
              </div>
            </div>

            {/* Suggested Count */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xs md:text-sm">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {suggestedCount}
                </span>{' '}
                <span className="text-muted-foreground">suggested</span>
              </div>
            </div>

            {/* New Count */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs md:text-sm">
                <span className="font-semibold text-blue-700 dark:text-blue-400">
                  {unmatchedCount}
                </span>{' '}
                <span className="text-muted-foreground">new</span>
              </div>
            </div>
          </div>
        )}

        {/*
          Content Area
          @description Scrollable list of account comparisons
        */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3 md:px-6 md:py-4">
            {isLoading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Fetching accounts from Xero...
                </p>
              </div>
            ) : error ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive text-center">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : comparisons.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Landmark className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No bank accounts found in Xero
                </p>
              </div>
            ) : (
              /* Account List */
              <div className="space-y-3 md:space-y-4">
                {comparisons.map((comparison) => (
                  <XeroAccountReviewRow
                    key={comparison.xeroAccount.AccountID}
                    comparison={comparison}
                    connectionId={connectionId}
                    allLocalAccounts={localAccounts}
                    onUpdate={loadData}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/*
          Dialog Footer
          @description Close and import all buttons
        */}
        <DialogFooter className="px-4 py-3 md:px-6 md:py-4 border-t bg-muted/20 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 md:h-11 text-xs md:text-sm flex-1 sm:flex-none"
          >
            Close
          </Button>
          {unmatchedCount > 0 && (
            <Button
              onClick={handleImportAll}
              disabled={isImportingAll}
              className={cn(
                'h-10 md:h-11 text-xs md:text-sm flex-1 sm:flex-none',
                'transition-all duration-200 hover:shadow-md active:scale-[0.98]'
              )}
            >
              {isImportingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import All ({unmatchedCount})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
