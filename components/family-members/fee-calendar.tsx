/**
 * Fee Calendar Component
 *
 * Calendar view for visualizing fee due dates.
 * Mobile-first responsive design with:
 * - Compact calendar cells on mobile
 * - Touch-friendly navigation
 * - Responsive month summary layout
 * - Simplified mobile fee indicators
 *
 * @module components/family-members/fee-calendar
 */
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
  Check,
  Loader2,
} from 'lucide-react';
import { getFeesByYear } from '@/lib/family-members/actions';
import { formatCurrency } from '@/lib/family-members/utils';
import type { SchoolFee } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FeeCalendarProps {
  /** Year to display fees for */
  year?: number;
  /** Callback when a fee is clicked */
  onFeeClick?: (fee: SchoolFee) => void;
}

/** Month names for display */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Short month names for mobile */
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Day names for calendar header */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Short day names for mobile */
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Calendar day data structure */
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  fees: SchoolFee[];
  isToday: boolean;
}

/**
 * Generate calendar days for a given month
 */
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

/**
 * Fee Calendar Component
 * Visual calendar for tracking fee due dates
 */
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

  /** Load fees for the current year */
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

  /** Navigate to previous/next month */
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

  /** Navigate to current month */
  function goToToday() {
    const now = new Date();
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() });
  }

  /** Get payment status for a calendar day */
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

  /** Status background colors */
  const statusColors = {
    none: '',
    paid: 'bg-green-100 dark:bg-green-900/30',
    due: 'bg-amber-100 dark:bg-amber-900/30',
    overdue: 'bg-red-100 dark:bg-red-900/30',
  };

  /** Status dot colors */
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
        <CardContent className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground sm:h-6 sm:w-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
        {/* Header - stacks on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Today button */}
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Fee Calendar</span>
              <span className="sm:hidden">Calendar</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Today
            </Button>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] text-center text-sm font-medium sm:min-w-[150px] sm:text-base">
              <span className="sm:hidden">{MONTHS_SHORT[currentDate.month]} {currentDate.year}</span>
              <span className="hidden sm:inline">{MONTHS[currentDate.month]} {currentDate.year}</span>
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Month Summary - wraps on mobile */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
          <span className="flex items-center">
            <DollarSign className="mr-0.5 h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Month Total:</span>
            <span className="sm:hidden">Total:</span>
            {' '}{formatCurrency(monthTotal)}
          </span>
          {monthTotal > 0 && (
            <>
              <span className="text-green-600">
                <span className="hidden sm:inline">Paid:</span>
                <span className="sm:hidden">P:</span>
                {' '}{formatCurrency(monthPaid)}
              </span>
              <span className="text-amber-600">
                <span className="hidden sm:inline">Remaining:</span>
                <span className="sm:hidden">R:</span>
                {' '}{formatCurrency(monthTotal - monthPaid)}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        {/* Legend - compact on mobile */}
        <div className="mb-3 flex flex-wrap gap-3 text-[10px] sm:mb-4 sm:gap-4 sm:text-xs">
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
          {/* Day headers - short on mobile */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {DAYS.map((day, index) => (
              <div
                key={day}
                className="px-0.5 py-1.5 text-center text-[10px] font-medium text-muted-foreground sm:px-2 sm:py-2 sm:text-xs"
              >
                <span className="sm:hidden">{DAYS_SHORT[index]}</span>
                <span className="hidden sm:inline">{day}</span>
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
                          'relative min-h-[48px] border-b border-r p-0.5 transition-colors sm:min-h-[80px] sm:p-1',
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
                        {/* Date number */}
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full text-[10px] sm:h-6 sm:w-6 sm:text-xs',
                            day.isToday && 'bg-primary text-primary-foreground font-bold'
                          )}
                        >
                          {day.date.getDate()}
                        </span>

                        {/* Fee indicators */}
                        {day.fees.length > 0 && (
                          <div className="mt-0.5 space-y-0.5 sm:mt-1">
                            {/* Mobile: just show dots */}
                            <div className="flex justify-center gap-0.5 sm:hidden">
                              {day.fees.slice(0, 3).map((fee, feeIndex) => (
                                <div
                                  key={feeIndex}
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    fee.is_paid ? 'bg-green-500' : 'bg-amber-500'
                                  )}
                                />
                              ))}
                              {day.fees.length > 3 && (
                                <span className="text-[8px] text-muted-foreground">+</span>
                              )}
                            </div>

                            {/* Desktop: show fee details */}
                            <div className="hidden sm:block">
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
                          </div>
                        )}

                        {/* Status dot */}
                        {status !== 'none' && (
                          <div
                            className={cn(
                              'absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full sm:right-1 sm:top-1 sm:h-2 sm:w-2',
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
