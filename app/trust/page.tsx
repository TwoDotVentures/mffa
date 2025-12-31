import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TrustPage() {
  return (
    <>
      <PageHeader title="Trust" description="Moyle Family Trust management" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Income YTD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">FY 2024-25</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Franking Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Available to stream</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distributable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Net income to distribute</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribution Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>30 June 2025</Badge>
              <p className="mt-1 text-xs text-muted-foreground">Must distribute by this date</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Beneficiaries</CardTitle>
              <CardDescription>Grant and Shannon Moyle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Grant Moyle</p>
                    <p className="text-sm text-muted-foreground">Distributions: $0.00</p>
                  </div>
                  <Badge variant="outline">0%</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Shannon Moyle</p>
                    <p className="text-sm text-muted-foreground">Distributions: $0.00</p>
                  </div>
                  <Badge variant="outline">0%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribution Modeller</CardTitle>
              <CardDescription>Plan your distribution split</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                Add trust income to model distribution scenarios
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
