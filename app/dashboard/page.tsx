/**
 * Dashboard Page
 *
 * The main landing page providing a comprehensive overview of family finances.
 * Features a mobile-first responsive design with:
 * - Summary cards: 1 col mobile, 2 col tablet, 4 col desktop
 * - Recent transactions with compact list view
 * - Quick actions with large touch targets
 * - AI Accountant section (collapsible on mobile)
 * - Entrance animations and loading skeletons
 *
 * @module app/dashboard/page
 */

import { PageHeader } from '@/components/page-header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

/**
 * Dashboard page component
 * Renders the main dashboard with financial overview
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your family finances" />
      <main className="flex-1 p-4 md:p-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}
