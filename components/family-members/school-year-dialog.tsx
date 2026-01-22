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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School;
  schoolYear?: SchoolYear;
  onSuccess?: (schoolYear: SchoolYear) => void;
}

// Generate list of years (current year -2 to +3)
function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear - 2; i <= currentYear + 3; i++) {
    years.push(i);
  }
  return years;
}

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

  // Update form when schoolYear changes (for editing)
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
      // Set default dates for the selected year
      const year = new Date().getFullYear();
      form.reset({
        school_id: school.id,
        year: year,
        year_start: `${year}-01-28`, // Late January is typical for Australian schools
        year_end: `${year}-12-10`, // Early December
        notes: '',
      });
    }
  }, [schoolYear, school.id, form]);

  // Update dates when year changes
  const watchYear = form.watch('year');
  useEffect(() => {
    if (!isEditing && watchYear) {
      const currentStartDate = form.getValues('year_start');
      const currentEndDate = form.getValues('year_end');

      // Only update if the year in the date doesn't match the selected year
      if (!currentStartDate || !currentStartDate.startsWith(String(watchYear))) {
        form.setValue('year_start', `${watchYear}-01-28`);
      }
      if (!currentEndDate || !currentEndDate.startsWith(String(watchYear))) {
        form.setValue('year_end', `${watchYear}-12-10`);
      }
    }
  }, [watchYear, form, isEditing]);

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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit School Year' : 'Add School Year'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the ${schoolYear.year} academic year for ${school.name}.`
              : `Set up a new academic year for ${school.name}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Year */}
            <FormField
              control={form.control}
              name="year"
              rules={{ required: 'Year is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={String(field.value)}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="year_start"
                rules={{ required: 'Start date is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Starts</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
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
                    <FormLabel>Year Ends</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about this school year..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add School Year'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
