/**
 * School Terms Editor Component
 *
 * Dialog for managing school term dates and fee due dates.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Compact term cards
 * - Touch-friendly date inputs
 * - Responsive grid layouts
 *
 * @module components/family-members/school-terms-editor
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createSchoolTermsBulk,
  updateSchoolTerm,
  deleteSchoolTerm,
  getSchoolTerms,
} from '@/lib/family-members/actions';
import type { SchoolYear, SchoolTerm, TermType, SchoolTermFormData } from '@/lib/types';

interface SchoolTermsEditorProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** School year to edit terms for */
  schoolYear: SchoolYear;
  /** Callback on successful save */
  onSuccess?: () => void;
}

interface TermFormValues {
  terms: {
    id?: string;
    term_type: TermType;
    term_number: number;
    name: string;
    start_date: string;
    end_date: string;
    fees_due_date: string;
  }[];
}

/** Term type options */
const termTypes: { value: TermType; label: string }[] = [
  { value: 'term', label: 'Term' },
  { value: 'semester', label: 'Semester' },
  { value: 'trimester', label: 'Trimester' },
  { value: 'quarter', label: 'Quarter' },
];

/** Default term structures for Australian schools */
const defaultTermStructures = {
  term: [
    { term_number: 1, name: 'Term 1', startWeek: 4, endWeek: 14, feesDueBefore: 2 },
    { term_number: 2, name: 'Term 2', startWeek: 16, endWeek: 26, feesDueBefore: 2 },
    { term_number: 3, name: 'Term 3', startWeek: 28, endWeek: 38, feesDueBefore: 2 },
    { term_number: 4, name: 'Term 4', startWeek: 40, endWeek: 50, feesDueBefore: 2 },
  ],
  semester: [
    { term_number: 1, name: 'Semester 1', startWeek: 4, endWeek: 26, feesDueBefore: 2 },
    { term_number: 2, name: 'Semester 2', startWeek: 28, endWeek: 50, feesDueBefore: 2 },
  ],
  trimester: [
    { term_number: 1, name: 'Trimester 1', startWeek: 4, endWeek: 17, feesDueBefore: 2 },
    { term_number: 2, name: 'Trimester 2', startWeek: 19, endWeek: 33, feesDueBefore: 2 },
    { term_number: 3, name: 'Trimester 3', startWeek: 35, endWeek: 50, feesDueBefore: 2 },
  ],
  quarter: [
    { term_number: 1, name: 'Quarter 1', startWeek: 1, endWeek: 13, feesDueBefore: 1 },
    { term_number: 2, name: 'Quarter 2', startWeek: 14, endWeek: 26, feesDueBefore: 1 },
    { term_number: 3, name: 'Quarter 3', startWeek: 27, endWeek: 39, feesDueBefore: 1 },
    { term_number: 4, name: 'Quarter 4', startWeek: 40, endWeek: 52, feesDueBefore: 1 },
  ],
};

/** Convert week number to date string */
function getWeekDate(year: number, week: number): string {
  const jan1 = new Date(year, 0, 1);
  const days = (week - 1) * 7;
  const targetDate = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split('T')[0];
}

/**
 * School Terms Editor Component
 * Form dialog for managing school terms
 */
