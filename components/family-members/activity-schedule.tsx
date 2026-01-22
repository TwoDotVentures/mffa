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
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import {
  getAllActiveActivities,
  getFamilyMembers,
} from '@/lib/family-members/actions';
import { formatTime } from '@/lib/family-members/utils';
import type { Extracurricular, FamilyMember } from '@/lib/types';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

// Color palette for different children
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

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

export function ActivitySchedule() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

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

  // Create a color map for each child
  const memberColors = members.reduce((acc, member, index) => {
    acc[member.id] = COLORS[index % COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  // Filter activities by selected member
  const filteredActivities = selectedMember === 'all'
    ? activities
    : activities.filter((a) => a.family_member_id === selectedMember);

  // Process activities into schedule format
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

  // Sort activities by start time
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => {
      const aTime = a.startHour * 60 + a.startMinute;
      const bTime = b.startHour * 60 + b.startMinute;
      return aTime - bTime;
    });
  });

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Schedule
        </CardTitle>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No scheduled activities</p>
            <p className="text-sm">Activities with days and times will appear here</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            {selectedMember === 'all' && members.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {members.map((member, index) => (
                  <Badge
                    key={member.id}
                    variant="outline"
                    className={COLORS[index % COLORS.length]}
                  >
                    {member.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Schedule Grid */}
            <div className="overflow-x-auto">
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
                  <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
                    <div className="p-2 text-xs text-muted-foreground border-r">
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
                            const height = Math.min(duration * 60, 120); // Cap at 2 hours display

                            return (
                              <TooltipProvider key={activity.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'absolute left-1 right-1 rounded border px-1 py-0.5 text-xs cursor-pointer overflow-hidden',
                                        activity.color
                                      )}
                                      style={{
                                        top: `${topOffset + idx * 2}px`,
                                        minHeight: `${Math.max(height - 4, 20)}px`,
                                      }}
                                    >
                                      <div className="font-medium truncate">
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
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
