'use client';

/**
 * AI Accountant Preview Component
 *
 * A compact preview of the AI Accountant on the dashboard.
 * Features:
 * - Collapsible on mobile for space efficiency
 * - Quick action prompts for common questions
 * - Link to full chat interface
 * - Visual feedback and animations
 *
 * @module components/dashboard/ai-accountant-preview
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  ChevronRight,
  Sparkles,
  MessageSquare,
  TrendingUp,
  PiggyBank,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Quick prompts that users can click to start a conversation
 */
const QUICK_PROMPTS = [
  {
    label: "What's my net worth?",
    icon: TrendingUp,
  },
  {
    label: 'Show my spending',
    icon: MessageSquare,
  },
  {
    label: 'Super cap left?',
    icon: PiggyBank,
  },
  {
    label: 'Tax tips',
    icon: Sparkles,
  },
] as const;

/**
 * AI Accountant preview component for dashboard
 * Shows a teaser of the AI chat with quick action prompts
 */
export function AiAccountantPreview() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card
      className={cn(
        'lg:col-span-3 overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4',
      )}
      style={{ animationDelay: '250ms', animationDuration: '500ms', animationFillMode: 'both' }}
    >
      {/* Header with collapsible toggle on mobile */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg">AI Accountant</CardTitle>
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                  Beta
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Ask anything about your finances
              </CardDescription>
            </div>
          </div>

          {/* Collapse toggle for mobile */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Collapsible content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[500px] lg:opacity-100',
        )}
      >
        <CardContent className="pt-2">
          {/* Welcome message */}
          <div className="flex flex-col items-center text-center py-4 sm:py-6">
            <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-4 mb-3">
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[280px]">
              Get instant insights about your personal finances, SMSF, and Family Trust.
            </p>
          </div>

          {/* Quick prompt buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {QUICK_PROMPTS.map((prompt, index) => (
              <Button
                key={prompt.label}
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'h-auto py-2.5 px-3 justify-start gap-2',
                  'text-xs sm:text-sm font-normal',
                  'transition-all hover:bg-primary/5 hover:border-primary/30',
                  'animate-in fade-in slide-in-from-bottom-2',
                )}
                style={{
                  animationDelay: `${300 + index * 50}ms`,
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                }}
              >
                <Link href={`/chat?prompt=${encodeURIComponent(prompt.label)}`}>
                  <prompt.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{prompt.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Open Chat button */}
          <Button asChild className="w-full gap-2" size="sm">
            <Link href="/chat">
              <MessageSquare className="h-4 w-4" />
              Open Chat
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Link>
          </Button>
        </CardContent>
      </div>

      {/* Collapsed state hint for mobile */}
      {!isExpanded && (
        <CardContent className="pt-0 pb-3 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setIsExpanded(true)}
          >
            Tap to expand
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
