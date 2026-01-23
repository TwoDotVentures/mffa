'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unlink,
  Clock,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { ReviewXeroAccountsDialog } from './review-xero-accounts-dialog';
import {
  syncXeroTransactions,
  disconnectXero,
  initiateXeroAuth,
} from '@/lib/xero/actions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { XeroConnectionDB } from '@/lib/xero/types';
import { DEFAULT_USER_ID } from '@/lib/constants';

interface XeroConnectionCardProps {
  connection: XeroConnectionDB;
  onDisconnect?: () => void;
}

export function XeroConnectionCard({
  connection,
  onDisconnect,
}: XeroConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const result = await initiateXeroAuth(DEFAULT_USER_ID);
      if (result.error) {
        toast.error(result.error);
        setIsReconnecting(false);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to reconnect to Xero');
      console.error(error);
      setIsReconnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncXeroTransactions(connection.id, 'manual');
      if (result.success) {
        toast.success(
          `Synced ${result.transactionsImported} transactions from ${result.accountsSynced} accounts`
        );
      } else {
        toast.error(result.errors.join(', ') || 'Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync transactions');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectXero(connection.id);
      if (result.success) {
        toast.success('Disconnected from Xero');
        onDisconnect?.();
      } else {
        toast.error(result.error || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
      console.error(error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connection.status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {connection.status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">
                {connection.tenant_name || 'Xero Organization'}
              </CardTitle>
              <CardDescription className="text-xs">
                {connection.tenant_type === 'ORGANISATION'
                  ? 'Business Account'
                  : 'Practice Account'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last sync info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {connection.last_sync_at ? (
            <span>
              Last synced{' '}
              {formatDistanceToNow(new Date(connection.last_sync_at), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span>Never synced</span>
          )}
        </div>

        {/* Status message if any */}
        {connection.status_message && (
          <p className="text-sm text-destructive">{connection.status_message}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {connection.status === 'active' ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(true)}
              >
                <FileSearch className="mr-2 h-4 w-4" />
                Review
              </Button>
            </>
          ) : (
            <Button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="flex-1"
            >
              {isReconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                'Reconnect'
              )}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" disabled={isDisconnecting}>
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect from Xero?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the connection to {connection.tenant_name}. Your
                  previously imported transactions will remain, but you won&apos;t be
                  able to sync new ones until you reconnect.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Review Accounts Dialog */}
        <ReviewXeroAccountsDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          connectionId={connection.id}
          tenantName={connection.tenant_name || 'Xero'}
        />
      </CardContent>
    </Card>
  );
}
