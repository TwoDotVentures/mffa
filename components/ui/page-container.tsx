'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  /** Page content */
  children: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether to add vertical spacing between children */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'p-2 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

const spacingClasses = {
  none: '',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
};

/**
 * PageContainer - A wrapper component for page content with consistent styling.
 *
 * Provides consistent max-width, padding, and responsive margins for page content.
 *
 * @example
 * // Basic usage
 * <PageContainer>
 *   <PageHeader title="Dashboard" />
 *   <DashboardContent />
 * </PageContainer>
 *
 * @example
 * // With custom settings
 * <PageContainer maxWidth="lg" padding="lg" spacing="md">
 *   <Card>Content 1</Card>
 *   <Card>Content 2</Card>
 * </PageContainer>
 *
 * @example
 * // Full width with spacing
 * <PageContainer maxWidth="full" spacing="lg">
 *   <FullWidthTable />
 * </PageContainer>
 */
export function PageContainer({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  spacing = 'md',
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'flex-1',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </main>
  );
}
