/**
 * Extracurricular Dialog Component
 *
 * Dialog for adding/editing extracurricular activity records.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly inputs
 * - Collapsible accordion sections
 * - Responsive grid layouts
 *
 * @module components/family-members/extracurricular-dialog
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import {
  createExtracurricular,
  updateExtracurricular,
  getActivityTypes,
  getFrequencies,
} from '@/lib/family-members/actions';
import type {
  FamilyMember,
  Extracurricular,
  ExtracurricularFormData,
  ActivityType,
  Frequency,
} from '@/lib/types';

interface ExtracurricularDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Family member the activity is for */
  member: FamilyMember;
  /** Activity to edit (undefined for create) */
  activity?: Extracurricular;
  /** Callback on successful save */
  onSuccess?: (activity: Extracurricular) => void;
}

/** Days of the week */
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Extracurricular Dialog Component
 * Form dialog for creating and editing activities
 */
export function ExtracurricularDialog({
  open,
  onOpenChange,
  member,
  activity,
  onSuccess,
}: ExtracurricularDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const isEditing = !!activity;

  const form = useForm<ExtracurricularFormData>({
    defaultValues: {
      family_member_id: member.id,
      activity_type_id: '',
      name: '',
      provider: '',
      venue: '',
      day_of_week: [],
      time_start: '',
      time_end: '',
      season_start: '',
      season_end: '',
      cost_amount: undefined,
      cost_frequency_id: undefined,
      registration_fee: undefined,
      equipment_cost: undefined,
      uniform_cost: undefined,
      other_costs: undefined,
      other_costs_description: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      website: '',
      notes: '',
    },
  });

  /** Load reference data when dialog opens */
  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
  }, [open]);

  /** Fetch activity types and frequencies */
  async function loadReferenceData() {
    try {
      const [types, freqs] = await Promise.all([
        getActivityTypes(),
        getFrequencies(),
      ]);
      setActivityTypes(types);
      setFrequencies(freqs);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }

  /** Update form when activity changes */
  useEffect(() => {
    if (activity) {
      form.reset({
        family_member_id: member.id,
        activity_type_id: activity.activity_type_id,
        name: activity.name,
        provider: activity.provider || '',
        venue: activity.venue || '',
        day_of_week: activity.day_of_week || [],
        time_start: activity.time_start || '',
        time_end: activity.time_end || '',
        season_start: activity.season_start || '',
        season_end: activity.season_end || '',
        cost_amount: activity.cost_amount || undefined,
        cost_frequency_id: activity.cost_frequency_id || undefined,
        registration_fee: activity.registration_fee || undefined,
        equipment_cost: activity.equipment_cost || undefined,
        uniform_cost: activity.uniform_cost || undefined,
        other_costs: activity.other_costs || undefined,
        other_costs_description: activity.other_costs_description || '',
        contact_name: activity.contact_name || '',
        contact_phone: activity.contact_phone || '',
        contact_email: activity.contact_email || '',
        website: activity.website || '',
        notes: activity.notes || '',
      });
    } else {
      form.reset({
        family_member_id: member.id,
        activity_type_id: '',
        name: '',
        provider: '',
        venue: '',
        day_of_week: [],
        time_start: '',
        time_end: '',
        season_start: '',
        season_end: '',
        cost_amount: undefined,
        cost_frequency_id: undefined,
        registration_fee: undefined,
        equipment_cost: undefined,
        uniform_cost: undefined,
        other_costs: undefined,
        other_costs_description: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        notes: '',
      });
    }
  }, [activity, member.id, form]);

  /** Handle form submission */
  const onSubmit = async (data: ExtracurricularFormData) => {
    setLoading(true);
    try {
      let result: Extracurricular;
      if (isEditing) {
        result = await updateExtracurricular(activity.id, data);
      } else {
        result = await createExtracurricular(data);
      }
      onOpenChange(false);
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[600px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit Activity' : 'Add Extracurricular Activity'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Update the activity details.'
              : `Add a new activity for ${member.name}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form id="extracurricular-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Activity Type and Name */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="activity_type_id"
                  rules={{ required: 'Please select an activity type' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Activity Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-sm sm:h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="py-2.5 sm:py-2">
                              {type.name}
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
                  name="name"
                  rules={{ required: 'Activity name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Activity Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Soccer - U15 Dragons"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Provider and Venue */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Club/Provider</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Organization name"
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
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Venue</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Where the activity takes place"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Accordion Sections */}
              <Accordion type="single" collapsible defaultValue="schedule" className="w-full">
                {/* Schedule Section */}
                <AccordionItem value="schedule" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="py-3 text-sm font-medium sm:py-4 sm:text-base">
                    Schedule
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    {/* Days of Week */}
                    <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Days</FormLabel>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {daysOfWeek.map((day) => (
                              <label
                                key={day}
                                className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs hover:bg-muted sm:py-1 sm:text-sm"
                              >
                                <Checkbox
                                  checked={field.value?.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, day]);
                                    } else {
                                      field.onChange(current.filter((d) => d !== day));
                                    }
                                  }}
                                />
                                {day.slice(0, 3)}
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Time */}
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="time_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Start Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
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
                        name="time_end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">End Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                className="h-11 text-base sm:h-10 sm:text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Season Dates */}
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="season_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Season Starts</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
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
                        name="season_end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Season Ends</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-11 text-base sm:h-10 sm:text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Costs Section */}
                <AccordionItem value="costs" className="border rounded-lg px-3 sm:px-4 mt-2">
                  <AccordionTrigger className="py-3 text-sm font-medium sm:py-4 sm:text-base">
                    Costs
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    {/* Recurring Cost */}
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="cost_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Recurring Cost</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cost_frequency_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Frequency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 text-sm sm:h-10">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {frequencies.map((freq) => (
                                  <SelectItem key={freq.id} value={freq.id} className="py-2.5 sm:py-2">
                                    {freq.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* One-time Costs */}
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="registration_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Registration Fee</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="equipment_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Equipment Cost</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="uniform_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Uniform Cost</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="other_costs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Other Costs</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="other_costs_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Other Costs Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What are the other costs for?"
                              className="h-11 text-base sm:h-10 sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Contact Section */}
                <AccordionItem value="contact" className="border rounded-lg px-3 sm:px-4 mt-2">
                  <AccordionTrigger className="py-3 text-sm font-medium sm:py-4 sm:text-base">
                    Contact Information
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <FormField
                      control={form.control}
                      name="contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Contact Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Coach/coordinator name"
                              className="h-11 text-base sm:h-10 sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="0400 000 000"
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
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@club.com"
                                className="h-11 text-base sm:h-10 sm:text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Website</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://..."
                              className="h-11 text-base sm:h-10 sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes..."
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
            form="extracurricular-form"
            disabled={loading}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
