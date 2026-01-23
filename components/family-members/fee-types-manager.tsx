/**
 * Fee Types Manager Component
 *
 * Admin interface for managing custom fee types.
 * Mobile-first responsive design with:
 * - Card-based layout on mobile
 * - Table layout on desktop
 * - Touch-friendly action menus
 * - Full-screen dialog on mobile
 *
 * @module components/family-members/fee-types-manager
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
  DollarSign,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  getFeeTypes,
  createFeeType,
  updateFeeType,
  deleteFeeType,
} from '@/lib/family-members/actions';
import { createClient } from '@/lib/supabase/client';
import type { FeeType, FeeTypeFormData } from '@/lib/types';

/**
 * Fee Types Manager Component
 * CRUD interface for managing fee types
 */
export function FeeTypesManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<FeeType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<FeeType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const form = useForm<FeeTypeFormData>({
    defaultValues: {
      name: '',
      description: '',
      sort_order: 50,
    },
  });

  useEffect(() => {
    loadFeeTypes();
  }, []);

  /** Load all fee types */
  async function loadFeeTypes() {
    try {
      setLoading(true);
      const data = await getFeeTypes();
      setFeeTypes(data);
    } catch (error) {
      console.error('Error loading fee types:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open dialog to add new type */
  function handleAdd() {
    setEditingType(null);
    form.reset({
      name: '',
      description: '',
      sort_order: 50,
    });
    setDialogOpen(true);
  }

  /** Open dialog to edit type */
  function handleEdit(type: FeeType) {
    setEditingType(type);
    form.reset({
      name: type.name,
      description: type.description || '',
      sort_order: type.sort_order,
    });
    setDialogOpen(true);
  }

  /** Open delete confirmation */
  function handleDeleteClick(type: FeeType) {
    setDeletingType(type);
    setDeleteDialogOpen(true);
  }

  /** Handle form submission */
  async function onSubmit(data: FeeTypeFormData) {
    setActionLoading(true);
    try {
      if (editingType) {
        await updateFeeType(editingType.id, data);
      } else {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await createFeeType(user.id, data);
      }
      await loadFeeTypes();
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving fee type:', error);
    } finally {
      setActionLoading(false);
    }
  }

  /** Handle delete confirmation */
  async function handleDelete() {
    if (!deletingType) return;

    setActionLoading(true);
    try {
      await deleteFeeType(deletingType.id);
      await loadFeeTypes();
      setDeleteDialogOpen(false);
      setDeletingType(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting fee type:', error);
    } finally {
      setActionLoading(false);
    }
  }

  const systemTypes = feeTypes.filter((t) => t.is_system);
  const customTypes = feeTypes.filter((t) => !t.is_system);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground sm:h-6 sm:w-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {/* Header */}
        <CardHeader className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Fee Types
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Manage the types of school fees you can track
            </CardDescription>
          </div>
          <Button onClick={handleAdd} className="h-9 w-full sm:h-10 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6">
          {/* System Types */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
              System Defaults (cannot be deleted)
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {systemTypes.map((type) => (
                <Badge key={type.id} variant="secondary" className="py-0.5 text-xs sm:py-1 sm:text-sm">
                  <Lock className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {type.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Types */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
              Your Custom Types
            </h4>
            {customTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground sm:text-sm">
                No custom fee types yet. Click &quot;Add Type&quot; to create one.
              </p>
            ) : (
              <>
                {/* Mobile: Card-based layout */}
                <div className="space-y-2 sm:hidden">
                  {customTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{type.name}</p>
                        {type.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {type.description}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Order: {type.sort_order}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-2 h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(type)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(type)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden rounded-md border sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {type.description || '-'}
                          </TableCell>
                          <TableCell>{type.sort_order}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(type)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(type)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[425px]">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6">
            <DialogTitle className="text-base sm:text-lg">
              {editingType ? 'Edit Fee Type' : 'Add Fee Type'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingType
                ? 'Update this custom fee type.'
                : 'Create a new fee type for tracking school fees.'}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Form {...form}>
              <form id="fee-type-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bus Transport"
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
                          placeholder="Optional description"
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

          {/* Footer */}
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
              form="fee-type-form"
              disabled={actionLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingType ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Fee Type</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete &quot;{deletingType?.name}&quot;?
              This may affect existing fees using this type.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-3">
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
