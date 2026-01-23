/**
 * Enrolment Dialog Component
 *
 * Dialog for adding/editing school enrolment records.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly inputs
 * - Scrollable content area
 * - Responsive grid layouts
 *
 * @module components/family-members/enrolment-dialog
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import {
  createEnrolment,
  updateEnrolment,
  getSchools,
} from '@/lib/family-members/actions';
import { SchoolDialog } from './school-dialog';
import type {
  FamilyMember,
  School,
  SchoolEnrolment,
  SchoolEnrolmentFormData,
} from '@/lib/types';

interface EnrolmentDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Family member to enrol */
  member: FamilyMember;
  /** Enrolment to edit (undefined for create) */
  enrolment?: SchoolEnrolment;
  /** Callback on successful save */
  onSuccess?: (enrolment: SchoolEnrolment) => void;
}

/** Year levels for Australian schools */
const yearLevels = [
  'Prep',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
];

/**
 * Enrolment Dialog Component
 * Form dialog for creating and editing school enrolments
 */
export function EnrolmentDialog({
  open,
  onOpenChange,
  member,
  enrolment,
  onSuccess,
}: EnrolmentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const isEditing = !!enrolment;

  const form = useForm<SchoolEnrolmentFormData>({
    defaultValues: {
      family_member_id: member.id,
      school_id: '',
      year_level: undefined,
      enrolment_date: '',
      expected_graduation: '',
      student_id: '',
      house: '',
      is_current: true,
      notes: '',
    },
  });

  /** Load schools when dialog opens */
  useEffect(() => {
    if (open) {
      loadSchools();
    }
  }, [open]);

  /** Fetch schools from server */
  async function loadSchools() {
    try {
      const data = await getSchools();
      setSchools(data);
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  }

  /** Update form when enrolment changes */
  useEffect(() => {
    if (enrolment) {
      form.reset({
        family_member_id: member.id,
        school_id: enrolment.school_id,
        year_level: enrolment.year_level || undefined,
        enrolment_date: enrolment.enrolment_date || '',
        expected_graduation: enrolment.expected_graduation || '',
        student_id: enrolment.student_id || '',
        house: enrolment.house || '',
        is_current: enrolment.is_current,
        notes: enrolment.notes || '',
      });
    } else {
      form.reset({
        family_member_id: member.id,
        school_id: '',
        year_level: undefined,
        enrolment_date: new Date().toISOString().split('T')[0],
        expected_graduation: '',
        student_id: '',
        house: '',
        is_current: true,
        notes: '',
      });
    }
  }, [enrolment, member.id, form]);

  /** Handle form submission */
  const onSubmit = async (data: SchoolEnrolmentFormData) => {
    setLoading(true);
    try {
      let result: SchoolEnrolment;
      if (isEditing) {
        result = await updateEnrolment(enrolment.id, data);
      } else {
        result = await createEnrolment(data);
      }
      onOpenChange(false);
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      console.error('Error saving enrolment:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Handle new school creation */
  const handleSchoolCreated = (school: School) => {
    setSchools((prev) => [...prev, school]);
    form.setValue('school_id', school.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[500px]">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6">
            <DialogTitle className="text-lg">
              {isEditing ? 'Edit Enrolment' : 'Enrol in School'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing
                ? `Update ${member.name}'s school enrolment details.`
                : `Enrol ${member.name} in a school.`}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Form {...form}>
              <form id="enrolment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* School Selection */}
                <FormField
                  control={form.control}
                  name="school_id"
                  rules={{ required: 'Please select a school' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">School</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isEditing}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 flex-1 text-sm sm:h-10">
                              <SelectValue placeholder="Select a school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools.map((school) => (
                              <SelectItem key={school.id} value={school.id} className="py-2.5 sm:py-2">
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0 sm:h-10 sm:w-10"
                            onClick={() => setSchoolDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Year Level and Student ID */}
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="year_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Current Year Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 text-sm sm:h-10">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yearLevels.map((level) => (
                              <SelectItem key={level} value={level} className="py-2.5 sm:py-2">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Student ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="School's student ID"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Enrolment Date and Expected Graduation */}
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="enrolment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Enrolment Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          When they started at this school
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expected_graduation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Expected Graduation</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          When they expect to finish
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* House */}
                <FormField
                  control={form.control}
                  name="house"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">School House</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Griffith, Wilkins"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
                        If the school uses a house system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Enrolment Toggle */}
                <FormField
                  control={form.control}
                  name="is_current"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs sm:text-sm">Current Enrolment</FormLabel>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Is {member.name} currently enrolled at this school?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any notes about this enrolment..."
                          className="resize-none text-base sm:text-sm"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {/* Footer */}
          <DialogFooter className="flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:gap-3 sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="enrolment-form"
              disabled={loading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Enrol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Dialog */}
      <SchoolDialog
        open={schoolDialogOpen}
        onOpenChange={setSchoolDialogOpen}
        onSuccess={handleSchoolCreated}
      />
    </>
  );
}
