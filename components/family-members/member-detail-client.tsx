'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FamilyMemberDialog } from '@/components/family-members/family-member-dialog';
import { SchoolSection } from '@/components/family-members/school-section';
import { SchoolFeesList } from '@/components/family-members/school-fees-list';
import { ExtracurricularList } from '@/components/family-members/extracurricular-list';
import { MemberDocuments } from '@/components/family-members/member-documents';
import { MemberDocumentUpload } from '@/components/family-members/member-document-upload';
import {
  getEnrolmentsByMember,
  getActivitiesByMember,
  getMemberDocuments,
} from '@/lib/family-members/actions';
import {
  Calendar,
  Mail,
  Phone,
  Pencil,
  GraduationCap,
  DollarSign,
  Activity,
  FileText,
  Loader2,
} from 'lucide-react';
import type { FamilyMember, SchoolEnrolment, Extracurricular, MemberDocument as MemberDocType } from '@/lib/types';

interface MemberDetailClientProps {
  member: FamilyMember;
  activeTab: string;
}

export function MemberDetailClient({ member, activeTab }: MemberDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);

  const [enrolments, setEnrolments] = useState<SchoolEnrolment[]>([]);
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [documents, setDocuments] = useState<MemberDocType[]>([]);

  useEffect(() => {
    loadData();
  }, [member.id]);

  async function loadData() {
    try {
      setLoading(true);
      const [enrolmentsData, activitiesData, documentsData] = await Promise.all([
        member.member_type === 'child' ? getEnrolmentsByMember(member.id) : Promise.resolve([]),
        member.member_type === 'child' ? getActivitiesByMember(member.id) : Promise.resolve([]),
        getMemberDocuments(member.id),
      ]);
      setEnrolments(enrolmentsData);
      setActivities(activitiesData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentEnrolment = enrolments.find((e) => e.is_current);
  const activeActivities = activities.filter((a) => a.is_active);
  const totalActivityCost = activeActivities.reduce((sum, a) => {
    const cost = a.cost_amount || 0;
    const multiplier = a.cost_frequency?.per_year_multiplier || 1;
    return sum + cost * multiplier;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Personal Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.date_of_birth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(member.date_of_birth).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                    {member.phone}
                  </a>
                </div>
              )}
              {!member.date_of_birth && !member.email && !member.phone && (
                <p className="text-sm text-muted-foreground">No contact information</p>
              )}
            </CardContent>
          </Card>

          {/* School Card (for children) */}
          {member.member_type === 'child' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Current School
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentEnrolment ? (
                  <div className="space-y-2">
                    <p className="font-medium">{currentEnrolment.school?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Year {currentEnrolment.year_level}
                    </p>
                    <Badge variant="outline">
                      {currentEnrolment.school?.school_type || 'School'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not currently enrolled</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enrolments Card */}
          {member.member_type === 'child' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Enrolments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {enrolments.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    School enrolment{enrolments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activities Summary Card */}
          {member.member_type === 'child' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {activeActivities.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${totalActivityCost.toLocaleString()}/year
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-sm text-muted-foreground">Linked documents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {member.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* School Tab */}
      {member.member_type === 'child' && (
        <TabsContent value="school" className="space-y-4">
          <SchoolSection member={member} />
        </TabsContent>
      )}

      {/* Fees Tab */}
      {member.member_type === 'child' && currentEnrolment && (
        <TabsContent value="fees" className="space-y-4">
          <SchoolFeesList enrolment={currentEnrolment} />
        </TabsContent>
      )}

      {/* Activities Tab */}
      {member.member_type === 'child' && (
        <TabsContent value="activities" className="space-y-4">
          <ExtracurricularList member={member} />
        </TabsContent>
      )}

      {/* Documents Tab */}
      <TabsContent value="documents" className="space-y-4">
        <MemberDocuments
          familyMember={member}
          onAddDocument={() => setDocumentUploadOpen(true)}
        />
      </TabsContent>

      {/* Dialogs */}
      <FamilyMemberDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            router.refresh();
          }
        }}
        member={member}
      />

      <MemberDocumentUpload
        open={documentUploadOpen}
        onOpenChange={setDocumentUploadOpen}
        familyMember={member}
        onSuccess={() => {
          setDocumentUploadOpen(false);
          loadData();
        }}
      />
    </>
  );
}
