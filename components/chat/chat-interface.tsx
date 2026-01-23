'use client';

/**
 * @fileoverview Chat Interface Component
 *
 * A mobile-first, full-screen chat experience for the AI Accountant.
 * Features bubble-style messages, fixed input at bottom, auto-scroll,
 * keyboard-aware layout, and smooth animations.
 *
 * @module components/chat/chat-interface
 */

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
  MessageSquare,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Quick action suggestions for the chat
 * @description Pre-defined prompts to help users get started
 */
const QUICK_ACTIONS = [
  { label: "What's my net worth?", icon: Sparkles },
  { label: 'Show spending this month', icon: MessageSquare },
  { label: 'How much super cap left?', icon: MessageSquare },
  { label: 'Trust distribution options', icon: MessageSquare },
];

/**
 * ChatInterface Component
 *
 * @description Full-screen chat interface optimized for mobile devices.
 * Provides a conversational UI for interacting with the AI Accountant.
 *
 * Features:
 * - Mobile-first responsive design
 * - Bubble-style message layout with user/AI distinction
 * - Fixed input bar at bottom
 * - Auto-scroll to new messages with manual scroll detection
 * - Quick action suggestions for new users
 * - Loading and error states
 * - Clear chat functionality
 *
 * @returns {JSX.Element} The chat interface component
 */
export function ChatInterface() {
  /** Reference to the scroll container for auto-scrolling */
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  /** Reference to the input field for focus management */
  const inputRef = useRef<HTMLInputElement>(null);
  /** Controlled input value state */
  const [inputValue, setInputValue] = useState('');
  /** Track if user has manually scrolled up */
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  /** Track if we should show the scroll-to-bottom button */
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat();

  /** Determine if the chat is currently processing */
  const isLoading = status === 'streaming' || status === 'submitted';

  /**
   * Scroll to the bottom of the chat
   * @description Smoothly scrolls the chat container to show the latest message
   */
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsUserScrolled(false);
      setShowScrollButton(false);
    }
  }, []);

  /**
   * Handle scroll events to detect manual scrolling
   * @description Shows scroll button when user scrolls up from bottom
   */
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolled(!isAtBottom);
      setShowScrollButton(!isAtBottom && messages.length > 0);
    }
  }, [messages.length]);

  /**
   * Auto-scroll when new messages arrive
   * @description Only auto-scrolls if user hasn't manually scrolled up
   */
  useEffect(() => {
    if (!isUserScrolled && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isUserScrolled]);

  /**
   * Focus input on mount for immediate interaction
   */
  useEffect(() => {
    // Delay focus slightly to ensure the component is fully mounted
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle form submission
   * @description Sends the user's message to the AI
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsUserScrolled(false);
    await sendMessage({ parts: [{ type: 'text' as const, text: message }], role: 'user' });
  };

  /**
   * Handle quick action button clicks
   * @description Sends a pre-defined prompt to the AI
   * @param {string} text - The quick action prompt text
   */
  const handleQuickAction = async (text: string) => {
    if (isLoading) return;
    setInputValue('');
    setIsUserScrolled(false);
    await sendMessage({ parts: [{ type: 'text' as const, text }], role: 'user' });
  };

  /**
   * Clear the chat history
   * @description Resets the conversation to its initial state
   */
  const clearChat = () => {
    setMessages([]);
    setInputValue('');
    setIsUserScrolled(false);
    setShowScrollButton(false);
  };

  return (
    <Card className="flex h-[calc(100vh-11rem)] md:h-[calc(100vh-12rem)] flex-col overflow-hidden border-0 shadow-lg md:border md:rounded-xl">
      {/*
        Header Section
        @description Displays the AI identity and chat controls
      */}
      <CardHeader className="flex-none border-b bg-gradient-to-r from-primary/5 to-primary/10 px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* AI Identity */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold leading-tight">
                AI Accountant
              </h2>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {isLoading ? 'Typing...' : 'Online'}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="hidden sm:flex text-[10px] md:text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-0"
            >
              Beta
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                className="h-8 w-8 md:h-9 md:w-auto md:px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline ml-2 text-xs">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/*
        Messages Area
        @description Scrollable container for chat messages with auto-scroll
      */}
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scroll-smooth overscroll-contain"
        >
          <div className="space-y-3 md:space-y-4 p-3 md:p-4 pb-4">
            {/* Empty State - Quick Actions */}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 animate-in fade-in-0 duration-500">
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 md:mb-6 ring-4 ring-primary/10">
                  <Bot className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <h3 className="mb-2 text-base md:text-lg font-semibold text-center">
                  Hello! I&apos;m your AI Accountant
                </h3>
                <p className="mb-6 md:mb-8 max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
                  I can help you understand your finances across personal accounts, SMSF,
                  and Family Trust. Ask me anything!
                </p>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.label)}
                      className="justify-start gap-2.5 h-auto py-2.5 px-3 text-left text-xs md:text-sm hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                      disabled={isLoading}
                    >
                      <action.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/60 group-hover:text-primary transition-colors shrink-0" />
                      <span className="line-clamp-1">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Bubbles */
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2 md:gap-3 animate-in slide-in-from-bottom-2 duration-300',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* AI Avatar */}
                  {message.role === 'assistant' && (
                    <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20 self-end mb-1">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'max-w-[85%] md:max-w-[80%] rounded-2xl px-3.5 py-2.5 md:px-4 md:py-3 shadow-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted/80 rounded-bl-md border border-border/50'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown>
                          {message.parts
                            ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                            .map((part) => part.text)
                            .join('') || ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {message.parts
                          ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                          .map((part) => part.text)
                          .join('') || ''}
                      </p>
                    )}
                  </div>

                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-primary ring-1 ring-primary/50 self-end mb-1">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2 md:gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20 self-end mb-1">
                  <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-muted/80 border border-border/50 px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex gap-2 md:gap-3 animate-in fade-in-0 duration-300">
                <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20 self-end mb-1">
                  <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-destructive/10 border border-destructive/20 px-4 py-3 max-w-[85%]">
                  <p className="text-xs md:text-sm text-destructive">
                    {error.message || 'An error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <Button
            variant="secondary"
            size="icon"
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </CardContent>

      {/*
        Input Section
        @description Fixed input bar with send button, optimized for mobile
      */}
      <div className="flex-none border-t bg-background/95 backdrop-blur-sm p-2.5 md:p-4 safe-area-bottom">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={isLoading}
              className={cn(
                'w-full rounded-full border border-input bg-background px-4 py-2.5 md:py-3 text-sm md:text-base',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-all duration-200'
              )}
              autoComplete="off"
              enterKeyHint="send"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
            className={cn(
              'h-10 w-10 md:h-11 md:w-11 rounded-full shrink-0',
              'transition-all duration-200',
              inputValue.trim() && !isLoading
                ? 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg scale-100'
                : 'bg-primary/50 scale-95'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
