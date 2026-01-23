/**
 * Member Detail Client Component
 *
 * Client-side component for member detail page with tab content.
 * Mobile-first responsive design with:
 * - 2-column grid on mobile for overview cards
 * - Stacked layout for detail sections
 * - Touch-friendly spacing and elements
 * - Compact info display on smaller screens
 *
 * @module components/family-members/member-detail-client
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type {
  FamilyMember,
  SchoolEnrolment,
  Extracurricular,
  MemberDocument as MemberDocType,
} from '@/lib/types';

interface MemberDetailClientProps {
  member: FamilyMember;
  activeTab: string;
}

/**
 * Member Detail Client Component
 * Renders tab content for member detail page
 */
export function MemberDetailClient({ member, activeTab }: MemberDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);

  const [enrolments, setEnrolments] = useState<SchoolEnrolment[]>([]);
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [documents, setDocuments] = useState<MemberDocType[]>([]);

  /** Memoize loadData with useCallback to fix dependency warning */
  const loadData = useCallback(async () => {
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
  }, [member.id, member.member_type]);

  /** Effect with proper dependency */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Memoize derived values */
  const currentEnrolment = useMemo(() => enrolments.find((e) => e.is_current), [enrolments]);

  const activeActivities = useMemo(() => activities.filter((a) => a.is_active), [activities]);

  const totalActivityCost = useMemo(
    () =>
      activeActivities.reduce((sum, a) => {
        const cost = a.cost_amount || 0;
        const multiplier = a.cost_frequency?.per_year_multiplier || 1;
        return sum + cost * multiplier;
      }, 0),
    [activeActivities]
  );

  /** Memoize callback handlers */
  const handleEditDialogChange = useCallback(
    (open: boolean) => {
      setEditDialogOpen(open);
      if (!open) {
        router.refresh();
      }
    },
    [router]
  );

  const handleDocumentUploadSuccess = useCallback(() => {
    setDocumentUploadOpen(false);
    loadData();
  }, [loadData]);

  const handleOpenEditDialog = useCallback(() => setEditDialogOpen(true), []);
  const handleOpenDocumentUpload = useCallback(() => setDocumentUploadOpen(true), []);

  /** Loading state */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground sm:h-8 sm:w-8" />
      </div>
    );
  }

  return (
    <>
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-3 sm:space-y-4">
        {/* Overview Cards - 2 col mobile, 3 col desktop */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
          {/* Personal Info Card */}
          <Card className="col-span-2 overflow-hidden lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Personal Information
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenEditDialog}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0 sm:space-y-3 sm:p-4 sm:pt-0">
              {member.date_of_birth && (
                <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                  <span>
                    {new Date(member.date_of_birth).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                  <a
                    href={`mailto:${member.email}`}
                    className="truncate text-primary hover:underline"
                  >
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                  <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                    {member.phone}
                  </a>
                </div>
              )}
              {!member.date_of_birth && !member.email && !member.phone && (
                <p className="text-xs text-muted-foreground sm:text-sm">No contact information</p>
              )}
            </CardContent>
          </Card>

          {/* School Card (for children) */}
          {member.member_type === 'child' && (
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Current School
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                {currentEnrolment ? (
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-sm font-medium sm:text-base">
                      {currentEnrolment.school?.name}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Year {currentEnrolment.year_level}
                    </p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {currentEnrolment.school?.school_type || 'School'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground sm:text-sm">Not currently enrolled</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enrolments Card */}
          {member.member_type === 'child' && (
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Enrolments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg font-bold sm:text-2xl">{enrolments.length}</div>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    School enrolment{enrolments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activities Summary Card */}
          {member.member_type === 'child' && (
            <Card className="overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg font-bold sm:text-2xl">{activeActivities.length}</div>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    ${totalActivityCost.toLocaleString()}/year
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Card */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-lg font-bold sm:text-2xl">{documents.length}</div>
                <p className="text-[10px] text-muted-foreground sm:text-xs">Linked documents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {member.notes && (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <p className="whitespace-pre-wrap text-xs sm:text-sm">{member.notes}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* School Tab */}
      {member.member_type === 'child' && (
        <TabsContent value="school" className="space-y-3 sm:space-y-4">
          <SchoolSection member={member} />
        </TabsContent>
      )}

      {/* Fees Tab */}
      {member.member_type === 'child' && currentEnrolment && (
        <TabsContent value="fees" className="space-y-3 sm:space-y-4">
          <SchoolFeesList enrolment={currentEnrolment} />
        </TabsContent>
      )}

      {/* Activities Tab */}
      {member.member_type === 'child' && (
        <TabsContent value="activities" className="space-y-3 sm:space-y-4">
          <ExtracurricularList member={member} />
        </TabsContent>
      )}

      {/* Documents Tab */}
      <TabsContent value="documents" className="space-y-3 sm:space-y-4">
        <MemberDocuments familyMember={member} onAddDocument={handleOpenDocumentUpload} />
      </TabsContent>

      {/* Dialogs */}
      <FamilyMemberDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogChange}
        member={member}
      />

      <MemberDocumentUpload
        open={documentUploadOpen}
        onOpenChange={setDocumentUploadOpen}
        familyMember={member}
        onSuccess={handleDocumentUploadSuccess}
      />
    </>
  );
}
