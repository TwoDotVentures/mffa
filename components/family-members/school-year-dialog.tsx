/**
 * School Year Dialog Component
 *
 * Dialog for adding/editing school year records.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly inputs
 * - Responsive grid layouts
 *
 * @module components/family-members/school-year-dialog
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createSchoolYear, updateSchoolYear } from '@/lib/family-members/actions';
import type { School, SchoolYear, SchoolYearFormData } from '@/lib/types';

interface SchoolYearDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** School the year belongs to */
  school: School;
  /** School year to edit (undefined for create) */
  schoolYear?: SchoolYear;
  /** Callback on successful save */
  onSuccess?: (schoolYear: SchoolYear) => void;
}

/** Generate list of years (current year -2 to +3) */
function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear - 2; i <= currentYear + 3; i++) {
    years.push(i);
  }
  return years;
}

/**
 * School Year Dialog Component
 * Form dialog for creating and editing school years
 */
export function SchoolYearDialog({
  open,
  onOpenChange,
  school,
  schoolYear,
  onSuccess,
}: SchoolYearDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!schoolYear;
  const yearOptions = getYearOptions();

  const form = useForm<SchoolYearFormData>({
    defaultValues: {
      school_id: school.id,
      year: new Date().getFullYear(),
      year_start: '',
      year_end: '',
      notes: '',
    },
  });

  /** Update form when schoolYear changes (for editing) */
  useEffect(() => {
    if (schoolYear) {
      form.reset({
        school_id: school.id,
        year: schoolYear.year,
        year_start: schoolYear.year_start,
        year_end: schoolYear.year_end,
        notes: schoolYear.notes || '',
      });
    } else {
      const year = new Date().getFullYear();
      form.reset({
        school_id: school.id,
        year: year,
        year_start: `${year}-01-28`,
        year_end: `${year}-12-10`,
        notes: '',
      });
    }
  }, [schoolYear, school.id, form]);

  /** Update dates when year changes */
  const watchYear = form.watch('year');
  useEffect(() => {
    if (!isEditing && watchYear) {
      const currentStartDate = form.getValues('year_start');
      const currentEndDate = form.getValues('year_end');

      if (!currentStartDate || !currentStartDate.startsWith(String(watchYear))) {
        form.setValue('year_start', `${watchYear}-01-28`);
      }
      if (!currentEndDate || !currentEndDate.startsWith(String(watchYear))) {
        form.setValue('year_end', `${watchYear}-12-10`);
      }
    }
  }, [watchYear, form, isEditing]);

  /** Handle form submission */
  const onSubmit = async (data: SchoolYearFormData) => {
    setLoading(true);
    try {
      let result: SchoolYear;
      if (isEditing) {
        result = await updateSchoolYear(schoolYear.id, data);
      } else {
        result = await createSchoolYear(data);
      }
      onOpenChange(false);
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      console.error('Error saving school year:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[450px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit School Year' : 'Add School Year'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? `Update the ${schoolYear.year} academic year for ${school.name}.`
              : `Set up a new academic year for ${school.name}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form id="school-year-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Year */}
              <FormField
                control={form.control}
                name="year"
                rules={{ required: 'Year is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Academic Year</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={String(field.value)}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 text-sm sm:h-10">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)} className="py-2.5 sm:py-2">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year Start & End */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="year_start"
                  rules={{ required: 'Start date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Year Starts</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
                        First day of Term 1
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_end"
                  rules={{ required: 'End date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Year Ends</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
                        Last day of Term 4
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any notes about this school year..."
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
            form="school-year-form"
            disabled={loading}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add School Year'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
