'use client';

/**
 * @fileoverview Connect Xero Button Component
 *
 * A prominent, mobile-friendly button for initiating Xero OAuth flow.
 * Features loading states and visual feedback during connection.
 *
 * @module components/xero/connect-xero-button
 */

import { Button } from '@/components/ui/button';
import { initiateXeroAuth } from '@/lib/xero/actions';
import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Props for ConnectXeroButton component
 * @interface ConnectXeroButtonProps
 */
interface ConnectXeroButtonProps {
  /** Button visual variant */
  variant?: 'default' | 'outline';
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Button content (defaults to "Connect to Xero") */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ConnectXeroButton Component
 *
 * @description Initiates the Xero OAuth connection flow with visual feedback.
 *
 * Features:
 * - Loading state during connection
 * - Error handling with toast notifications
 * - Redirects to Xero OAuth on success
 * - Mobile-optimized touch target
 *
 * @param {ConnectXeroButtonProps} props - Component props
 * @returns {JSX.Element} Connect to Xero button
 */
export function ConnectXeroButton({
  variant = 'default',
  size = 'default',
  children = 'Connect to Xero',
  className,
}: ConnectXeroButtonProps) {
  /** Track loading state during OAuth initiation */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle button click to initiate Xero OAuth
   * @description Calls server action and redirects to Xero on success
   */
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const result = await initiateXeroAuth(DEFAULT_USER_ID);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.url) {
        // Redirect to Xero OAuth page
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to connect to Xero:', error);
      toast.error('Failed to connect to Xero');
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isLoading}
      className={cn(
        // Base styles for better mobile touch targets
        'min-h-[44px] transition-all duration-200',
        // Hover effects
        variant === 'default' && 'hover:shadow-md active:scale-[0.98]',
        variant === 'outline' && 'hover:bg-primary/5 hover:border-primary/30',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm">Connecting...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
