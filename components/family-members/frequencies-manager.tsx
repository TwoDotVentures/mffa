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

  useEffect(() => {
    loadFrequencies();
  }, []);

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

  function handleDeleteClick(freq: Frequency) {
    setDeletingFreq(freq);
    setDeleteDialogOpen(true);
  }

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Payment Frequencies
            </CardTitle>
            <CardDescription>
              Manage payment frequency options for fees and activities
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Frequency
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Frequencies */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              System Defaults (cannot be deleted)
            </h4>
            <div className="rounded-md border">
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
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Your Custom Frequencies
            </h4>
            {customFreqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom frequencies yet. Click &quot;Add Frequency&quot; to create one.
              </p>
            ) : (
              <div className="rounded-md border">
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFreq ? 'Edit Frequency' : 'Add Frequency'}
            </DialogTitle>
            <DialogDescription>
              {editingFreq
                ? 'Update this custom payment frequency.'
                : 'Create a new payment frequency option.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bi-Monthly" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Every two months" {...field} />
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
                    <FormLabel>Per Year Multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 6 for bi-monthly"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingFreq ? 'Save' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Frequency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingFreq?.name}&quot;?
              This may affect existing fees and activities using this frequency.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
