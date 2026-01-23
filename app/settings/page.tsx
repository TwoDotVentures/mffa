import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Database, User, Building2, ChevronRight } from 'lucide-react';
import { getXeroConnections } from '@/lib/xero/actions';

export default async function SettingsPage() {
  const { connections: xeroConnections } = await getXeroConnections();
  const hasXeroConnection = xeroConnections.length > 0;
  const activeConnection = xeroConnections.find(c => c.status === 'active');

  return (
    <>
      <PageHeader title="Settings" description="Configure your app preferences" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Connections
              </CardTitle>
              <CardDescription>
                Connect your bank accounts for automatic transaction sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/bank-connections">
                <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {hasXeroConnection ? 'Xero Connected' : 'Connect to Xero'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activeConnection
                          ? `Syncing from ${activeConnection.tenant_name}`
                          : 'Sync transactions automatically from Xero'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasXeroConnection && (
                      <Badge variant={activeConnection ? 'default' : 'secondary'} className={activeConnection ? 'bg-green-600' : ''}>
                        {activeConnection ? 'Active' : 'Disconnected'}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI model provider for the AI Accountant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a provider...
                  </option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="groq">Groq (Llama)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <select className="w-full rounded-md border bg-background px-3 py-2" disabled>
                  <option>Select a provider first</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input type="password" placeholder="Enter your API key..." disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <Input type="range" min="0" max="1" step="0.1" defaultValue="0.7" disabled />
                <p className="text-xs text-muted-foreground">0 = Precise, 1 = Creative</p>
              </div>
              <Button disabled>Test Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database
              </CardTitle>
              <CardDescription>Supabase connection status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connection Status</p>
                  <p className="text-sm text-muted-foreground">
                    Add your Supabase credentials to .env.local
                  </p>
                </div>
                <Badge variant="secondary">Not Connected</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Family Members
              </CardTitle>
              <CardDescription>Manage family member profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Grant Moyle</span>
                  <Badge>Adult</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Shannon Moyle</span>
                  <Badge>Adult</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>3 Children</span>
                  <Badge variant="outline">Dependents</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
