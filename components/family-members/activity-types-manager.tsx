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
  Activity,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  getActivityTypes,
  createActivityType,
  updateActivityType,
  deleteActivityType,
} from '@/lib/family-members/actions';
import { createClient } from '@/lib/supabase/client';
import type { ActivityType, ActivityTypeFormData } from '@/lib/types';

export function ActivityTypesManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<ActivityType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const form = useForm<ActivityTypeFormData>({
    defaultValues: {
      name: '',
      icon: '',
      description: '',
      sort_order: 50,
    },
  });

  useEffect(() => {
    loadActivityTypes();
  }, []);

  async function loadActivityTypes() {
    try {
      setLoading(true);
      const data = await getActivityTypes();
      setActivityTypes(data);
    } catch (error) {
      console.error('Error loading activity types:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingType(null);
    form.reset({
      name: '',
      icon: '',
      description: '',
      sort_order: 50,
    });
    setDialogOpen(true);
  }

  function handleEdit(type: ActivityType) {
    setEditingType(type);
    form.reset({
      name: type.name,
      icon: type.icon || '',
      description: type.description || '',
      sort_order: type.sort_order,
    });
    setDialogOpen(true);
  }

  function handleDeleteClick(type: ActivityType) {
    setDeletingType(type);
    setDeleteDialogOpen(true);
  }

  async function onSubmit(data: ActivityTypeFormData) {
    setActionLoading(true);
    try {
      if (editingType) {
        await updateActivityType(editingType.id, data);
      } else {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await createActivityType(user.id, data);
      }
      await loadActivityTypes();
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving activity type:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingType) return;

    setActionLoading(true);
    try {
      await deleteActivityType(deletingType.id);
      await loadActivityTypes();
      setDeleteDialogOpen(false);
      setDeletingType(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting activity type:', error);
    } finally {
      setActionLoading(false);
    }
  }

  const systemTypes = activityTypes.filter((t) => t.is_system);
  const customTypes = activityTypes.filter((t) => !t.is_system);

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
              <Activity className="h-5 w-5" />
              Activity Types
            </CardTitle>
            <CardDescription>
              Manage the types of extracurricular activities you can track
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Types */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              System Defaults (cannot be deleted)
            </h4>
            <div className="flex flex-wrap gap-2">
              {systemTypes.map((type) => (
                <Badge key={type.id} variant="secondary" className="py-1">
                  <Lock className="mr-1 h-3 w-3" />
                  {type.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Types */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Your Custom Types
            </h4>
            {customTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom activity types yet. Click &quot;Add Type&quot; to create one.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Icon</TableHead>
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
                          {type.icon || '-'}
                        </TableCell>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Activity Type' : 'Add Activity Type'}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? 'Update this custom activity type.'
                : 'Create a new activity type for tracking extracurriculars.'}
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
                      <Input placeholder="e.g., Robotics Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., robot, circuit" {...field} />
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
                      <Input placeholder="Optional description" {...field} />
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
                  {editingType ? 'Save' : 'Add'}
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
            <DialogTitle>Delete Activity Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingType?.name}&quot;?
              This may affect existing activities using this type.
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
