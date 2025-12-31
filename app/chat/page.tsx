import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <>
      <PageHeader title="AI Chat" description="Ask your AI Accountant anything" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Accountant
                </CardTitle>
                <CardDescription>
                  Your personal financial advisor with access to all your data
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">No Model Configured</Badge>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="mb-4 h-12 w-12" />
                <p className="mb-2 text-lg font-medium">Welcome to the AI Accountant</p>
                <p className="mb-4 max-w-md">
                  Ask questions about your personal finances, SMSF, or Family Trust. The AI has full
                  access to all your financial data.
                </p>
                <div className="space-y-2 text-sm">
                  <p>&ldquo;How much super cap do we have left this year?&rdquo;</p>
                  <p>&ldquo;What&apos;s our net worth across all entities?&rdquo;</p>
                  <p>&ldquo;How should we split the trust distribution?&rdquo;</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Input placeholder="Ask your AI Accountant..." disabled className="flex-1" />
                <Button disabled>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Configure your AI provider in Settings to start chatting
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
