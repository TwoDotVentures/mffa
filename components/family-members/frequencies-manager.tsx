/**
 * Frequencies Manager Component
 *
 * Manages payment frequency options for fees and activities.
 * Mobile-first responsive design with:
 * - Card-based mobile layout, table on desktop
 * - Touch-friendly action buttons
 * - Full-screen dialogs on mobile
 * - Responsive grid layouts
 *
 * @module components/family-members/frequencies-manager
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  getFrequencies,
  createFrequency,
  updateFrequency,
  deleteFrequency,
} from '@/lib/family-members/actions';
import { createClient } from '@/lib/supabase/client';
import type { Frequency, FrequencyFormData } from '@/lib/types';

/**
 * Frequencies Manager Component
 * Admin interface for managing payment frequency options
 */
export function FrequenciesManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFreq, setEditingFreq] = useState<Frequency | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFreq, setDeletingFreq] = useState<Frequency | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const form = useForm<FrequencyFormData>({
    defaultValues: {
      name: '',
      description: '',
      per_year_multiplier: undefined,
      sort_order: 50,
    },
  });

  /** Load frequencies on mount */
  useEffect(() => {
    loadFrequencies();
  }, []);

  /** Fetch frequencies from server */
  async function loadFrequencies() {
    try {
      setLoading(true);
      const data = await getFrequencies();
      setFrequencies(data);
    } catch (error) {
      console.error('Error loading frequencies:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open add dialog */
  function handleAdd() {
    setEditingFreq(null);
    form.reset({
      name: '',
      description: '',
      per_year_multiplier: undefined,
      sort_order: 50,
    });
    setDialogOpen(true);
  }

  /** Open edit dialog */
  function handleEdit(freq: Frequency) {
    setEditingFreq(freq);
    form.reset({
      name: freq.name,
      description: freq.description || '',
      per_year_multiplier: freq.per_year_multiplier || undefined,
      sort_order: freq.sort_order,
    });
    setDialogOpen(true);
  }

  /** Show delete confirmation */
  function handleDeleteClick(freq: Frequency) {
    setDeletingFreq(freq);
    setDeleteDialogOpen(true);
  }

  /** Handle form submission */
  async function onSubmit(data: FrequencyFormData) {
    setActionLoading(true);
    try {
      if (editingFreq) {
        await updateFrequency(editingFreq.id, data);
      } else {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await createFrequency(user.id, data);
      }
      await loadFrequencies();
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving frequency:', error);
    } finally {
      setActionLoading(false);
    }
  }

  /** Execute delete */
  async function handleDelete() {
    if (!deletingFreq) return;

    setActionLoading(true);
    try {
      await deleteFrequency(deletingFreq.id);
      await loadFrequencies();
      setDeleteDialogOpen(false);
      setDeletingFreq(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting frequency:', error);
    } finally {
      setActionLoading(false);
    }
  }

  const systemFreqs = frequencies.filter((f) => f.is_system);
  const customFreqs = frequencies.filter((f) => !f.is_system);

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {/* Header - Stack on mobile */}
        <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Payment Frequencies
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage payment frequency options for fees and activities
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Frequency
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:space-y-6 sm:p-6 sm:pt-0">
          {/* System Frequencies */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
              System Defaults (cannot be deleted)
            </h4>

            {/* Mobile Card View */}
            <div className="space-y-2 sm:hidden">
              {systemFreqs.map((freq) => (
                <div
                  key={freq.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{freq.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {freq.per_year_multiplier ? `×${freq.per_year_multiplier}/year` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-md border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Per Year Multiplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemFreqs.map((freq) => (
                    <TableRow key={freq.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{freq.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {freq.description || '-'}
                      </TableCell>
                      <TableCell>
                        {freq.per_year_multiplier ? `×${freq.per_year_multiplier}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Custom Frequencies */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
              Your Custom Frequencies
            </h4>
            {customFreqs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No custom frequencies yet. Click &quot;Add Frequency&quot; to create one.
              </p>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="space-y-2 sm:hidden">
                  {customFreqs.map((freq) => (
                    <div
                      key={freq.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{freq.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {freq.per_year_multiplier ? `×${freq.per_year_multiplier}/year` : '-'}
                          {freq.description && ` • ${freq.description}`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[120px]">
                          <DropdownMenuItem onClick={() => handleEdit(freq)} className="gap-2 py-2.5">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(freq)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden overflow-hidden rounded-md border sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Per Year Multiplier</TableHead>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customFreqs.map((freq) => (
                        <TableRow key={freq.id}>
                          <TableCell className="font-medium">{freq.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {freq.description || '-'}
                          </TableCell>
                          <TableCell>
                            {freq.per_year_multiplier ? `×${freq.per_year_multiplier}` : '-'}
                          </TableCell>
                          <TableCell>{freq.sort_order}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(freq)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(freq)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog - Full screen on mobile */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[450px]">
          <DialogHeader className="border-b p-4 sm:p-6">
            <DialogTitle className="text-lg">
              {editingFreq ? 'Edit Frequency' : 'Add Frequency'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingFreq
                ? 'Update this custom payment frequency.'
                : 'Create a new payment frequency option.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Form {...form}>
              <form id="frequency-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bi-Monthly"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Every two months"
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
                  name="per_year_multiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Per Year Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 6 for bi-monthly"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
                        Used to calculate annual costs (e.g., 52 for weekly, 12 for monthly)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:gap-3 sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="frequency-form"
              disabled={actionLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFreq ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Frequency</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete &quot;{deletingFreq?.name}&quot;?
              This may affect existing fees and activities using this frequency.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
