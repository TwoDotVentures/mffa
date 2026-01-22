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
import { createFamilyMember, updateFamilyMember } from '@/lib/family-members/actions';
import type { FamilyMember, FamilyMemberFormData } from '@/lib/types';

interface FamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember;
}

const memberTypes = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
];

const relationships = [
  { value: 'self', label: 'Self (Primary Account Holder)' },
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

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

  // Update form when member changes (for editing)
  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        member_type: member.member_type,
        relationship: (member.relationship || 'other') as any,
        gender: (member.gender || undefined) as any,
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

  // Auto-set relationship when member type changes
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this family member.'
              : 'Add a new family member to track their information.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Type and Relationship */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="member_type"
                rules={{ required: 'Member type is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {memberTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
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
                name="relationship"
                rules={{ required: 'Relationship is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationships.map((rel) => (
                          <SelectItem key={rel.value} value={rel.value}>
                            {rel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genders.map((gender) => (
                          <SelectItem key={gender.value} value={gender.value}>
                            {gender.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information (for adults) */}
            {watchMemberType === 'adult' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0400 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
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
                  <FormLabel>Medicare Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Medicare card number (optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Position on card included (e.g., 1234 56789 0-1)
                  </FormDescription>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="resize-none"
                      rows={3}
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
                {isEditing ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
