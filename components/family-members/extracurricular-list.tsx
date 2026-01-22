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
import type { FamilyMember, Extracurricular } from '@/lib/types';

interface ExtracurricularListProps {
  member: FamilyMember;
}

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

export function ExtracurricularList({ member }: ExtracurricularListProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Extracurricular | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Extracurricular | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [member.id]);

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

  function handleAddActivity() {
    setEditingActivity(undefined);
    setActivityDialogOpen(true);
  }

  function handleEditActivity(activity: Extracurricular) {
    setEditingActivity(activity);
    setActivityDialogOpen(true);
  }

  function handleDeleteClick(activity: Extracurricular) {
    setDeletingActivity(activity);
    setDeleteDialogOpen(true);
  }

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

  async function toggleActiveStatus(activity: Extracurricular) {
    try {
      await updateExtracurricular(activity.id, { is_active: !activity.is_active } as any);
      await loadActivities();
      router.refresh();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  }

  // Calculate totals
  const activeActivities = activities.filter((a) => a.is_active);
  const totalAnnualCost = activeActivities.reduce((sum, a) => sum + calculateAnnualCost(a), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
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
              Extracurricular Activities
            </CardTitle>
            {activities.length > 0 && (
              <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                <span>{activeActivities.length} active</span>
                <span>•</span>
                <span>Annual cost: {formatCurrency(totalAnnualCost)}</span>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleAddActivity}>
            <Plus className="mr-1 h-4 w-4" />
            Add Activity
          </Button>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No activities yet</p>
              <p className="text-sm">Click &quot;Add Activity&quot; to track extracurricular activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const annualCost = calculateAnnualCost(activity);

                return (
                  <div
                    key={activity.id}
                    className={`rounded-lg border p-4 transition-opacity ${
                      !activity.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{activity.name}</h4>
                          {activity.activity_type && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.activity_type.name}
                            </Badge>
                          )}
                          {!activity.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {activity.provider && (
                          <p className="text-sm text-muted-foreground">
                            {activity.provider}
                          </p>
                        )}

                        {/* Details */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {activity.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.venue}
                            </span>
                          )}
                          {activity.day_of_week && activity.day_of_week.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {activity.day_of_week.map((d) => d.slice(0, 3)).join(', ')}
                            </span>
                          )}
                          {activity.time_start && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(activity.time_start)}
                              {activity.time_end && ` - ${formatTime(activity.time_end)}`}
                            </span>
                          )}
                        </div>

                        {/* Cost breakdown */}
                        {annualCost > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatCurrency(annualCost)}/year</span>
                            {activity.cost_amount && activity.cost_frequency && (
                              <span className="text-xs text-muted-foreground">
                                ({formatCurrency(activity.cost_amount)} {activity.cost_frequency.name.toLowerCase()})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Contact info */}
                        {(activity.contact_phone || activity.contact_email || activity.website) && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={activity.is_active}
                            onCheckedChange={() => toggleActiveStatus(activity)}
                          />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(activity)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingActivity?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
