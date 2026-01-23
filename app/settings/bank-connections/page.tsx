import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2, Upload, FileSpreadsheet, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XeroConnectionCard } from '@/components/xero/xero-connection-card';
import { ConnectXeroButton } from '@/components/xero/connect-xero-button';
import { getXeroConnections } from '@/lib/xero/actions';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BankConnectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params.error as string | undefined;
  const success = params.success as string | undefined;

  // Fetch existing Xero connections
  const { connections: xeroConnections } = await getXeroConnections();

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
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Success/Error Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          {success === 'connected' && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Connected to Xero!</AlertTitle>
              <AlertDescription>
                Your Xero account has been connected successfully. You can now sync
                transactions.
              </AlertDescription>
            </Alert>
          )}

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-blue-500" />
                Transaction Import Options
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Import your bank transactions using one of the methods below. Connect
                to Xero for automatic daily syncing, or import CSV files manually.
              </p>
            </CardContent>
          </Card>

          {/* Xero Integration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Xero Integration
              </CardTitle>
              <CardDescription>
                Connect to Xero to automatically sync your bank transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connected Xero Organizations */}
              {xeroConnections.length > 0 ? (
                <div className="space-y-4">
                  {xeroConnections.map((connection) => (
                    <XeroConnectionCard
                      key={connection.id}
                      connection={connection}
                    />
                  ))}

                  {/* Option to connect another organization */}
                  <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                    <div>
                      <p className="text-sm font-medium">Connect Another Organization</p>
                      <p className="text-xs text-muted-foreground">
                        Add another Xero organization to sync from
                      </p>
                    </div>
                    <ConnectXeroButton variant="outline" size="sm">
                      Add Organization
                    </ConnectXeroButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Xero Accounting</p>
                    <p className="text-sm text-muted-foreground">
                      Sync transactions from your connected Xero accounts
                    </p>
                  </div>
                  <ConnectXeroButton />
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Import Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                CSV Import
              </CardTitle>
              <CardDescription>
                Download transactions from your bank and upload them here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  CSV import coming soon
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports ING, CBA, NAB, ANZ, Westpac, and more
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  How to export from your bank:
                </p>
                <ol className="mt-2 list-inside list-decimal space-y-1">
                  <li>Log in to your bank&apos;s online banking</li>
                  <li>Go to your transaction history</li>
                  <li>Look for &quot;Export&quot; or &quot;Download&quot; option</li>
                  <li>Select CSV format and date range</li>
                  <li>Upload the file here</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Entry</CardTitle>
              <CardDescription>
                You can always add transactions manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/transactions">
                <Button variant="outline">Go to Transactions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
