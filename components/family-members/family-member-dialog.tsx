/**
 * Family Member Dialog Component
 *
 * Dialog for adding/editing family members with responsive form layout.
 * Mobile-first design with:
 * - Full-screen dialog on mobile devices
 * - Stacked form fields on small screens
 * - Large touch-friendly inputs
 * - Optimized keyboard navigation
 *
 * @module components/family-members/family-member-dialog
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
  DialogBody,
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
import { createFamilyMember, updateFamilyMember } from '@/lib/family-members/actions';
import type { FamilyMember, FamilyMemberFormData, RelationshipType, GenderType } from '@/lib/types';

interface FamilyMemberDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Member to edit (undefined for new member) */
  member?: FamilyMember;
}

/** Available member types */
const memberTypes = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
];

/** Available relationship types */
const relationships = [
  { value: 'self', label: 'Self (Primary Account Holder)' },
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

/** Available gender options */
const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * Family Member Dialog Component
 * Handles both adding new members and editing existing ones
 */
export function FamilyMemberDialog({ open, onOpenChange, member }: FamilyMemberDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!member;

  const form = useForm<FamilyMemberFormData>({
    defaultValues: {
      name: '',
      member_type: 'child',
      relationship: 'child',
      gender: undefined,
      date_of_birth: '',
      email: '',
      phone: '',
      medicare_number: '',
      notes: '',
    },
  });

  /** Reset form when member changes (edit mode) */
  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        member_type: member.member_type,
        relationship: (member.relationship || 'other') as RelationshipType,
        gender: (member.gender || undefined) as GenderType | undefined,
        date_of_birth: member.date_of_birth || '',
        email: member.email || '',
        phone: member.phone || '',
        medicare_number: member.medicare_number || '',
        notes: member.notes || '',
      });
    } else {
      form.reset({
        name: '',
        member_type: 'child',
        relationship: 'child',
        gender: undefined,
        date_of_birth: '',
        email: '',
        phone: '',
        medicare_number: '',
        notes: '',
      });
    }
  }, [member, form]);

  /** Handle form submission */
  const onSubmit = async (data: FamilyMemberFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateFamilyMember(member.id, data);
      } else {
        await createFamilyMember(data);
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving family member:', error);
    } finally {
      setLoading(false);
    }
  };

  const watchMemberType = form.watch('member_type');

  /** Auto-set relationship based on member type */
  useEffect(() => {
    if (!isEditing) {
      if (watchMemberType === 'child') {
        form.setValue('relationship', 'child');
      } else if (watchMemberType === 'adult' && form.getValues('relationship') === 'child') {
        form.setValue('relationship', 'spouse');
      }
    }
  }, [watchMemberType, form, isEditing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog Content - Full screen on mobile */}
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[500px] sm:rounded-lg">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Edit Family Member' : 'Add Family Member'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEditing
              ? 'Update the details for this family member.'
              : 'Add a new family member to track their information.'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter full name"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Member Type and Relationship - Stacked on mobile */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="member_type"
                  rules={{ required: 'Member type is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Member Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {memberTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="py-2.5 sm:py-2"
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relationship"
                  rules={{ required: 'Relationship is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Relationship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relationships.map((rel) => (
                            <SelectItem
                              key={rel.value}
                              value={rel.value}
                              className="py-2.5 sm:py-2"
                            >
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem
                              key={gender.value}
                              value={gender.value}
                              className="py-2.5 sm:py-2"
                            >
                              {gender.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information - Adults only */}
              {watchMemberType === 'adult' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="0400 000 000"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Medicare Number */}
              <FormField
                control={form.control}
                name="medicare_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Medicare Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Medicare card number (optional)"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] sm:text-xs">
                      Position on card included (e.g., 1234 56789 0-1)
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes..."
                        className="min-h-[80px] resize-none text-base sm:min-h-[72px] sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="flex flex-col-reverse gap-2 border-t bg-background p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6">
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
            disabled={loading}
            onClick={form.handleSubmit(onSubmit)}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
