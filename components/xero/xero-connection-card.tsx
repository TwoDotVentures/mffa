'use client';

/**
 * @fileoverview Xero Connection Card Component
 *
 * Displays a connected Xero organization with status, sync controls,
 * and management options. Optimized for mobile with clear visual hierarchy.
 *
 * @module components/xero/xero-connection-card
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Zap,
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
import { cn } from '@/lib/utils';

/**
 * Props for XeroConnectionCard component
 * @interface XeroConnectionCardProps
 */
interface XeroConnectionCardProps {
  /** The Xero connection data */
  connection: XeroConnectionDB;
  /** Callback when connection is disconnected */
  onDisconnect?: () => void;
}

/**
 * XeroConnectionCard Component
 *
 * @description Displays a connected Xero organization with:
 * - Connection status (active/expired/error)
 * - Last sync timestamp
 * - Sync, Review, and Disconnect actions
 *
 * Features:
 * - Mobile-first responsive layout
 * - Clear status indicators
 * - Loading states for all actions
 * - Confirmation dialog for disconnect
 *
 * @param {XeroConnectionCardProps} props - Component props
 * @returns {JSX.Element} Xero connection card
 */
export function XeroConnectionCard({
  connection,
  onDisconnect,
}: XeroConnectionCardProps) {
  /** Track loading states for various actions */
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  /**
   * Handle reconnection for expired/error connections
   * @description Initiates new OAuth flow
   */
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

  /**
   * Handle manual sync of transactions
   * @description Triggers immediate sync from Xero
   */
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

  /**
   * Handle disconnection from Xero
   * @description Removes the connection (keeps imported data)
   */
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

  /**
   * Get status badge based on connection status
   * @description Returns appropriate badge with icon and color
   * @returns {JSX.Element} Status badge component
   */
  const getStatusBadge = () => {
    switch (connection.status) {
      case 'active':
        return (
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-600 text-[10px] md:text-xs px-2 py-0.5 gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge
            variant="destructive"
            className="text-[10px] md:text-xs px-2 py-0.5 gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case 'error':
        return (
          <Badge
            variant="destructive"
            className="text-[10px] md:text-xs px-2 py-0.5 gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] md:text-xs px-2 py-0.5">
            {connection.status}
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
      {/*
        Card Header
        @description Organization info and status badge
      */}
      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Organization Icon */}
            <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>

            {/* Organization Details */}
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-semibold truncate">
                {connection.tenant_name || 'Xero Organization'}
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {connection.tenant_type === 'ORGANISATION'
                  ? 'Business Account'
                  : 'Practice Account'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="pt-3 pb-4 space-y-3 md:space-y-4">
        {/*
          Last Sync Info
          @description Shows when data was last synced
        */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
          {connection.last_sync_at ? (
            <span className="truncate">
              Last synced{' '}
              <span className="font-medium text-foreground">
                {formatDistanceToNow(new Date(connection.last_sync_at), {
                  addSuffix: true,
                })}
              </span>
            </span>
          ) : (
            <span>Never synced</span>
          )}
        </div>

        {/*
          Status Message (if any error)
          @description Shows error details when applicable
        */}
        {connection.status_message && (
          <div className="flex items-start gap-2 text-xs md:text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{connection.status_message}</p>
          </div>
        )}

        {/*
          Action Buttons
          @description Sync, Review, Disconnect controls
        */}
        <div className="flex flex-wrap gap-2">
          {connection.status === 'active' ? (
            <>
              {/* Sync Button */}
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 min-w-[120px] h-10 md:h-11 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-xs md:text-sm">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="text-xs md:text-sm">Sync Now</span>
                  </>
                )}
              </Button>

              {/* Review Button */}
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(true)}
                className="h-10 md:h-11 px-3 md:px-4 transition-all duration-200 hover:bg-primary/5"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                <span className="text-xs md:text-sm">Review</span>
              </Button>
            </>
          ) : (
            /* Reconnect Button for expired/error status */
            <Button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="flex-1 h-10 md:h-11 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              {isReconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-xs md:text-sm">Reconnecting...</span>
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  <span className="text-xs md:text-sm">Reconnect</span>
                </>
              )}
            </Button>
          )}

          {/* Disconnect Button with Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={isDisconnecting}
                className="h-10 w-10 md:h-11 md:w-11 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all duration-200"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base md:text-lg">
                  Disconnect from Xero?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs md:text-sm">
                  This will remove the connection to{' '}
                  <span className="font-medium text-foreground">
                    {connection.tenant_name}
                  </span>
                  . Your previously imported transactions will remain, but you
                  won&apos;t be able to sync new ones until you reconnect.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="h-10 md:h-11 text-xs md:text-sm">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  className="h-10 md:h-11 text-xs md:text-sm bg-destructive hover:bg-destructive/90"
                >
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
