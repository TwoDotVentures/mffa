'use client';

/**
 * @fileoverview Xero Account Review Row Component
 *
 * Individual row for reviewing and linking a single Xero account.
 * Supports linked, suggested, and unmatched states with appropriate actions.
 *
 * @module components/xero/xero-account-review-row
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Link2,
  Loader2,
  CreditCard,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { XeroAccountComparisonResult } from '@/lib/xero/types';
import { Account } from '@/lib/types';
import {
  importXeroAccountAsLocal,
  linkXeroToLocalAccount,
} from '@/lib/xero/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Props for XeroAccountReviewRow component
 * @interface XeroAccountReviewRowProps
 */
interface XeroAccountReviewRowProps {
  /** The comparison result for this account */
  comparison: XeroAccountComparisonResult;
  /** The Xero connection ID */
  connectionId: string;
  /** All available local accounts for linking */
  allLocalAccounts: Account[];
  /** Callback to refresh the list after changes */
  onUpdate: () => void;
}

/**
 * XeroAccountReviewRow Component
 *
 * @description Displays a single Xero account with options to link or import.
 *
 * States:
 * - Matched: Shows linked local account
 * - Suggested: Shows suggested match with confirm/import options
 * - Unmatched: Shows import button and account selector
 *
 * Features:
 * - Mobile-friendly layout with stacked content
 * - Loading states for all actions
 * - Account type icons (bank/credit card)
 * - Confidence percentage for suggested matches
 *
 * @param {XeroAccountReviewRowProps} props - Component props
 * @returns {JSX.Element} Account review row
 */
export function XeroAccountReviewRow({
  comparison,
  connectionId,
  allLocalAccounts,
  onUpdate,
}: XeroAccountReviewRowProps) {
  /** Loading states for import and link actions */
  const [isImporting, setIsImporting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  /** Selected account ID for manual linking */
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
    comparison.localAccount?.id
  );

  const { xeroAccount, matchStatus, localAccount, confidence, matchReason } = comparison;

  /**
   * Import Xero account as a new local account
   * @description Creates a new local account from Xero data
   */
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importXeroAccountAsLocal(connectionId, xeroAccount.AccountID);
      if (result.success) {
        toast.success(`Imported "${xeroAccount.Name}" as a new account`);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to import account');
      }
    } catch (error) {
      toast.error('Failed to import account');
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Link Xero account to an existing local account
   * @description Creates association between Xero and local account
   * @param {string} [accountId] - Optional account ID override
   */
  const handleLink = async (accountId?: string) => {
    const targetAccountId = accountId || selectedAccountId;
    if (!targetAccountId) {
      toast.error('Please select an account to link');
      return;
    }

    setIsLinking(true);
    try {
      const result = await linkXeroToLocalAccount(
        connectionId,
        xeroAccount.AccountID,
        targetAccountId
      );
      if (result.success) {
        const linkedAccount = allLocalAccounts.find((a) => a.id === targetAccountId);
        toast.success(`Linked "${xeroAccount.Name}" to "${linkedAccount?.name}"`);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to link accounts');
      }
    } catch (error) {
      toast.error('Failed to link accounts');
      console.error(error);
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Get appropriate icon based on account type
   * @description Returns credit card or bank icon
   * @returns {JSX.Element} Account type icon
   */
  const getAccountTypeIcon = () => {
    const type = xeroAccount.BankAccountType || xeroAccount.Type;
    if (type === 'CREDITCARD') {
      return <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />;
    }
    return <Landmark className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />;
  };

  /**
   * Get status badge based on match status
   * @description Returns colored badge with icon
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = () => {
    switch (matchStatus) {
      case 'matched':
        return (
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-600 text-[10px] md:text-xs px-2 py-0.5 gap-1 shrink-0"
          >
            <CheckCircle2 className="h-3 w-3" />
            Linked
          </Badge>
        );
      case 'suggested':
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-[10px] md:text-xs px-2 py-0.5 gap-1 shrink-0"
          >
            <AlertTriangle className="h-3 w-3" />
            {confidence}% match
          </Badge>
        );
      case 'no_match':
        return (
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs px-2 py-0.5 gap-1 shrink-0 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
          >
            <Plus className="h-3 w-3" />
            New
          </Badge>
        );
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-3 md:p-4 space-y-3 transition-all duration-200',
        matchStatus === 'matched' && 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
        matchStatus === 'suggested' && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
        matchStatus === 'no_match' && 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
      )}
    >
      {/*
        Header Row
        @description Account name, type, and status badge
      */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Account Type Icon */}
          <div
            className={cn(
              'flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg',
              matchStatus === 'matched' && 'bg-green-100 dark:bg-green-900/30',
              matchStatus === 'suggested' && 'bg-amber-100 dark:bg-amber-900/30',
              matchStatus === 'no_match' && 'bg-blue-100 dark:bg-blue-900/30'
            )}
          >
            {getAccountTypeIcon()}
          </div>

          {/* Account Details */}
          <div className="min-w-0">
            <h4 className="font-medium text-sm md:text-base truncate">
              {xeroAccount.Name}
            </h4>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {xeroAccount.Code && `${xeroAccount.Code} \u00B7 `}
              {xeroAccount.BankAccountNumber || 'No account number'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {getStatusBadge()}
      </div>

      {/*
        Content based on match status
        @description Different actions for each state
      */}

      {/* Matched State - Show linked account */}
      {matchStatus === 'matched' && localAccount && (
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2 ml-11 md:ml-13">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
          <span className="truncate">
            Linked to:{' '}
            <span className="font-medium text-foreground">{localAccount.name}</span>
            {localAccount.account_number && (
              <span className="text-muted-foreground ml-1">
                ({localAccount.account_number})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Suggested State - Show suggestion and actions */}
      {matchStatus === 'suggested' && (
        <div className="space-y-3 ml-11 md:ml-13">
          {/* Suggested Match Info */}
          <div className="flex items-center gap-2 text-xs md:text-sm bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">
              Suggested:{' '}
              <span className="font-medium text-foreground">{localAccount?.name}</span>
              {matchReason && (
                <span className="text-muted-foreground ml-1">- {matchReason}</span>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleLink(localAccount?.id)}
              disabled={isLinking || !localAccount}
              className="h-9 md:h-10 text-xs md:text-sm flex-1 min-w-[100px] transition-all duration-200 hover:shadow-md"
            >
              {isLinking ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Link
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImport}
              disabled={isImporting}
              className="h-9 md:h-10 text-xs md:text-sm flex-1 min-w-[100px] transition-all duration-200"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Import as New
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Unmatched State - Show import and link options */}
      {matchStatus === 'no_match' && (
        <div className="space-y-3 ml-11 md:ml-13">
          {/* Info Text */}
          <p className="text-xs md:text-sm text-muted-foreground">
            No matching local account found
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Import Button */}
            <Button
              size="sm"
              onClick={handleImport}
              disabled={isImporting}
              className="h-9 md:h-10 text-xs md:text-sm transition-all duration-200 hover:shadow-md"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Import Account
                </>
              )}
            </Button>

            {/* Divider */}
            <span className="text-xs text-muted-foreground hidden sm:block px-1">or</span>

            {/* Link Selector */}
            <div className="flex gap-2 flex-1">
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm flex-1 min-w-[140px]">
                  <SelectValue placeholder="Link to existing..." />
                </SelectTrigger>
                <SelectContent>
                  {allLocalAccounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      className="text-xs md:text-sm"
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Link Button */}
              {selectedAccountId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLink()}
                  disabled={isLinking}
                  className="h-9 md:h-10 px-3 shrink-0"
                >
                  {isLinking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
