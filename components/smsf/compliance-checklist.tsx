/**
 * @fileoverview SMSF Compliance Checklist Component
 * @description Tracks annual compliance requirements for SMSF including audit,
 * annual return lodgement, and other regulatory requirements.
 *
 * @features
 * - Progress tracking with visual completion bar
 * - Annual audit status management
 * - Annual return (SAR) lodgement tracking
 * - Investment strategy review checkbox
 * - Member statements checkbox
 * - Compliance warnings for overdue items
 * - Mobile-optimized form layout
 *
 * @mobile Full-width sections with touch-friendly inputs
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import { createOrUpdateSmsfCompliance, type SmsfCompliance } from '@/lib/smsf/actions';
import { getFinancialYear } from '@/lib/smsf/utils';
import { useRouter } from 'next/navigation';

/** Props interface for ComplianceChecklist component */
interface ComplianceChecklistProps {
  /** SMSF fund ID */
  fundId: string;
  /** Existing compliance record or null */
  compliance: SmsfCompliance | null;
  /** Financial year for compliance (defaults to current) */
  financialYear?: string;
}

/**
 * Compliance Checklist Component
 *
 * Manages SMSF compliance requirements with progress tracking
 * and status management for audit, lodgement, and other requirements.
 *
 * @param props - Component props
 * @returns Rendered compliance checklist
 */
export function ComplianceChecklist({
  fundId,
  compliance,
  financialYear = getFinancialYear(),
}: ComplianceChecklistProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<SmsfCompliance>>({
    audit_due_date: compliance?.audit_due_date || '',
    audit_completed_date: compliance?.audit_completed_date || '',
    audit_status: compliance?.audit_status || 'pending',
    annual_return_due_date: compliance?.annual_return_due_date || '',
    annual_return_lodged_date: compliance?.annual_return_lodged_date || '',
    lodgement_status: compliance?.lodgement_status || 'pending',
    investment_strategy_reviewed: compliance?.investment_strategy_reviewed || false,
    investment_strategy_date: compliance?.investment_strategy_date || '',
    member_statements_issued: compliance?.member_statements_issued || false,
    notes: compliance?.notes || '',
  });

  /**
   * Saves the compliance status to the database
   */
  const handleSave = async () => {
    setLoading(true);
    try {
      await createOrUpdateSmsfCompliance(fundId, financialYear, data);
      router.refresh();
    } catch (error) {
      console.error('Failed to save compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Returns a status badge for the given status
   * @param status - Compliance status value
   * @returns Badge component with appropriate variant
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'lodged':
        return <Badge className="bg-green-500 text-xs">Done</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-xs">In Progress</Badge>;
      case 'overdue':
      case 'issues_found':
        return <Badge variant="destructive" className="text-xs">Attention</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  // Calculate completion progress
  const completedItems = [
    data.audit_status === 'completed',
    data.lodgement_status === 'lodged',
    data.investment_strategy_reviewed,
    data.member_statements_issued,
  ].filter(Boolean).length;

  const totalItems = 4;
  const completionPercent = (completedItems / totalItems) * 100;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              Compliance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              FY {financialYear}
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{completedItems}/{totalItems}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 sm:mt-4 h-2 sm:h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Annual Audit Section */}
        <div className="space-y-3 rounded-lg border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <h4 className="font-medium text-sm sm:text-base">Annual Audit</h4>
            </div>
            {getStatusBadge(data.audit_status || 'pending')}
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="audit_status" className="text-xs sm:text-sm">Status</Label>
              <Select
                value={data.audit_status}
                onValueChange={(value: SmsfCompliance['audit_status']) =>
                  setData({ ...data, audit_status: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="issues_found">Issues Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit_due_date" className="text-xs sm:text-sm">Due Date</Label>
              <Input
                id="audit_due_date"
                type="date"
                value={data.audit_due_date || ''}
                onChange={(e) => setData({ ...data, audit_due_date: e.target.value })}
                className="h-10 sm:h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit_completed_date" className="text-xs sm:text-sm">Completed</Label>
              <Input
                id="audit_completed_date"
                type="date"
                value={data.audit_completed_date || ''}
                onChange={(e) => setData({ ...data, audit_completed_date: e.target.value })}
                className="h-10 sm:h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Annual Return Section */}
        <div className="space-y-3 rounded-lg border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <h4 className="font-medium text-sm sm:text-base">Annual Return</h4>
            </div>
            {getStatusBadge(data.lodgement_status || 'pending')}
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lodgement_status" className="text-xs sm:text-sm">Status</Label>
              <Select
                value={data.lodgement_status}
                onValueChange={(value: SmsfCompliance['lodgement_status']) =>
                  setData({ ...data, lodgement_status: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lodged">Lodged</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="annual_return_due_date" className="text-xs sm:text-sm">Due Date</Label>
              <Input
                id="annual_return_due_date"
                type="date"
                value={data.annual_return_due_date || ''}
                onChange={(e) => setData({ ...data, annual_return_due_date: e.target.value })}
                className="h-10 sm:h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="annual_return_lodged_date" className="text-xs sm:text-sm">Lodged</Label>
              <Input
                id="annual_return_lodged_date"
                type="date"
                value={data.annual_return_lodged_date || ''}
                onChange={(e) => setData({ ...data, annual_return_lodged_date: e.target.value })}
                className="h-10 sm:h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Other Requirements */}
        <div className="space-y-4 rounded-lg border p-3 sm:p-4">
          <h4 className="font-medium text-sm sm:text-base">Other Requirements</h4>

          <div className="space-y-4">
            {/* Investment Strategy Review */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="investment_strategy"
                checked={data.investment_strategy_reviewed}
                onCheckedChange={(checked) =>
                  setData({ ...data, investment_strategy_reviewed: checked as boolean })
                }
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none min-w-0">
                <label
                  htmlFor="investment_strategy"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Investment Strategy Reviewed
                </label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Annual review is mandatory
                </p>
                {data.investment_strategy_reviewed && (
                  <Input
                    type="date"
                    value={data.investment_strategy_date || ''}
                    onChange={(e) => setData({ ...data, investment_strategy_date: e.target.value })}
                    className="mt-2 w-full sm:w-48 h-9 text-sm"
                    placeholder="Review date"
                  />
                )}
              </div>
            </div>

            {/* Member Statements */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="member_statements"
                checked={data.member_statements_issued}
                onCheckedChange={(checked) =>
                  setData({ ...data, member_statements_issued: checked as boolean })
                }
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="member_statements"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Member Statements Issued
                </label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Annual statements to all members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
          <Textarea
            id="notes"
            value={data.notes || ''}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="Compliance notes or reminders..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Warnings */}
        {(data.audit_status === 'issues_found' || data.lodgement_status === 'overdue') && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 sm:p-4 text-destructive">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-medium">Issues Detected</p>
              <ul className="mt-1 list-disc list-inside text-[10px] sm:text-xs">
                {data.audit_status === 'issues_found' && (
                  <li>Audit issues need attention</li>
                )}
                {data.lodgement_status === 'overdue' && (
                  <li>Return overdue - penalties may apply</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Success message */}
        {completedItems === totalItems && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 p-3 sm:p-4 text-green-700 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">
              All requirements completed for FY {financialYear}
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
