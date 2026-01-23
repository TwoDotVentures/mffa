/**
 * School Fee Dialog Component
 *
 * Dialog for adding/editing school fee records.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly inputs
 * - Scrollable content area
 * - Responsive grid layouts
 *
 * @module components/family-members/school-fee-dialog
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  createSchoolFee,
  updateSchoolFee,
  getFeeTypes,
  getFrequencies,
} from '@/lib/family-members/actions';
import type {
  SchoolEnrolment,
  SchoolFee,
  SchoolFeeFormData,
  FeeType,
  Frequency,
  SchoolTerm,
} from '@/lib/types';

interface SchoolFeeDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Enrolment to add fee for */
  enrolment: SchoolEnrolment;
  /** Fee to edit (undefined for create) */
  fee?: SchoolFee;
  /** Callback on successful save */
  onSuccess?: (fee: SchoolFee) => void;
}

/**
 * School Fee Dialog Component
 * Form dialog for creating and editing fees
 */
export function SchoolFeeDialog({
  open,
  onOpenChange,
  enrolment,
  fee,
  onSuccess,
}: SchoolFeeDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [schoolTerms, setSchoolTerms] = useState<SchoolTerm[]>([]);
  const [dueDateMode, setDueDateMode] = useState<'specific' | 'term'>('specific');
  const isEditing = !!fee;

  const form = useForm<SchoolFeeFormData>({
    defaultValues: {
      enrolment_id: enrolment.id,
      fee_type_id: '',
      frequency_id: '',
      description: '',
      amount: 0,
      due_date: '',
      school_term_id: undefined,
      year: new Date().getFullYear(),
      notes: '',
    },
  });

  /** Load reference data */
  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
  }, [open]);

  /** Fetch fee types and frequencies */
  async function loadReferenceData() {
    try {
      const [types, freqs] = await Promise.all([
        getFeeTypes(),
        getFrequencies(),
      ]);
      setFeeTypes(types);
      setFrequencies(freqs);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }

  /** Update form when fee changes */
  useEffect(() => {
    if (fee) {
      form.reset({
        enrolment_id: enrolment.id,
        fee_type_id: fee.fee_type_id,
        frequency_id: fee.frequency_id,
        description: fee.description,
        amount: fee.amount,
        due_date: fee.due_date || '',
        school_term_id: fee.school_term_id || undefined,
        year: fee.year,
        notes: fee.notes || '',
      });
      setDueDateMode(fee.school_term_id ? 'term' : 'specific');
    } else {
      form.reset({
        enrolment_id: enrolment.id,
        fee_type_id: '',
        frequency_id: '',
        description: '',
        amount: 0,
        due_date: '',
        school_term_id: undefined,
        year: new Date().getFullYear(),
        notes: '',
      });
      setDueDateMode('specific');
    }
  }, [fee, enrolment.id, form]);

  /** Auto-generate description when fee type changes */
  const watchFeeType = form.watch('fee_type_id');
  const watchYear = form.watch('year');
  useEffect(() => {
    if (watchFeeType && !isEditing) {
      const selectedType = feeTypes.find((t) => t.id === watchFeeType);
      if (selectedType) {
        form.setValue('description', `${selectedType.name} ${watchYear}`);
      }
    }
  }, [watchFeeType, watchYear, feeTypes, form, isEditing]);

  /** Update due date when term changes */
  const watchTermId = form.watch('school_term_id');
  useEffect(() => {
    if (watchTermId && dueDateMode === 'term') {
      const selectedTerm = schoolTerms.find((t) => t.id === watchTermId);
      if (selectedTerm?.fees_due_date) {
        form.setValue('due_date', selectedTerm.fees_due_date);
      }
    }
  }, [watchTermId, schoolTerms, dueDateMode, form]);

  /** Handle form submission */
  const onSubmit = async (data: SchoolFeeFormData) => {
    setLoading(true);
    try {
      if (dueDateMode === 'specific') {
        data.school_term_id = undefined;
      }

      let result: SchoolFee;
      if (isEditing) {
        result = await updateSchoolFee(fee.id, data);
      } else {
        result = await createSchoolFee(data);
      }
      onOpenChange(false);
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      console.error('Error saving fee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[500px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">{isEditing ? 'Edit School Fee' : 'Add School Fee'}</DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Update the fee details.'
              : `Add a new fee for ${enrolment.school?.name || 'this school'}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form id="school-fee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Fee Type */}
              <FormField
                control={form.control}
                name="fee_type_id"
                rules={{ required: 'Please select a fee type' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Fee Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-sm sm:h-10">
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeTypes.map((type) => (
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Term 1 Tuition 2026"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount and Frequency */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  rules={{
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Amount</FormLabel>
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
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency_id"
                  rules={{ required: 'Please select a frequency' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

              {/* Due Date Mode */}
              <div className="space-y-3">
                <FormLabel className="text-xs sm:text-sm">Due Date</FormLabel>
                <RadioGroup
                  value={dueDateMode}
                  onValueChange={(value: string) => setDueDateMode(value as 'specific' | 'term')}
                  className="flex flex-wrap gap-3 sm:gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific" className="text-sm">Specific date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="term" id="term" disabled={schoolTerms.length === 0} />
                    <Label htmlFor="term" className={`text-sm ${schoolTerms.length === 0 ? 'text-muted-foreground' : ''}`}>
                      Link to term
                    </Label>
                  </div>
                </RadioGroup>

                {dueDateMode === 'specific' ? (
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
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
                ) : (
                  <FormField
                    control={form.control}
                    name="school_term_id"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-11 text-sm sm:h-10">
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schoolTerms.map((term) => (
                              <SelectItem key={term.id} value={term.id} className="py-2.5 sm:py-2">
                                {term.name}
                                {term.fees_due_date && (
                                  <span className="ml-2 text-muted-foreground">
                                    (Due: {new Date(term.fees_due_date).toLocaleDateString('en-AU')})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Fee due date will be set from the term
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Year */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Financial Year</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 text-sm sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          new Date().getFullYear() - 1,
                          new Date().getFullYear(),
                          new Date().getFullYear() + 1,
                        ].map((year) => (
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

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Invoice number, payment reference, etc."
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
            form="school-fee-form"
            disabled={loading}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Fee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
