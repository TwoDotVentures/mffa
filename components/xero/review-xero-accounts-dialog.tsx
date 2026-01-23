'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download, RefreshCw, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { XeroAccountComparisonResult } from '@/lib/xero/types';
import { Account } from '@/lib/types';
import {
  reviewXeroAccounts,
  importAllUnmatchedXeroAccounts,
} from '@/lib/xero/actions';
import { getAccounts } from '@/lib/accounts/actions';
import { XeroAccountReviewRow } from './xero-account-review-row';
import { toast } from 'sonner';

interface ReviewXeroAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  tenantName: string;
}

export function ReviewXeroAccountsDialog({
  open,
  onOpenChange,
  connectionId,
  tenantName,
}: ReviewXeroAccountsDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [comparisons, setComparisons] = useState<XeroAccountComparisonResult[]>([]);
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, connectionId]);

  const handleImportAll = async () => {
    const unmatchedCount = comparisons.filter(c => c.matchStatus === 'no_match').length;
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

  // Count stats
  const matchedCount = comparisons.filter(c => c.matchStatus === 'matched').length;
  const suggestedCount = comparisons.filter(c => c.matchStatus === 'suggested').length;
  const unmatchedCount = comparisons.filter(c => c.matchStatus === 'no_match').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Xero Bank Accounts</DialogTitle>
          <DialogDescription>
            Compare your Xero accounts from {tenantName} with local accounts
          </DialogDescription>
        </DialogHeader>

        {/* Stats Summary */}
        {!isLoading && !error && comparisons.length > 0 && (
          <div className="flex gap-4 py-2 border-y">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{matchedCount} linked</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>{suggestedCount} suggested</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span>{unmatchedCount} new</span>
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Fetching accounts from Xero...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : comparisons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-muted-foreground">
                No bank accounts found in Xero
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
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
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {unmatchedCount > 0 && (
            <Button onClick={handleImportAll} disabled={isImportingAll}>
              {isImportingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import All Unmatched ({unmatchedCount})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
