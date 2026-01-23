'use client';

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
} from 'lucide-react';
import { XeroAccountComparisonResult } from '@/lib/xero/types';
import { Account } from '@/lib/types';
import {
  importXeroAccountAsLocal,
  linkXeroToLocalAccount,
} from '@/lib/xero/actions';
import { toast } from 'sonner';

interface XeroAccountReviewRowProps {
  comparison: XeroAccountComparisonResult;
  connectionId: string;
  allLocalAccounts: Account[];
  onUpdate: () => void;
}

export function XeroAccountReviewRow({
  comparison,
  connectionId,
  allLocalAccounts,
  onUpdate,
}: XeroAccountReviewRowProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
    comparison.localAccount?.id
  );

  const { xeroAccount, matchStatus, localAccount, confidence, matchReason } = comparison;

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
        const linkedAccount = allLocalAccounts.find(a => a.id === targetAccountId);
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

  const getAccountTypeIcon = () => {
    const type = xeroAccount.BankAccountType || xeroAccount.Type;
    if (type === 'CREDITCARD') {
      return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
    return <Landmark className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = () => {
    switch (matchStatus) {
      case 'matched':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Linked
          </Badge>
        );
      case 'suggested':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Suggested ({confidence}%)
          </Badge>
        );
      case 'no_match':
        return (
          <Badge variant="outline">
            <Plus className="mr-1 h-3 w-3" />
            New
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {getAccountTypeIcon()}
          <div>
            <h4 className="font-medium">{xeroAccount.Name}</h4>
            <p className="text-xs text-muted-foreground">
              {xeroAccount.Code && `${xeroAccount.Code} · `}
              {xeroAccount.BankAccountNumber || 'No account number'}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Content based on match status */}
      {matchStatus === 'matched' && localAccount && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
          <Link2 className="h-4 w-4" />
          <span>
            Linked to: <span className="font-medium text-foreground">{localAccount.name}</span>
            {localAccount.account_number && (
              <span className="ml-1">({localAccount.account_number})</span>
            )}
          </span>
        </div>
      )}

      {matchStatus === 'suggested' && (
        <div className="space-y-3 pl-6">
          <div className="text-sm text-muted-foreground">
            <span>Suggested match: </span>
            <span className="font-medium text-foreground">{localAccount?.name}</span>
            {matchReason && <span className="ml-1">- {matchReason}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleLink(localAccount?.id)}
              disabled={isLinking || !localAccount}
            >
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-3 w-3" />
                  Link to Suggested
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3 w-3" />
                  Import as New
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {matchStatus === 'no_match' && (
        <div className="space-y-3 pl-6">
          <p className="text-sm text-muted-foreground">
            No matching local account found
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3 w-3" />
                  Import Account
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">or link to:</span>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {allLocalAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccountId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLink()}
                disabled={isLinking}
              >
                {isLinking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
