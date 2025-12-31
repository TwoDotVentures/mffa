import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" description="Manage your bank accounts and cards" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <CardDescription>Bank accounts, credit cards, and investment accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="mb-4">No accounts added yet.</p>
                <p className="text-sm">Add your first account to start tracking your finances.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
