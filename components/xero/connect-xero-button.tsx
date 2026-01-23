'use client';

import { Button } from '@/components/ui/button';
import { initiateXeroAuth } from '@/lib/xero/actions';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_USER_ID } from '@/lib/constants';

interface ConnectXeroButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  children?: React.ReactNode;
}

export function ConnectXeroButton({
  variant = 'default',
  size = 'default',
  children = 'Connect to Xero',
}: ConnectXeroButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
