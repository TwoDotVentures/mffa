import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SmsfPage() {
  return (
    <>
      <PageHeader title="SMSF" description="G & S Super Fund management" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fund Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Total fund assets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Grant&apos;s Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Member balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Shannon&apos;s Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Member balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Not Set Up</Badge>
              <p className="mt-1 text-xs text-muted-foreground">Audit & lodgement status</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Caps (FY 2024-25)</CardTitle>
              <CardDescription>Track concessional and non-concessional contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">Concessional cap: $30,000</p>
                  <p className="mb-2">Non-concessional cap: $120,000</p>
                  <p className="text-sm">Add contributions to track cap usage</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Investments</CardTitle>
              <CardDescription>Fund investment holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No investments recorded yet
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
