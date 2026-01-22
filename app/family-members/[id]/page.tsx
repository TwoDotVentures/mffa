import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { MemberType } from '@/lib/types';
import { RELATIONSHIP_LABELS } from '@/lib/types';

const MEMBER_TYPE_DISPLAY: Record<MemberType, string> = {
  adult: 'Adult',
  child: 'Child',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function FamilyMemberDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const activeTab = search.tab || 'overview';

  const member = await getFamilyMember(id);

  if (!member) {
    notFound();
  }

  // Calculate age if date of birth is set
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
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Back Button */}
        <div>
          <Button variant="ghost" asChild>
            <Link href="/family-members">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Family Members
            </Link>
          </Button>
        </div>

        {/* Member Summary Card */}
        <Card>
          <CardContent className="flex items-center gap-6 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-2xl font-bold">{member.name}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {MEMBER_TYPE_DISPLAY[member.member_type]}
                </Badge>
                {member.relationship && (
                  <Badge variant="outline">
                    {RELATIONSHIP_LABELS[member.relationship]}
                  </Badge>
                )}
                {age !== null && (
                  <Badge variant="outline">{age} years old</Badge>
                )}
                {member.date_of_birth && (
                  <Badge variant="outline">
                    DOB: {new Date(member.date_of_birth).toLocaleDateString('en-AU')}
                  </Badge>
                )}
              </div>
              {member.notes && (
                <p className="text-sm text-muted-foreground mt-2">{member.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs - Client component handles the interactive parts */}
        <Tabs defaultValue={activeTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <User className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            {member.member_type === 'child' && (
              <>
                <TabsTrigger value="school">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  School
                </TabsTrigger>
                <TabsTrigger value="fees">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Fees
                </TabsTrigger>
                <TabsTrigger value="activities">
                  <Activity className="mr-2 h-4 w-4" />
                  Activities
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <MemberDetailClient member={member} activeTab={activeTab} />
          </Suspense>
        </Tabs>
      </main>
    </>
  );
}
