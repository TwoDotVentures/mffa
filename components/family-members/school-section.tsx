/**
 * School Section Component
 *
 * Displays school enrolment information for a family member.
 * Mobile-first responsive design with:
 * - Stacked layouts on mobile, inline on desktop
 * - Touch-friendly action buttons and menus
 * - Compact info cards on smaller screens
 * - Full-screen dialogs on mobile
 *
 * @module components/family-members/school-section
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  School,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Building2,
  MapPin,
  Phone,
  Globe,
  Loader2,
} from 'lucide-react';
import { EnrolmentDialog } from './enrolment-dialog';
import { SchoolDialog } from './school-dialog';
import { SchoolYearDialog } from './school-year-dialog';
import { SchoolTermsEditor } from './school-terms-editor';
import {
  getEnrolmentsByMember,
  deleteEnrolment,
  getSchool,
  getSchoolYears,
} from '@/lib/family-members/actions';
import { formatDate } from '@/lib/family-members/utils';
import type {
  FamilyMember,
  SchoolEnrolment,
  School as SchoolType,
  SchoolYear,
} from '@/lib/types';

interface SchoolSectionProps {
  /** The family member to display enrolments for */
  member: FamilyMember;
}

/**
 * School Section Component
 * Displays and manages school enrolments for a family member
 */
