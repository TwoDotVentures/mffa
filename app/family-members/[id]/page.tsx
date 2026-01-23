/**
 * Family Member Detail Page
 *
 * Mobile-first responsive design with:
 * - Compact summary card optimized for mobile viewing
 * - Horizontally scrollable tabs on mobile devices
 * - Touch-friendly tap targets and spacing
 * - Badge wrapping for narrow screens
 *
 * @module app/family-members/[id]/page
 */
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberDetailClient } from '@/components/family-members/member-detail-client';
import { getFamilyMember } from '@/lib/family-members/actions';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Activity,
  FileText,
  DollarSign,
} from 'lucide-react';
import type { MemberType } from '@/lib/types';
import { RELATIONSHIP_LABELS } from '@/lib/types';

/** Display labels for member types */
const MEMBER_TYPE_DISPLAY: Record<MemberType, string> = {
  adult: 'Adult',
  child: 'Child',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Family Member detail page component
 * Renders member info with tabbed navigation for different sections
 */
export default async function FamilyMemberDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const activeTab = search.tab || 'overview';

  const member = await getFamilyMember(id);

  if (!member) {
    notFound();
  }

  /** Calculate age from date of birth */
  const age = member.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(member.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <>
      <PageHeader
        title={member.name}
        description={`${MEMBER_TYPE_DISPLAY[member.member_type]}${
          member.relationship ? ` - ${RELATIONSHIP_LABELS[member.relationship]}` : ''
        }`}
      />
      {/* Main content with mobile-optimized padding */}
      <main className="flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-6">
        {/* Back Navigation - Touch-friendly sizing */}
        <div>
          <Button variant="ghost" size="sm" asChild className="h-9 gap-1.5 px-2 sm:h-10 sm:gap-2 sm:px-3">
            <Link href="/family-members">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Back</span>
            </Link>
          </Button>
        </div>

        {/* Member Summary Card - Mobile-optimized layout */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            {/* Mobile: Stack vertically, Desktop: Horizontal */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              {/* Avatar Circle - Smaller on mobile */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
                <User className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
              </div>

              {/* Member Info */}
              <div className="flex-1 space-y-2">
                {/* Name - Responsive sizing */}
                <h2 className="text-xl font-bold leading-tight sm:text-2xl">{member.name}</h2>

                {/* Badges - Wrap on mobile */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {MEMBER_TYPE_DISPLAY[member.member_type]}
                  </Badge>
                  {member.relationship && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {RELATIONSHIP_LABELS[member.relationship]}
                    </Badge>
                  )}
                  {age !== null && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {age} years old
                    </Badge>
                  )}
                  {member.date_of_birth && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      DOB: {new Date(member.date_of_birth).toLocaleDateString('en-AU')}
                    </Badge>
                  )}
                </div>

                {/* Notes - Muted text */}
                {member.notes && (
                  <p className="text-xs text-muted-foreground sm:text-sm">{member.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Navigation - Horizontally scrollable on mobile */}
        <Tabs defaultValue={activeTab} className="space-y-3 sm:space-y-4">
          {/* Scrollable Tab Container */}
          <div className="-mx-3 sm:mx-0">
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-1 px-3 sm:inline-flex sm:h-10 sm:w-auto sm:justify-center sm:gap-0 sm:bg-muted sm:px-1">
              {/* Overview Tab */}
              <TabsTrigger
                value="overview"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Overview</span>
              </TabsTrigger>

              {/* Child-specific tabs */}
              {member.member_type === 'child' && (
                <>
                  <TabsTrigger
                    value="school"
                    className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
                  >
                    <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>School</span>
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
                </>
              )}

              {/* Documents Tab - Always visible */}
              <TabsTrigger
                value="documents"
                className="shrink-0 gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:gap-2 sm:px-4 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Documents</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Loaded via client component */}
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg sm:h-[500px]" />}>
            <MemberDetailClient member={member} activeTab={activeTab} />
          </Suspense>
        </Tabs>
      </main>
    </>
  );
}
