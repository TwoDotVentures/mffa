import { PageHeader } from '@/components/page-header';
import { ChatInterface } from '@/components/chat/chat-interface';

export default function ChatPage() {
  return (
    <>
      <PageHeader title="AI Chat" description="Ask your AI Accountant anything" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <ChatInterface />
        </div>
      </main>
    </>
  );
}
