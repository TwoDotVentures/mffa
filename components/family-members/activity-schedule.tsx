/**
 * Activity Schedule Component
 *
 * Displays a weekly schedule view of all activities.
 * Mobile-first responsive design with:
 * - List view on mobile, grid on desktop
 * - Touch-friendly activity cards
 * - Horizontally scrollable schedule grid
 * - Clear time and day indicators
 *
 * @module components/family-members/activity-schedule
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, Clock, MapPin, Loader2, User } from 'lucide-react';
import {
  getAllActiveActivities,
  getFamilyMembers,
} from '@/lib/family-members/actions';
import { formatTime } from '@/lib/family-members/utils';
import type { Extracurricular, FamilyMember } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Days of the week */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Hours to display (7 AM to 8 PM) */
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

/** Color palette for different children */
const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
  'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200',
  'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200',
  'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200',
  'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200',
];

interface ScheduleActivity extends Extracurricular {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
}

/**
 * Parse time string to hour and minute
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

/**
 * Activity Schedule Component
 * Displays weekly activity schedule
 */
export function ActivitySchedule() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('all');

  /** Load data on mount */
  useEffect(() => {
    loadData();
  }, []);

  /** Fetch activities and members */
  async function loadData() {
    try {
      setLoading(true);
      const [activitiesData, membersData] = await Promise.all([
        getAllActiveActivities(),
        getFamilyMembers(),
      ]);
      setActivities(activitiesData);
      setMembers(membersData.filter((m) => m.member_type === 'child'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Create color map for each child */
  const memberColors = members.reduce((acc, member, index) => {
    acc[member.id] = COLORS[index % COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  /** Filter activities by selected member */
  const filteredActivities = selectedMember === 'all'
    ? activities
    : activities.filter((a) => a.family_member_id === selectedMember);

  /** Process activities into schedule format */
  const scheduleByDay: Record<string, ScheduleActivity[]> = {};
  DAYS.forEach((day) => {
    scheduleByDay[day] = [];
  });

  filteredActivities.forEach((activity) => {
    if (!activity.time_start || !activity.day_of_week) return;

    const start = parseTime(activity.time_start);
    const end = activity.time_end ? parseTime(activity.time_end) : { hour: start.hour + 1, minute: 0 };
    const color = memberColors[activity.family_member_id] || COLORS[0];

    activity.day_of_week.forEach((day) => {
      if (scheduleByDay[day]) {
        scheduleByDay[day].push({
          ...activity,
          startHour: start.hour,
          startMinute: start.minute,
          endHour: end.hour,
          endMinute: end.minute,
          color,
        });
      }
    });
  });

  /** Sort activities by start time */
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => {
      const aTime = a.startHour * 60 + a.startMinute;
      const bTime = b.startHour * 60 + b.startMinute;
      return aTime - bTime;
    });
  });

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header - Stack on mobile */}
      <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Weekly Schedule
        </CardTitle>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="h-10 w-full text-sm sm:h-9 sm:w-[180px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2.5 sm:py-2">All Children</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id} className="py-2.5 sm:py-2">
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {filteredActivities.length === 0 ? (
          /* Empty state */
          <div className="py-6 text-center text-muted-foreground sm:py-8">
            <Calendar className="mx-auto h-10 w-10 opacity-50 sm:h-12 sm:w-12" />
            <p className="mt-2 text-sm">No scheduled activities</p>
            <p className="text-xs sm:text-sm">Activities with days and times will appear here</p>
          </div>
        ) : (
          <>
            {/* Legend - Wraps on mobile */}
            {selectedMember === 'all' && members.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2">
                {members.map((member, index) => (
                  <Badge
                    key={member.id}
                    variant="outline"
                    className={`${COLORS[index % COLORS.length]} text-[10px] sm:text-xs`}
                  >
                    {member.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Mobile List View - Visible on small screens */}
            <div className="space-y-3 sm:hidden">
              {DAYS.map((day) => {
                const dayActivities = scheduleByDay[day];
                if (dayActivities.length === 0) return null;

                return (
                  <div key={day}>
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground">{day}</h4>
                    <div className="space-y-2">
                      {dayActivities.map((activity) => (
                        <div
                          key={`${activity.id}-${day}`}
                          className={cn(
                            'rounded-lg border p-2.5',
                            activity.color
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{activity.name}</p>
                              {activity.family_member?.name && (
                                <p className="flex items-center gap-1 text-[10px] opacity-75">
                                  <User className="h-2.5 w-2.5" />
                                  {activity.family_member.name}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {formatTime(activity.time_start || '')}
                              </div>
                              {activity.time_end && (
                                <p className="text-[10px] opacity-75">
                                  to {formatTime(activity.time_end)}
                                </p>
                              )}
                            </div>
                          </div>
                          {activity.venue && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] opacity-75">
                              <MapPin className="h-2.5 w-2.5" />
                              {activity.venue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Grid View - Hidden on small screens */}
            <div className="hidden overflow-x-auto sm:block">
              <div className="min-w-[800px]">
                {/* Days Header */}
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2" /> {/* Time column header */}
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {HOURS.map((hour) => (
                  <div key={hour} className="grid min-h-[60px] grid-cols-8 border-b">
                    <div className="border-r p-2 text-xs text-muted-foreground">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {DAYS.map((day) => {
                      const dayActivities = scheduleByDay[day].filter(
                        (a) => a.startHour === hour
                      );

                      return (
                        <div key={`${day}-${hour}`} className="relative border-r p-1">
                          {dayActivities.map((activity, idx) => {
                            const duration =
                              (activity.endHour - activity.startHour) +
                              (activity.endMinute - activity.startMinute) / 60;
                            const topOffset = (activity.startMinute / 60) * 60;
                            const height = Math.min(duration * 60, 120);

                            return (
                              <TooltipProvider key={activity.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'absolute left-1 right-1 cursor-pointer overflow-hidden rounded border px-1 py-0.5 text-xs',
                                        activity.color
                                      )}
                                      style={{
                                        top: `${topOffset + idx * 2}px`,
                                        minHeight: `${Math.max(height - 4, 20)}px`,
                                      }}
                                    >
                                      <div className="truncate font-medium">
                                        {activity.name}
                                      </div>
                                      <div className="truncate opacity-75">
                                        {formatTime(activity.time_start || '')}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[250px]">
                                    <div className="space-y-1">
                                      <p className="font-medium">{activity.name}</p>
                                      <p className="text-xs">
                                        {activity.family_member?.name}
                                      </p>
                                      <div className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(activity.time_start || '')}
                                        {activity.time_end && (
                                          <> - {formatTime(activity.time_end)}</>
                                        )}
                                      </div>
                                      {activity.venue && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <MapPin className="h-3 w-3" />
                                          {activity.venue}
                                        </div>
                                      )}
                                      {activity.provider && (
                                        <p className="text-xs text-muted-foreground">
                                          {activity.provider}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground sm:mt-4 sm:gap-4 sm:text-sm">
              <span>
                {filteredActivities.length} activit{filteredActivities.length === 1 ? 'y' : 'ies'}
              </span>
              <span>•</span>
              <span>
                {Object.values(scheduleByDay).filter((d) => d.length > 0).length} days/week
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
