/**
 * @fileoverview Chat Page
 *
 * Full-screen AI chat experience with the AI Accountant.
 * Optimized for mobile-first usage with keyboard-aware layout.
 *
 * @module app/chat/page
 */

import { PageHeader } from '@/components/page-header';
import { ChatInterface } from '@/components/chat/chat-interface';

/**
 * ChatPage Component
 *
 * @description Main page for the AI Accountant chat feature.
 * Provides a full-screen conversational interface for financial queries.
 *
 * @returns {JSX.Element} The chat page
 */
export default function ChatPage() {
  return (
    <>
      {/* Page Header - Compact on mobile */}
      <PageHeader
        title="AI Chat"
        description="Ask your AI Accountant anything"
      />

      {/* Main Content - Full height chat interface */}
      <main className="flex-1 px-2 pb-2 md:p-4 lg:p-6">
        <div className="mx-auto max-w-3xl lg:max-w-4xl h-full">
          <ChatInterface />
        </div>
      </main>
    </>
  );
}
