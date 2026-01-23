/**
 * @fileoverview Hook for detecting mobile viewport.
 * @module hooks/use-mobile
 */

import * as React from 'react';

/** Breakpoint in pixels below which device is considered mobile */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses matchMedia API for efficient detection with event listener for changes.
 *
 * @returns True if viewport width is below MOBILE_BREAKPOINT (768px)
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
