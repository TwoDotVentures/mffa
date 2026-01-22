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
  Mail,
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
  member: FamilyMember;
}

export function SchoolSection({ member }: SchoolSectionProps) {
  const router = useRouter();
  const [enrolments, setEnrolments] = useState<SchoolEnrolment[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [enrolmentDialogOpen, setEnrolmentDialogOpen] = useState(false);
  const [editingEnrolment, setEditingEnrolment] = useState<SchoolEnrolment | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEnrolment, setDeletingEnrolment] = useState<SchoolEnrolment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // School management
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [schoolYearDialogOpen, setSchoolYearDialogOpen] = useState(false);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [termsEditorOpen, setTermsEditorOpen] = useState(false);

  useEffect(() => {
    loadEnrolments();
  }, [member.id]);

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

  function handleAddEnrolment() {
    setEditingEnrolment(undefined);
    setEnrolmentDialogOpen(true);
  }

  function handleEditEnrolment(enrolment: SchoolEnrolment) {
    setEditingEnrolment(enrolment);
    setEnrolmentDialogOpen(true);
  }

  function handleDeleteClick(enrolment: SchoolEnrolment) {
    setDeletingEnrolment(enrolment);
    setDeleteDialogOpen(true);
  }

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

  async function handleManageTerms(schoolYear: SchoolYear) {
    setSelectedSchoolYear(schoolYear);
    setTermsEditorOpen(true);
  }

  const currentEnrolment = enrolments.find((e) => e.is_current);
  const pastEnrolments = enrolments.filter((e) => !e.is_current);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            School
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            School
          </CardTitle>
          <Button size="sm" onClick={handleAddEnrolment}>
            <Plus className="mr-1 h-4 w-4" />
            Add Enrolment
          </Button>
        </CardHeader>
        <CardContent>
          {enrolments.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <School className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No school enrolments yet</p>
              <p className="text-sm">Click &quot;Add Enrolment&quot; to enrol in a school</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Enrolment */}
              {currentEnrolment && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {currentEnrolment.school?.name || 'Unknown School'}
                          </h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Current
                          </Badge>
                        </div>
                        {currentEnrolment.year_level && (
                          <p className="text-sm text-muted-foreground">
                            {currentEnrolment.year_level}
                          </p>
                        )}
                        {currentEnrolment.school && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {currentEnrolment.school.suburb && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {currentEnrolment.school.suburb}, {currentEnrolment.school.state}
                              </span>
                            )}
                            {currentEnrolment.school.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {currentEnrolment.school.phone}
                              </span>
                            )}
                            {currentEnrolment.school.website && (
                              <a
                                href={currentEnrolment.school.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        )}
                        {(currentEnrolment.student_id || currentEnrolment.house) && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {currentEnrolment.student_id && (
                              <span>Student ID: {currentEnrolment.student_id}</span>
                            )}
                            {currentEnrolment.student_id && currentEnrolment.house && (
                              <span className="mx-2">•</span>
                            )}
                            {currentEnrolment.house && (
                              <span>House: {currentEnrolment.house}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEnrolment(currentEnrolment)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Enrolment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageSchool(currentEnrolment)}>
                          <Building2 className="mr-2 h-4 w-4" />
                          Edit School
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageSchoolYears(currentEnrolment)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Manage Terms
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(currentEnrolment)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
                  <h5 className="mb-2 text-sm font-medium text-muted-foreground">
                    Previous Schools
                  </h5>
                  <div className="space-y-2">
                    {pastEnrolments.map((enrolment) => (
                      <div
                        key={enrolment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h6 className="text-sm font-medium">
                            {enrolment.school?.name || 'Unknown School'}
                          </h6>
                          <p className="text-xs text-muted-foreground">
                            {enrolment.enrolment_date && formatDate(enrolment.enrolment_date)}
                            {enrolment.enrolment_date && enrolment.expected_graduation && ' - '}
                            {enrolment.expected_graduation && formatDate(enrolment.expected_graduation)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditEnrolment(enrolment)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(enrolment)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* School Year Selection Dialog */}
      <Dialog open={schoolYearDialogOpen} onOpenChange={setSchoolYearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>School Terms - {selectedSchool?.name}</DialogTitle>
            <DialogDescription>
              Select a school year to manage its terms, or add a new year.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {schoolYears.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No school years set up yet. Add one to get started.
              </p>
            ) : (
              schoolYears.map((year) => (
                <Button
                  key={year.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleManageTerms(year)}
                >
                  <span>{year.year}</span>
                  <span className="text-muted-foreground text-sm">
                    {year.terms?.length || 0} terms
                  </span>
                </Button>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSchoolYearDialogOpen(false)}
            >
              Close
            </Button>
            {selectedSchool && (
              <Button
                className="flex-1"
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
            // Load the new year with empty terms array for the editor
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Enrolment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {member.name}&apos;s enrolment at{' '}
              {deletingEnrolment?.school?.name || 'this school'}? This will also delete
              all associated school fees for this enrolment. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
