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

export default async function FamilyMembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'members';

  const [members, activities] = await Promise.all([
    getFamilyMembers(),
    getAllActiveActivities(),
  ]);

  const children = members.filter((m: FamilyMember) => m.member_type === 'child');

  // Calculate stats (fees will be loaded client-side in summary components)
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
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Family Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">
                {children.length} {children.length === 1 ? 'child' : 'children'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">
                School-age children
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground">Active activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalActivityCost.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Estimated annual</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="mr-2 h-4 w-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Activity className="mr-2 h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <FamilyMembersList />
            </Suspense>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <SchoolFeesSummary />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <FeeCalendar />
            </Suspense>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <ExtracurricularSummary />
            </Suspense>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
              <ActivitySchedule />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <FeeTypesManager />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <ActivityTypesManager />
              </Suspense>
            </div>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <FrequenciesManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
