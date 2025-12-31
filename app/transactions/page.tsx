import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Plus } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" description="View and categorise your transactions" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>Search, filter, and categorise your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="mb-4">No transactions yet.</p>
                <p className="text-sm">
                  Import a bank statement or add transactions manually to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
