/**
 * School Dialog Component
 *
 * Dialog for adding/editing school records.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly inputs
 * - Scrollable content area
 * - Responsive grid layouts
 *
 * @module components/family-members/school-dialog
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
import { createSchool, updateSchool } from '@/lib/family-members/actions';
import type { School, SchoolFormData, SchoolType, SchoolSector } from '@/lib/types';

interface SchoolDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** School to edit (undefined for create) */
  school?: School;
  /** Callback on successful save */
  onSuccess?: (school: School) => void;
}

/** Available school types */
const schoolTypes: { value: SchoolType; label: string }[] = [
  { value: 'preschool', label: 'Preschool/Kindy' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'combined', label: 'Combined (K-12)' },
  { value: 'tertiary', label: 'Tertiary' },
  { value: 'other', label: 'Other' },
];

/** Available school sectors */
const schoolSectors: { value: SchoolSector; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'independent', label: 'Independent' },
  { value: 'private', label: 'Private' },
  { value: 'other', label: 'Other' },
];

/** Australian states for dropdown */
const australianStates = [
  { value: 'QLD', label: 'Queensland' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
];

/**
 * School Dialog Component
 * Form dialog for creating and editing schools
 */
export function SchoolDialog({ open, onOpenChange, school, onSuccess }: SchoolDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!school;

  const form = useForm<SchoolFormData>({
    defaultValues: {
      name: '',
      school_type: 'primary',
      sector: undefined,
      address: '',
      suburb: '',
      state: 'QLD',
      postcode: '',
      phone: '',
      email: '',
      website: '',
      notes: '',
    },
  });

  /** Update form when school changes */
  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name,
        school_type: school.school_type,
        sector: school.sector || undefined,
        address: school.address || '',
        suburb: school.suburb || '',
        state: school.state || 'QLD',
        postcode: school.postcode || '',
        phone: school.phone || '',
        email: school.email || '',
        website: school.website || '',
        notes: school.notes || '',
      });
    } else {
      form.reset({
        name: '',
        school_type: 'primary',
        sector: undefined,
        address: '',
        suburb: '',
        state: 'QLD',
        postcode: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
      });
    }
  }, [school, form]);

  /** Handle form submission */
  const onSubmit = async (data: SchoolFormData) => {
    setLoading(true);
    try {
      let result: School;
      if (isEditing) {
        result = await updateSchool(school.id, data);
      } else {
        result = await createSchool(data);
      }
      onOpenChange(false);
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      console.error('Error saving school:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[550px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">{isEditing ? 'Edit School' : 'Add School'}</DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Update the school details.'
              : 'Add a new school to enrol family members.'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'School name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">School Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Brisbane Grammar School"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type and Sector */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="school_type"
                  rules={{ required: 'School type is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">School Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-sm sm:h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schoolTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="py-2.5 sm:py-2">
                              {type.label}
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
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Sector</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 text-sm sm:h-10">
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schoolSectors.map((sector) => (
                            <SelectItem key={sector.value} value={sector.value} className="py-2.5 sm:py-2">
                              {sector.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Street Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Street address"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Suburb, State, Postcode - Stack on mobile */}
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Suburb</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Suburb"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'QLD'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 text-sm sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {australianStates.map((state) => (
                            <SelectItem key={state.value} value={state.value} className="py-2.5 sm:py-2">
                              {state.value}
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
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Postcode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="4000"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact: Phone & Email */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(07) 1234 5678"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@school.edu.au"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Website */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://www.school.edu.au"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Any additional notes about the school..."
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
            form="school-form"
            disabled={loading}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add School'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
