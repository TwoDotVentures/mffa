'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { getAllActiveActivities } from '@/lib/family-members/actions';
import { formatCurrency } from '@/lib/family-members/utils';
import type { Extracurricular } from '@/lib/types';

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

function calculateWeeklyHours(activity: Extracurricular): number {
  if (!activity.time_start || !activity.time_end || !activity.day_of_week) return 0;

  const [startHour, startMin] = activity.time_start.split(':').map(Number);
  const [endHour, endMin] = activity.time_end.split(':').map(Number);

  const durationHours = endHour - startHour + (endMin - startMin) / 60;
  const daysPerWeek = activity.day_of_week.length;

  return Math.max(0, durationHours * daysPerWeek);
}

export function ExtracurricularSummary() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Extracurricular[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalAnnualCost = activities.reduce((sum, a) => sum + calculateAnnualCost(a), 0);
  const totalWeeklyHours = activities.reduce((sum, a) => sum + calculateWeeklyHours(a), 0);
  const monthlyAverage = totalAnnualCost / 12;

  // Group by child
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

  // Group by activity type
  const byType = activities.reduce((acc, activity) => {
    const typeName = activity.activity_type?.name || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = { count: 0, cost: 0 };
    }
    acc[typeName].count++;
    acc[typeName].cost += calculateAnnualCost(activity);
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);

  // Find most expensive activity type
  const sortedTypes = Object.entries(byType).sort(([, a], [, b]) => b.cost - a.cost);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Active Activities</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{activities.length}</p>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(byChild).length} children
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Annual Cost</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalAnnualCost)}</p>
            <p className="text-xs text-muted-foreground">
              ~{formatCurrency(monthlyAverage)}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Weekly Hours</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{totalWeeklyHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">
              Combined across all children
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Top Category</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {sortedTypes[0]?.[0] || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              {sortedTypes[0] ? formatCurrency(sortedTypes[0][1].cost) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By Child Breakdown */}
      {Object.keys(byChild).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activities by Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byChild).map(([name, data]) => {
                const costPercentage = totalAnnualCost > 0 ? (data.totalCost / totalAnnualCost) * 100 : 0;

                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span>{formatCurrency(data.totalCost)}</span>
                    </div>
                    <Progress value={costPercentage} className="mt-1 h-2" />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
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

      {/* Detailed Cost Breakdown by Child */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(byChild).map(([childName, data]) => (
          <Card key={childName}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{childName}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formatCurrency(data.totalCost)}/year
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.activities.map((activity) => {
                  const cost = calculateAnnualCost(activity);
                  const hours = calculateWeeklyHours(activity);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.activity_type?.name}
                          {hours > 0 && ` • ${hours.toFixed(1)}h/week`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(cost)}</p>
                        {activity.cost_amount && activity.cost_frequency && (
                          <p className="text-xs text-muted-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTypes.map(([type, data]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="text-sm font-medium">{type}</span>
                    <p className="text-xs text-muted-foreground">
                      {data.count} activit{data.count === 1 ? 'y' : 'ies'}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(data.cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