export function SchoolSection({ member }: SchoolSectionProps) {
  const router = useRouter();
  const [enrolments, setEnrolments] = useState<SchoolEnrolment[]>([]);
  const [loading, setLoading] = useState(true);

  /** Dialog states */
  const [enrolmentDialogOpen, setEnrolmentDialogOpen] = useState(false);
  const [editingEnrolment, setEditingEnrolment] = useState<SchoolEnrolment | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEnrolment, setDeletingEnrolment] = useState<SchoolEnrolment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** School management states */
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [schoolYearDialogOpen, setSchoolYearDialogOpen] = useState(false);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [termsEditorOpen, setTermsEditorOpen] = useState(false);

  /** Load enrolments on mount */
  useEffect(() => {
    loadEnrolments();
  }, [member.id]);

  /** Fetch enrolments from server */
  async function loadEnrolments() {
    try {
      setLoading(true);
      const data = await getEnrolmentsByMember(member.id);
      setEnrolments(data);
    } catch (error) {
      console.error('Error loading enrolments:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open add enrolment dialog */
  function handleAddEnrolment() {
    setEditingEnrolment(undefined);
    setEnrolmentDialogOpen(true);
  }

  /** Open edit enrolment dialog */
  function handleEditEnrolment(enrolment: SchoolEnrolment) {
    setEditingEnrolment(enrolment);
    setEnrolmentDialogOpen(true);
  }

  /** Show delete confirmation */
  function handleDeleteClick(enrolment: SchoolEnrolment) {
    setDeletingEnrolment(enrolment);
    setDeleteDialogOpen(true);
  }

  /** Execute enrolment deletion */
  async function handleDelete() {
    if (!deletingEnrolment) return;

    setDeleteLoading(true);
    try {
      await deleteEnrolment(deletingEnrolment.id);
      await loadEnrolments();
      setDeleteDialogOpen(false);
      setDeletingEnrolment(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting enrolment:', error);
    } finally {
      setDeleteLoading(false);
    }
  }

  /** Open school edit dialog */
  async function handleManageSchool(enrolment: SchoolEnrolment) {
    if (!enrolment.school) return;
    try {
      const school = await getSchool(enrolment.school_id);
      if (school) {
        setSelectedSchool(school);
        setSchoolDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading school:', error);
    }
  }

  /** Open school years management dialog */
  async function handleManageSchoolYears(enrolment: SchoolEnrolment) {
    try {
      const school = await getSchool(enrolment.school_id);
      const years = await getSchoolYears(enrolment.school_id);
      if (school) {
        setSelectedSchool(school);
        setSchoolYears(years);
        setSchoolYearDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading school years:', error);
    }
  }

  /** Open terms editor for a school year */
  async function handleManageTerms(schoolYear: SchoolYear) {
    setSelectedSchoolYear(schoolYear);
    setTermsEditorOpen(true);
  }

  const currentEnrolment = enrolments.find((e) => e.is_current);
  const pastEnrolments = enrolments.filter((e) => !e.is_current);

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            School
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {/* Header - Stack on mobile */}
        <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            School
          </CardTitle>
          <Button size="sm" onClick={handleAddEnrolment} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Enrolment
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {enrolments.length === 0 ? (
            /* Empty state */
            <div className="py-6 text-center text-muted-foreground sm:py-8">
              <School className="mx-auto h-10 w-10 opacity-50 sm:h-12 sm:w-12" />
              <p className="mt-2 text-sm sm:text-base">No school enrolments yet</p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Click &quot;Add Enrolment&quot; to enrol in a school
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Enrolment */}
              {currentEnrolment && (
                <div className="rounded-lg border bg-card p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
                      {/* Icon - Smaller on mobile */}
                      <div className="rounded-full bg-primary/10 p-1.5 sm:p-2">
                        <Building2 className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* School name and badge */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm font-semibold sm:text-base">
                            {currentEnrolment.school?.name || 'Unknown School'}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-[10px] text-green-800 dark:bg-green-900 dark:text-green-300 sm:text-xs"
                          >
                            Current
                          </Badge>
                        </div>
                        {/* Year level */}
                        {currentEnrolment.year_level && (
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {currentEnrolment.year_level}
                          </p>
                        )}
                        {/* School contact info - Stack on mobile */}
                        {currentEnrolment.school && (
                          <div className="mt-2 flex flex-col gap-1 text-[10px] text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1 sm:text-xs">
                            {currentEnrolment.school.suburb && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {currentEnrolment.school.suburb}, {currentEnrolment.school.state}
                                </span>
                              </span>
                            )}
                            {currentEnrolment.school.phone && (
                              <a
                                href={`tel:${currentEnrolment.school.phone}`}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                <Phone className="h-3 w-3 shrink-0" />
                                {currentEnrolment.school.phone}
                              </a>
                            )}
                            {currentEnrolment.school.website && (
                              <a
                                href={currentEnrolment.school.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Globe className="h-3 w-3 shrink-0" />
                                Website
                              </a>
                            )}
                          </div>
                        )}
                        {/* Student info */}
                        {(currentEnrolment.student_id || currentEnrolment.house) && (
                          <div className="mt-2 text-[10px] text-muted-foreground sm:text-xs">
                            {currentEnrolment.student_id && (
                              <span>Student ID: {currentEnrolment.student_id}</span>
                            )}
                            {currentEnrolment.student_id && currentEnrolment.house && (
                              <span className="mx-1.5 sm:mx-2">•</span>
                            )}
                            {currentEnrolment.house && (
                              <span>House: {currentEnrolment.house}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                          onClick={() => handleEditEnrolment(currentEnrolment)}
                          className="gap-2 py-2.5"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Enrolment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleManageSchool(currentEnrolment)}
                          className="gap-2 py-2.5"
                        >
                          <Building2 className="h-4 w-4" />
                          Edit School
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleManageSchoolYears(currentEnrolment)}
                          className="gap-2 py-2.5"
                        >
                          <Calendar className="h-4 w-4" />
                          Manage Terms
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 py-2.5 text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(currentEnrolment)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Enrolment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Past Enrolments */}
              {pastEnrolments.length > 0 && (
                <div>
                  <h5 className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    Previous Schools
                  </h5>
                  <div className="space-y-2">
                    {pastEnrolments.map((enrolment) => (
                      <div
                        key={enrolment.id}
                        className="flex items-center justify-between gap-2 rounded-lg border p-2.5 sm:p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h6 className="truncate text-xs font-medium sm:text-sm">
                            {enrolment.school?.name || 'Unknown School'}
                          </h6>
                          <p className="text-[10px] text-muted-foreground sm:text-xs">
                            {enrolment.enrolment_date && formatDate(enrolment.enrolment_date)}
                            {enrolment.enrolment_date && enrolment.expected_graduation && ' - '}
                            {enrolment.expected_graduation && formatDate(enrolment.expected_graduation)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            <DropdownMenuItem
                              onClick={() => handleEditEnrolment(enrolment)}
                              className="gap-2 py-2.5"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 py-2.5 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(enrolment)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolment Dialog */}
      <EnrolmentDialog
        open={enrolmentDialogOpen}
        onOpenChange={setEnrolmentDialogOpen}
        member={member}
        enrolment={editingEnrolment}
        onSuccess={() => loadEnrolments()}
      />

      {/* School Dialog */}
      {selectedSchool && (
        <SchoolDialog
          open={schoolDialogOpen}
          onOpenChange={setSchoolDialogOpen}
          school={selectedSchool}
          onSuccess={() => loadEnrolments()}
        />
      )}

      {/* School Year Selection Dialog - Mobile optimized */}
      <Dialog open={schoolYearDialogOpen} onOpenChange={setSchoolYearDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">School Terms - {selectedSchool?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Select a school year to manage its terms, or add a new year.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {schoolYears.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No school years set up yet. Add one to get started.
              </p>
            ) : (
              schoolYears.map((year) => (
                <Button
                  key={year.id}
                  variant="outline"
                  className="h-11 w-full justify-between sm:h-10"
                  onClick={() => handleManageTerms(year)}
                >
                  <span className="text-sm">{year.year}</span>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {year.terms?.length || 0} terms
                  </span>
                </Button>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              className="h-11 flex-1 sm:h-10"
              onClick={() => setSchoolYearDialogOpen(false)}
            >
              Close
            </Button>
            {selectedSchool && (
              <Button
                className="h-11 flex-1 sm:h-10"
                onClick={() => {
                  setSchoolYearDialogOpen(false);
                  setSelectedSchoolYear(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Year
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* School Year Dialog for adding new year */}
      {selectedSchool && !selectedSchoolYear && (
        <SchoolYearDialog
          open={!schoolYearDialogOpen && !!selectedSchool && !selectedSchoolYear}
          onOpenChange={(open) => {
            if (!open) setSelectedSchool(null);
          }}
          school={selectedSchool}
          onSuccess={async (newYear) => {
            setSelectedSchoolYear({ ...newYear, terms: [] });
            setTermsEditorOpen(true);
          }}
        />
      )}

      {/* School Terms Editor */}
      {selectedSchoolYear && selectedSchool && (
        <SchoolTermsEditor
          open={termsEditorOpen}
          onOpenChange={(open) => {
            setTermsEditorOpen(open);
            if (!open) {
              setSelectedSchoolYear(null);
              setSelectedSchool(null);
            }
          }}
          schoolYear={{ ...selectedSchoolYear, school: selectedSchool }}
          onSuccess={() => loadEnrolments()}
        />
      )}

      {/* Delete Confirmation Dialog - Full width on mobile */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Remove Enrolment</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to remove {member.name}&apos;s enrolment at{' '}
              {deletingEnrolment?.school?.name || 'this school'}? This will also delete
              all associated school fees for this enrolment. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
