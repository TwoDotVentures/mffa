/**
 * @fileoverview Bank Connections Page
 *
 * Manage external bank connections including Xero integration and CSV imports.
 * Features clear connection status, prominent action buttons, and mobile-friendly layout.
 *
 * @module app/settings/bank-connections/page
 */

import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  Upload,
  FileSpreadsheet,
  Info,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XeroConnectionCard } from '@/components/xero/xero-connection-card';
import { ConnectXeroButton } from '@/components/xero/connect-xero-button';
import { getXeroConnections } from '@/lib/xero/actions';

/**
 * Page props interface
 * @interface PageProps
 */
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * BankConnectionsPage Component
 *
 * @description Main page for managing bank connections with options for:
 * - Xero integration (automatic sync)
 * - CSV import (manual upload)
 * - Manual transaction entry
 *
 * @param {PageProps} props - Page props including search params
 * @returns {Promise<JSX.Element>} The bank connections page
 */
export default async function BankConnectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params.error as string | undefined;
  const success = params.success as string | undefined;

  /** Fetch existing Xero connections */
  const { connections: xeroConnections } = await getXeroConnections();

  /**
   * Get user-friendly error message from error code
   * @param {string} errorCode - The error code from URL params
   * @returns {string} Human-readable error message
   */
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'oauth_denied':
        return 'Authorization was denied. Please try again.';
      case 'missing_params':
        return 'Missing required parameters from Xero.';
      case 'invalid_state':
        return 'Invalid session state. Please try connecting again.';
      case 'unauthorized':
        return 'You are not authorized to complete this action.';
      case 'no_organization':
        return 'No Xero organization found. Please ensure you have access to at least one organization.';
      case 'callback_failed':
        return 'Failed to complete the connection. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <>
      <PageHeader
        title="Bank Connections"
        description="Import your bank transactions"
      />

      <main className="flex-1 p-3 md:p-4 lg:p-6">
        <div className="mx-auto max-w-3xl lg:max-w-4xl space-y-4 md:space-y-6">
          {/*
            Status Alerts
            @description Show success/error messages from OAuth flow
          */}
          {error && (
            <Alert
              variant="destructive"
              className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                Connection Error
              </AlertTitle>
              <AlertDescription className="text-xs md:text-sm">
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}

          {success === 'connected' && (
            <Alert
              className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200 animate-in fade-in-0 slide-in-from-top-2 duration-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                Connected to Xero!
              </AlertTitle>
              <AlertDescription className="text-xs md:text-sm">
                Your Xero account has been connected successfully. You can now
                sync transactions.
              </AlertDescription>
            </Alert>
          )}

          {/*
            Info Banner
            @description Explain import options to users
          */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                Transaction Import Options
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs md:text-sm text-muted-foreground pb-4">
              <p>
                Import your bank transactions using one of the methods below.
                Connect to Xero for automatic daily syncing, or import CSV files
                manually.
              </p>
            </CardContent>
          </Card>

          {/*
            Xero Integration Section
            @description Main integration with Xero accounting software
          */}
          <Card className="overflow-hidden border-0 shadow-md md:border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                Xero Integration
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Connect to Xero to automatically sync your bank transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
              {/* Connected Organizations */}
              {xeroConnections.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {xeroConnections.map((connection) => (
                    <XeroConnectionCard
                      key={connection.id}
                      connection={connection}
                    />
                  ))}

                  {/* Add Another Organization */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Connect Another Organization
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Add another Xero organization to sync from
                        </p>
                      </div>
                    </div>
                    <ConnectXeroButton variant="outline" size="sm">
                      Add Organization
                    </ConnectXeroButton>
                  </div>
                </div>
              ) : (
                /* No Connections - Prompt to Connect */
                <div className="flex flex-col items-center text-center py-6 md:py-8">
                  <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-4 ring-4 ring-blue-50 dark:ring-blue-900/20">
                    <Building2 className="h-8 w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1">
                    Connect to Xero
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-5 max-w-sm">
                    Sync transactions automatically from your connected Xero
                    accounts
                  </p>
                  <ConnectXeroButton size="default">
                    <Zap className="mr-2 h-4 w-4" />
                    Connect to Xero
                  </ConnectXeroButton>
                </div>
              )}
            </CardContent>
          </Card>

          {/*
            CSV Import Section
            @description Manual upload option for bank statements
          */}
          <Card className="overflow-hidden border-0 shadow-md md:border">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <FileSpreadsheet className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                CSV Import
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Download transactions from your bank and upload them here
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Upload Area */}
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-6 md:p-10 text-center transition-colors hover:bg-muted/20 hover:border-muted-foreground/30 cursor-pointer">
                <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4">
                  <Upload className="h-7 w-7 md:h-8 md:w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm md:text-base font-medium text-muted-foreground">
                  CSV import coming soon
                </p>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground/70">
                  Supports ING, CBA, NAB, ANZ, Westpac, and more
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="font-medium text-sm mb-3">
                  How to export from your bank:
                </p>
                <ol className="space-y-2">
                  {[
                    "Log in to your bank's online banking",
                    'Go to your transaction history',
                    'Look for "Export" or "Download" option',
                    'Select CSV format and date range',
                    'Upload the file here',
                  ].map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-xs md:text-sm text-muted-foreground"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>

          {/*
            Manual Entry Section
            @description Link to transactions page for manual entry
          */}
          <Card className="overflow-hidden border-0 shadow-md md:border">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-base">Manual Entry</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                You can always add transactions manually
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <Link href="/transactions">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto group transition-all duration-200 hover:border-primary/50"
                >
                  Go to Transactions
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