export function SchoolTermsEditor({
  open,
  onOpenChange,
  schoolYear,
  onSuccess,
}: SchoolTermsEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTermType, setSelectedTermType] = useState<TermType>('term');
  const [existingTerms, setExistingTerms] = useState<SchoolTerm[]>([]);

  const form = useForm<TermFormValues>({
    defaultValues: {
      terms: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'terms',
  });

  /** Load existing terms when dialog opens */
  useEffect(() => {
    if (open && schoolYear) {
      loadExistingTerms();
    }
  }, [open, schoolYear]);

  /** Fetch existing terms from server */
  async function loadExistingTerms() {
    try {
      const terms = await getSchoolTerms(schoolYear.id);
      setExistingTerms(terms);

      if (terms.length > 0) {
        setSelectedTermType(terms[0].term_type);
        replace(
          terms.map((t) => ({
            id: t.id,
            term_type: t.term_type,
            term_number: t.term_number,
            name: t.name || `${t.term_type === 'term' ? 'Term' : t.term_type} ${t.term_number}`,
            start_date: t.start_date,
            end_date: t.end_date,
            fees_due_date: t.fees_due_date || '',
          }))
        );
      } else {
        generateDefaultTerms('term');
      }
    } catch (error) {
      console.error('Error loading terms:', error);
    }
  }

  /** Generate default term structure */
  function generateDefaultTerms(termType: TermType) {
    const structure = defaultTermStructures[termType];
    const year = schoolYear.year;

    const newTerms = structure.map((s) => ({
      term_type: termType,
      term_number: s.term_number,
      name: s.name,
      start_date: getWeekDate(year, s.startWeek),
      end_date: getWeekDate(year, s.endWeek),
      fees_due_date: getWeekDate(year, s.startWeek - s.feesDueBefore),
    }));

    replace(newTerms);
    setSelectedTermType(termType);
  }

  /** Handle term type change */
  function handleTermTypeChange(termType: TermType) {
    if (termType !== selectedTermType) {
      generateDefaultTerms(termType);
    }
  }

  /** Add new term */
  function addTerm() {
    const lastTerm = fields[fields.length - 1];
    const nextNumber = lastTerm ? lastTerm.term_number + 1 : 1;
    const termLabel =
      selectedTermType === 'term'
        ? 'Term'
        : selectedTermType === 'semester'
        ? 'Semester'
        : selectedTermType === 'trimester'
        ? 'Trimester'
        : 'Quarter';

    append({
      term_type: selectedTermType,
      term_number: nextNumber,
      name: `${termLabel} ${nextNumber}`,
      start_date: '',
      end_date: '',
      fees_due_date: '',
    });
  }

  /** Handle form submission */
  const onSubmit = async (data: TermFormValues) => {
    setLoading(true);
    try {
      const existingIds = existingTerms.map((t) => t.id);
      const newTerms: SchoolTermFormData[] = [];
      const updates: { id: string; data: Partial<SchoolTermFormData> }[] = [];
      const currentIds: string[] = [];

      for (const term of data.terms) {
        if (term.id) {
          currentIds.push(term.id);
          updates.push({
            id: term.id,
            data: {
              term_type: term.term_type,
              term_number: term.term_number,
              name: term.name,
              start_date: term.start_date,
              end_date: term.end_date,
              fees_due_date: term.fees_due_date || undefined,
            },
          });
        } else {
          newTerms.push({
            school_year_id: schoolYear.id,
            term_type: term.term_type,
            term_number: term.term_number,
            name: term.name,
            start_date: term.start_date,
            end_date: term.end_date,
            fees_due_date: term.fees_due_date || undefined,
          });
        }
      }

      const toDelete = existingIds.filter((id) => !currentIds.includes(id));

      const promises: Promise<any>[] = [];

      if (newTerms.length > 0) {
        promises.push(createSchoolTermsBulk(newTerms));
      }

      for (const update of updates) {
        promises.push(updateSchoolTerm(update.id, update.data));
      }

      for (const id of toDelete) {
        promises.push(deleteSchoolTerm(id));
      }

      await Promise.all(promises);

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Error saving terms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[700px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">School Terms - {schoolYear.year}</DialogTitle>
          <DialogDescription className="text-sm">
            Set up the term dates and fee due dates for {schoolYear.school?.name || 'this school'}.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Form {...form}>
            <form id="terms-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Term Type Selection */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <FormLabel className="shrink-0 text-xs sm:text-sm">Term Structure:</FormLabel>
                <Select
                  value={selectedTermType}
                  onValueChange={(value) => handleTermTypeChange(value as TermType)}
                >
                  <SelectTrigger className="h-11 w-full text-sm sm:h-10 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="py-2.5 sm:py-2">
                        {type.label}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  ({fields.length} {selectedTermType}s)
                </span>
              </div>

              {/* Terms List */}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="overflow-hidden">
                    <CardHeader className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center justify-between">
                        <FormField
                          control={form.control}
                          name={`terms.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-8 border-0 bg-transparent p-0 text-sm font-semibold focus-visible:ring-0 sm:h-auto sm:text-base"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                        <FormField
                          control={form.control}
                          name={`terms.${index}.start_date`}
                          rules={{ required: 'Start date required' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground sm:text-xs">
                                Start Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  className="h-10 text-base sm:h-9 sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`terms.${index}.end_date`}
                          rules={{ required: 'End date required' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground sm:text-xs">
                                End Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  className="h-10 text-base sm:h-9 sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`terms.${index}.fees_due_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground sm:text-xs">
                                Fees Due Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  className="h-10 text-base sm:h-9 sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Term Button */}
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:h-10"
                onClick={addTerm}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add{' '}
                {selectedTermType === 'term'
                  ? 'Term'
                  : selectedTermType === 'semester'
                  ? 'Semester'
                  : selectedTermType === 'trimester'
                  ? 'Trimester'
                  : 'Quarter'}
              </Button>
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
            form="terms-form"
            disabled={loading}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Terms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
