import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Upload, FileSpreadsheet, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BankConnectionsPage() {
  return (
    <>
      <PageHeader
        title="Bank Connections"
        description="Import your bank transactions"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
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
                Import your bank transactions using one of the methods below.
                All Australian banks support CSV export from their online banking.
              </p>
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
                <p className="font-medium text-foreground">How to export from your bank:</p>
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

          {/* Xero Integration Option */}
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
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Xero Accounting</p>
                  <p className="text-sm text-muted-foreground">
                    Sync transactions from your connected Xero accounts
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
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
                <Button variant="outline">
                  Go to Transactions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
