/**
 * Extracurricular Summary Component
 *
 * Displays an overview of all extracurricular activities with cost breakdown.
 * Mobile-first responsive design with:
 * - 2-column stat cards on mobile, 4 on desktop
 * - Stacked child breakdown on mobile
 * - Touch-friendly activity cards
 * - Clear cost visualization
 *
 * @module components/family-members/extracurricular-summary
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  DollarSign,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { getAllActiveActivities } from '@/lib/family-members/actions';
import { formatCurrency } from '@/lib/family-members/utils';
import type { Extracurricular } from '@/lib/types';

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
 * Calculate weekly hours from activity schedule
 */
function calculateWeeklyHours(activity: Extracurricular): number {
  if (!activity.time_start || !activity.time_end || !activity.day_of_week) return 0;

  const [startHour, startMin] = activity.time_start.split(':').map(Number);
  const [endHour, endMin] = activity.time_end.split(':').map(Number);

  const durationHours = endHour - startHour + (endMin - startMin) / 60;
  const daysPerWeek = activity.day_of_week.length;

  return Math.max(0, durationHours * daysPerWeek);
}

/**
 * Extracurricular Summary Component
 * Provides overview dashboard of all activities
 */
export function ExtracurricularSummary() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Extracurricular[]>([]);

  /** Load activities on mount */
  useEffect(() => {
    loadActivities();
  }, []);

  /** Fetch activities from server */
  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getAllActiveActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

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

  /** Calculate totals */
  const totalAnnualCost = activities.reduce((sum, a) => sum + calculateAnnualCost(a), 0);
  const totalWeeklyHours = activities.reduce((sum, a) => sum + calculateWeeklyHours(a), 0);
  const monthlyAverage = totalAnnualCost / 12;

  /** Group by child */
  const byChild = activities.reduce((acc, activity) => {
    const childName = activity.family_member?.name || 'Unknown';
    if (!acc[childName]) {
      acc[childName] = {
        activities: [],
        totalCost: 0,
        weeklyHours: 0,
      };
    }
    acc[childName].activities.push(activity);
    acc[childName].totalCost += calculateAnnualCost(activity);
    acc[childName].weeklyHours += calculateWeeklyHours(activity);
    return acc;
  }, {} as Record<string, { activities: Extracurricular[]; totalCost: number; weeklyHours: number }>);

  /** Group by activity type */
  const byType = activities.reduce((acc, activity) => {
    const typeName = activity.activity_type?.name || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = { count: 0, cost: 0 };
    }
    acc[typeName].count++;
    acc[typeName].cost += calculateAnnualCost(activity);
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);

  /** Sort types by cost descending */
  const sortedTypes = Object.entries(byType).sort(([, a], [, b]) => b.cost - a.cost);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Overview Stat Cards - 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
        {/* Active Activities */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Activity className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Activities</span>
            </div>
            <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">{activities.length}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Across {Object.keys(byChild).length} children
            </p>
          </CardContent>
        </Card>

        {/* Annual Cost */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Annual Cost</span>
            </div>
            <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">{formatCurrency(totalAnnualCost)}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              ~{formatCurrency(monthlyAverage)}/month
            </p>
          </CardContent>
        </Card>

        {/* Weekly Hours */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Weekly Hours</span>
            </div>
            <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">{totalWeeklyHours.toFixed(1)}h</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Combined total
            </p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">Top Category</span>
            </div>
            <p className="mt-1.5 truncate text-lg font-bold sm:mt-2 sm:text-2xl">
              {sortedTypes[0]?.[0] || 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {sortedTypes[0] ? formatCurrency(sortedTypes[0][1].cost) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By Child Breakdown */}
      {Object.keys(byChild).length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Activities by Child</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(byChild).map(([name, data]) => {
                const costPercentage = totalAnnualCost > 0 ? (data.totalCost / totalAnnualCost) * 100 : 0;

                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium">{name}</span>
                      <span>{formatCurrency(data.totalCost)}</span>
                    </div>
                    <Progress value={costPercentage} className="mt-1 h-1.5 sm:h-2" />
                    <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
                      <span>
                        {data.activities.length} activit{data.activities.length === 1 ? 'y' : 'ies'}
                      </span>
                      <span>{data.weeklyHours.toFixed(1)}h/week</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Cost Breakdown by Child - Stacked on mobile */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {Object.entries(byChild).map(([childName, data]) => (
          <Card key={childName} className="overflow-hidden">
            <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
                <span>{childName}</span>
                <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                  {formatCurrency(data.totalCost)}/year
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="space-y-2">
                {data.activities.map((activity) => {
                  const cost = calculateAnnualCost(activity);
                  const hours = calculateWeeklyHours(activity);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-2 rounded-lg border p-2 sm:p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium sm:text-sm">{activity.name}</p>
                        <p className="text-[10px] text-muted-foreground sm:text-xs">
                          {activity.activity_type?.name}
                          {hours > 0 && ` • ${hours.toFixed(1)}h/week`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium sm:text-sm">{formatCurrency(cost)}</p>
                        {activity.cost_amount && activity.cost_frequency && (
                          <p className="text-[10px] text-muted-foreground sm:text-xs">
                            {formatCurrency(activity.cost_amount)} {activity.cost_frequency.name.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* By Category */}
      {Object.keys(byType).length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Cost by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {sortedTypes.map(([type, data]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium sm:text-sm">{type}</span>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      {data.count} activit{data.count === 1 ? 'y' : 'ies'}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 text-xs font-medium sm:text-sm">
                    {formatCurrency(data.cost)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
