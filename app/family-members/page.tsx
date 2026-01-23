/**
 * Family Members List Page
 *
 * Mobile-first responsive design with:
 * - Horizontally scrollable tabs on mobile
 * - Stacked stat cards on small screens
 * - Touch-friendly spacing and tap targets
 * - Optimized for iPhone 17 Pro viewport
 *
 * @module app/family-members/page
 */
import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMembersList } from '@/components/family-members/family-members-list';
import { SchoolFeesSummary } from '@/components/family-members/school-fees-summary';
import { ExtracurricularSummary } from '@/components/family-members/extracurricular-summary';
import { ActivitySchedule } from '@/components/family-members/activity-schedule';
import { FeeCalendar } from '@/components/family-members/fee-calendar';
import { FeeTypesManager } from '@/components/family-members/fee-types-manager';
import { ActivityTypesManager } from '@/components/family-members/activity-types-manager';
import { FrequenciesManager } from '@/components/family-members/frequencies-manager';
import {
  getFamilyMembers,
  getAllActiveActivities,
} from '@/lib/family-members/actions';
import type { FamilyMember, Extracurricular } from '@/lib/types';
import {
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Activity,
  Settings,
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Family Members main page component
 * Server-side rendered with client-side interactive tabs
 */
export default async function FamilyMembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'members';

  const [members, activities] = await Promise.all([
    getFamilyMembers(),
    getAllActiveActivities(),
  ]);

  const children = members.filter((m: FamilyMember) => m.member_type === 'child');

  /** Calculate annual activity costs with frequency multiplier */
  const totalActivityCost = activities.reduce((sum: number, a: Extracurricular) => {
    const cost = a.cost_amount || 0;
    const multiplier = a.cost_frequency?.per_year_multiplier || 1;
    return sum + cost * multiplier;
  }, 0);

  return (
    <>
      <PageHeader
        title="Family Members"
        description="Manage your family, school enrolments, fees and activities"
      />
      {/* Main content area with mobile-optimized padding */}
      <main className="flex-1 space-y-4 p-3 sm:p-4 md:p-6">
        {/* Stats Cards Grid - 2 cols on mobile, 4 on larger screens */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
          {/* Family Members Stat */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">Family Members</CardTitle>
              <Users className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl font-bold sm:text-2xl">{members.length}</div>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {children.length} {children.length === 1 ? 'child' : 'children'}
              </p>
            </CardContent>
          </Card>

          {/* Children Stat */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">Children</CardTitle>
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl font-bold sm:text-2xl">{children.length}</div>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                School-age children
              </p>
            </CardContent>
          </Card>

          {/* Activities Stat */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">Activities</CardTitle>
              <Activity className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl font-bold sm:text-2xl">{activities.length}</div>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Active activities</p>
            </CardContent>
          </Card>

          {/* Activity Costs Stat */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">Activity Costs</CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl font-bold sm:text-2xl">
                ${totalActivityCost.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Estimated annual</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section - Horizontally scrollable on mobile */}
        <Tabs defaultValue={activeTab} className="space-y-3 sm:space-y-4">
          {/* Scrollable TabsList with touch-friendly sizing */}
          <div className="-mx-3 sm:mx-0">
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-1 px-3 sm:inline-flex sm:h-10 sm:w-auto sm:justify-center sm:gap-0 sm:bg-muted sm:px-1">
              <TabsTrigger
                value="members"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Members</span>
              </TabsTrigger>
              <TabsTrigger
                value="fees"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Fees</span>
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Activities</span>
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Schedule</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content Panels */}
          <TabsContent value="members" className="mt-0 space-y-3 sm:space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <FamilyMembersList />
            </Suspense>
          </TabsContent>

          <TabsContent value="fees" className="mt-0 space-y-3 sm:space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <SchoolFeesSummary />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
              <FeeCalendar />
            </Suspense>
          </TabsContent>

          <TabsContent value="activities" className="mt-0 space-y-3 sm:space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <ExtracurricularSummary />
            </Suspense>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 space-y-3 sm:space-y-4">
            <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
              <ActivitySchedule />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-4 sm:space-y-6">
            {/* Settings grid - stacked on mobile, 2 cols on large screens */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
                <FeeTypesManager />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
                <ActivityTypesManager />
              </Suspense>
            </div>
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
              <FrequenciesManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
