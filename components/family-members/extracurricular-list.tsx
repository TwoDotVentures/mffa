/**
 * Extracurricular Activities List Component
 *
 * Displays extracurricular activities for a family member.
 * Mobile-first responsive design with:
 * - Card-based activity items
 * - Touch-friendly action buttons
 * - Compact schedule display on mobile
 * - Clear cost information
 *
 * @module components/family-members/extracurricular-list
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Globe,
  Loader2,
} from 'lucide-react';
import { ExtracurricularDialog } from './extracurricular-dialog';
import {
  getActivitiesByMember,
  deleteExtracurricular,
  updateExtracurricular,
} from '@/lib/family-members/actions';
import { formatCurrency, formatTime } from '@/lib/family-members/utils';
import type { FamilyMember, Extracurricular, ExtracurricularUpdate } from '@/lib/types';

interface ExtracurricularListProps {
  /** The family member to display activities for */
  member: FamilyMember;
}

/**
 * Calculate annual cost including recurring and one-time fees
 */
function calculateAnnualCost(activity: Extracurricular): number {
  const multiplier = activity.cost_frequency?.per_year_multiplier || 1;
  const recurring = (activity.cost_amount || 0) * multiplier;
  const oneTime =
    (activity.registration_fee || 0) +
    (activity.equipment_cost || 0) +
    (activity.uniform_cost || 0) +
    (activity.other_costs || 0);
  return recurring + oneTime;
}

/**
 * Extracurricular List Component
 * Displays and manages extracurricular activities
 */
export function ExtracurricularList({ member }: ExtracurricularListProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);

  /** Dialog states */
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Extracurricular | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Extracurricular | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Load activities on member change */
  useEffect(() => {
    loadActivities();
  }, [member.id]);

  /** Fetch activities from server */
  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getActivitiesByMember(member.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open add activity dialog */
  function handleAddActivity() {
    setEditingActivity(undefined);
    setActivityDialogOpen(true);
  }

  /** Open edit activity dialog */
  function handleEditActivity(activity: Extracurricular) {
    setEditingActivity(activity);
    setActivityDialogOpen(true);
  }

  /** Show delete confirmation */
  function handleDeleteClick(activity: Extracurricular) {
    setDeletingActivity(activity);
    setDeleteDialogOpen(true);
  }

  /** Execute activity deletion */
  async function handleDelete() {
    if (!deletingActivity) return;

    setDeleteLoading(true);
    try {
      await deleteExtracurricular(deletingActivity.id);
      await loadActivities();
      setDeleteDialogOpen(false);
      setDeletingActivity(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setDeleteLoading(false);
    }
  }

  /** Toggle activity active status */
  async function toggleActiveStatus(activity: Extracurricular): Promise<void> {
    try {
      const updateData: ExtracurricularUpdate = { is_active: !activity.is_active };
      await updateExtracurricular(activity.id, updateData);
      await loadActivities();
      router.refresh();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  }

  /** Calculate totals */
  const activeActivities = activities.filter((a) => a.is_active);
  const totalAnnualCost = activeActivities.reduce((sum, a) => sum + calculateAnnualCost(a), 0);

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header - Stack on mobile */}
        <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Extracurricular Activities
            </CardTitle>
            {activities.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                <span>{activeActivities.length} active</span>
                <span>•</span>
                <span>Annual: {formatCurrency(totalAnnualCost)}</span>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleAddActivity} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Activity
          </Button>
        </CardHeader>

        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {activities.length === 0 ? (
            /* Empty state */
            <div className="py-6 text-center text-muted-foreground sm:py-8">
              <Activity className="mx-auto h-10 w-10 opacity-50 sm:h-12 sm:w-12" />
              <p className="mt-2 text-sm">No activities yet</p>
              <p className="text-xs sm:text-sm">Click &quot;Add Activity&quot; to track extracurricular activities</p>
            </div>
          ) : (
            /* Activity Cards */
            <div className="space-y-2 sm:space-y-3">
              {activities.map((activity) => {
                const annualCost = calculateAnnualCost(activity);

                return (
                  <div
                    key={activity.id}
                    className={`rounded-lg border p-3 transition-opacity sm:p-4 ${
                      !activity.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Activity Info */}
                      <div className="min-w-0 flex-1">
                        {/* Name and badges */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm font-medium sm:text-base">{activity.name}</h4>
                          {activity.activity_type && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              {activity.activity_type.name}
                            </Badge>
                          )}
                          {!activity.is_active && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {activity.provider && (
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {activity.provider}
                          </p>
                        )}

                        {/* Schedule details */}
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground sm:mt-2 sm:gap-x-4 sm:text-xs">
                          {activity.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {activity.venue}
                            </span>
                          )}
                          {activity.day_of_week && activity.day_of_week.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {activity.day_of_week.map((d) => d.slice(0, 3)).join(', ')}
                            </span>
                          )}
                          {activity.time_start && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {formatTime(activity.time_start)}
                              {activity.time_end && ` - ${formatTime(activity.time_end)}`}
                            </span>
                          )}
                        </div>

                        {/* Cost */}
                        {annualCost > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                            <span className="text-sm font-medium sm:text-base">{formatCurrency(annualCost)}/year</span>
                            {activity.cost_amount && activity.cost_frequency && (
                              <span className="text-[10px] text-muted-foreground sm:text-xs">
                                ({formatCurrency(activity.cost_amount)} {activity.cost_frequency.name.toLowerCase()})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Contact info - Hidden on mobile for space */}
                        {(activity.contact_phone || activity.contact_email || activity.website) && (
                          <div className="mt-2 hidden flex-wrap gap-x-3 gap-y-1 text-xs sm:flex">
                            {activity.contact_phone && (
                              <a
                                href={`tel:${activity.contact_phone}`}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                              >
                                <Phone className="h-3 w-3" />
                                {activity.contact_phone}
                              </a>
                            )}
                            {activity.contact_email && (
                              <a
                                href={`mailto:${activity.contact_email}`}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                              >
                                <Mail className="h-3 w-3" />
                                {activity.contact_email}
                              </a>
                            )}
                            {activity.website && (
                              <a
                                href={activity.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        {/* Active toggle - Smaller on mobile */}
                        <div className="flex items-center gap-1">
                          <span className="hidden text-xs text-muted-foreground sm:inline">Active</span>
                          <Switch
                            checked={activity.is_active}
                            onCheckedChange={() => toggleActiveStatus(activity)}
                            className="scale-90 sm:scale-100"
                          />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            <DropdownMenuItem onClick={() => handleEditActivity(activity)} className="gap-2 py-2">
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 py-2 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(activity)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <ExtracurricularDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        member={member}
        activity={editingActivity}
        onSuccess={() => loadActivities()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Activity</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete &quot;{deletingActivity?.name}&quot;?
              This action cannot be undone.
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
              disabled={deleteLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
