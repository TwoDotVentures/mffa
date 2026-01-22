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
import { Switch } from '@/components/ui/switch';
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
  DAYS_OF_WEEK,
} from '@/lib/types';

interface ExtracurricularDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMember;
  activity?: Extracurricular;
  onSuccess?: (activity: Extracurricular) => void;
}

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

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

  // Load reference data
  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
  }, [open]);

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

  // Update form when activity changes (for editing)
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Activity' : 'Add Extracurricular Activity'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the activity details.'
              : `Add a new activity for ${member.name}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Activity Type and Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="activity_type_id"
                rules={{ required: 'Please select an activity type' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
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
                    <FormLabel>Activity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Soccer - U15 Dragons" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Provider and Venue */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club/Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Organization name" {...field} />
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
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Where the activity takes place" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Section */}
            <Accordion type="single" collapsible defaultValue="schedule">
              <AccordionItem value="schedule">
                <AccordionTrigger>Schedule</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Days of Week */}
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <label
                              key={day}
                              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-muted"
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="time_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Season Dates */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="season_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Season Starts</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Season Ends</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Costs Section */}
              <AccordionItem value="costs">
                <AccordionTrigger>Costs</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Recurring Cost */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cost_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurring Cost</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
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
                          <FormLabel>Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencies.map((freq) => (
                                <SelectItem key={freq.id} value={freq.id}>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="registration_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Fee</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
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
                          <FormLabel>Equipment Cost</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="uniform_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uniform Cost</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
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
                          <FormLabel>Other Costs</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
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
                        <FormLabel>Other Costs Description</FormLabel>
                        <FormControl>
                          <Input placeholder="What are the other costs for?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Contact Section */}
              <AccordionItem value="contact">
                <AccordionTrigger>Contact Information</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Coach/coordinator name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contact_phone"
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

                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@club.com" {...field} />
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
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://..." {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
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
                {isEditing ? 'Save Changes' : 'Add Activity'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
