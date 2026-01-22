'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { getFeesByYear } from '@/lib/family-members/actions';
import { formatCurrency } from '@/lib/family-members/utils';
import type { SchoolFee } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FeeCalendarProps {
  year?: number;
  onFeeClick?: (fee: SchoolFee) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  fees: SchoolFee[];
  isToday: boolean;
}

function getCalendarDays(year: number, month: number, fees: SchoolFee[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  // Add days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      fees: [],
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const dayFees = fees.filter((f) => f.due_date === dateStr);
    days.push({
      date,
      isCurrentMonth: true,
      fees: dayFees,
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Add days from next month
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      fees: [],
      isToday: date.getTime() === today.getTime(),
    });
  }

  return days;
}

export function FeeCalendar({ year, onFeeClick }: FeeCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: year || now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    loadFees();
  }, [currentDate.year]);

  async function loadFees() {
    try {
      setLoading(true);
      const data = await getFeesByYear(currentDate.year);
      setFees(data);
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  }

  const calendarDays = useMemo(
    () => getCalendarDays(currentDate.year, currentDate.month, fees),
    [currentDate.year, currentDate.month, fees]
  );

  function navigateMonth(delta: number) {
    setCurrentDate((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;

      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }

      return { year: newYear, month: newMonth };
    });
  }

  function goToToday() {
    const now = new Date();
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() });
  }

  function getDayStatus(day: CalendarDay): 'none' | 'paid' | 'due' | 'overdue' {
    if (day.fees.length === 0) return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPaid = day.fees.every((f) => f.is_paid);
    if (allPaid) return 'paid';

    const hasUnpaid = day.fees.some((f) => !f.is_paid);
    if (hasUnpaid && day.date < today) return 'overdue';

    return 'due';
  }

  const statusColors = {
    none: '',
    paid: 'bg-green-100 dark:bg-green-900/30',
    due: 'bg-amber-100 dark:bg-amber-900/30',
    overdue: 'bg-red-100 dark:bg-red-900/30',
  };

  const statusDotColors = {
    none: '',
    paid: 'bg-green-500',
    due: 'bg-amber-500',
    overdue: 'bg-red-500',
  };

  // Calculate month summary
  const monthFees = fees.filter((f) => {
    if (!f.due_date) return false;
    const feeDate = new Date(f.due_date);
    return feeDate.getMonth() === currentDate.month && feeDate.getFullYear() === currentDate.year;
  });
  const monthTotal = monthFees.reduce((sum, f) => sum + f.amount, 0);
  const monthPaid = monthFees.filter((f) => f.is_paid).reduce((sum, f) => sum + (f.paid_amount || f.amount), 0);

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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fee Calendar
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {MONTHS[currentDate.month]} {currentDate.year}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Month Summary */}
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          <span>
            <DollarSign className="mr-1 inline h-3 w-3" />
            Month Total: {formatCurrency(monthTotal)}
          </span>
          {monthTotal > 0 && (
            <>
              <span className="text-green-600">Paid: {formatCurrency(monthPaid)}</span>
              <span className="text-amber-600">
                Remaining: {formatCurrency(monthTotal - monthPaid)}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Due</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Overdue</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg border">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {DAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const status = getDayStatus(day);
              const hasMultipleFees = day.fees.length > 1;
              const totalAmount = day.fees.reduce((sum, f) => sum + f.amount, 0);

              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'relative min-h-[80px] border-b border-r p-1 transition-colors',
                          !day.isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                          day.isToday && 'bg-blue-50 dark:bg-blue-900/20',
                          status !== 'none' && statusColors[status],
                          day.fees.length > 0 && 'cursor-pointer hover:bg-muted/50'
                        )}
                        onClick={() => {
                          if (day.fees.length === 1 && onFeeClick) {
                            onFeeClick(day.fees[0]);
                          }
                        }}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                            day.isToday && 'bg-primary text-primary-foreground font-bold'
                          )}
                        >
                          {day.date.getDate()}
                        </span>

                        {day.fees.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {day.fees.slice(0, 2).map((fee, feeIndex) => (
                              <div
                                key={feeIndex}
                                className={cn(
                                  'flex items-center gap-1 rounded px-1 py-0.5 text-[10px]',
                                  fee.is_paid
                                    ? 'bg-green-200/50 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                                    : 'bg-amber-200/50 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200'
                                )}
                              >
                                {fee.is_paid ? (
                                  <Check className="h-2 w-2" />
                                ) : (
                                  <DollarSign className="h-2 w-2" />
                                )}
                                <span className="truncate">
                                  {formatCurrency(fee.amount)}
                                </span>
                              </div>
                            ))}
                            {hasMultipleFees && day.fees.length > 2 && (
                              <div className="text-center text-[10px] text-muted-foreground">
                                +{day.fees.length - 2} more
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status dot */}
                        {status !== 'none' && (
                          <div
                            className={cn(
                              'absolute right-1 top-1 h-2 w-2 rounded-full',
                              statusDotColors[status]
                            )}
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    {day.fees.length > 0 && (
                      <TooltipContent className="max-w-[250px]">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {day.date.toLocaleDateString('en-AU', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          <div className="space-y-1">
                            {day.fees.map((fee, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                <span className="truncate">{fee.description}</span>
                                <Badge
                                  variant={fee.is_paid ? 'secondary' : 'outline'}
                                  className="shrink-0"
                                >
                                  {formatCurrency(fee.amount)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          {hasMultipleFees && (
                            <p className="border-t pt-1 text-xs font-medium">
                              Total: {formatCurrency(totalAmount)}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
