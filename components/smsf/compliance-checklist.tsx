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
  Clock,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import { createOrUpdateSmsfCompliance, type SmsfCompliance } from '@/lib/smsf/actions';
import { getFinancialYear } from '@/lib/smsf/utils';
import { useRouter } from 'next/navigation';

interface ComplianceChecklistProps {
  fundId: string;
  compliance: SmsfCompliance | null;
  financialYear?: string;
}

export function ComplianceChecklist({ fundId, compliance, financialYear = getFinancialYear() }: ComplianceChecklistProps) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'lodged':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'overdue':
      case 'issues_found':
        return <Badge variant="destructive">Attention Required</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Compliance Checklist
            </CardTitle>
            <CardDescription>
              Financial Year {financialYear}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedItems}/{totalItems}</div>
            <p className="text-xs text-muted-foreground">tasks complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Annual Audit */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Annual Audit</h4>
            </div>
            {getStatusBadge(data.audit_status || 'pending')}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="audit_status">Status</Label>
              <Select
                value={data.audit_status}
                onValueChange={(value: SmsfCompliance['audit_status']) =>
                  setData({ ...data, audit_status: value })
                }
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="audit_due_date">Due Date</Label>
              <Input
                id="audit_due_date"
                type="date"
                value={data.audit_due_date || ''}
                onChange={(e) => setData({ ...data, audit_due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="audit_completed_date">Completed Date</Label>
              <Input
                id="audit_completed_date"
                type="date"
                value={data.audit_completed_date || ''}
                onChange={(e) => setData({ ...data, audit_completed_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Annual Return */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Annual Return (SAR)</h4>
            </div>
            {getStatusBadge(data.lodgement_status || 'pending')}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="lodgement_status">Status</Label>
              <Select
                value={data.lodgement_status}
                onValueChange={(value: SmsfCompliance['lodgement_status']) =>
                  setData({ ...data, lodgement_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lodged">Lodged</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="annual_return_due_date">Due Date</Label>
              <Input
                id="annual_return_due_date"
                type="date"
                value={data.annual_return_due_date || ''}
                onChange={(e) => setData({ ...data, annual_return_due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="annual_return_lodged_date">Lodged Date</Label>
              <Input
                id="annual_return_lodged_date"
                type="date"
                value={data.annual_return_lodged_date || ''}
                onChange={(e) => setData({ ...data, annual_return_lodged_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Other Requirements */}
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium">Other Requirements</h4>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="investment_strategy"
                checked={data.investment_strategy_reviewed}
                onCheckedChange={(checked) =>
                  setData({ ...data, investment_strategy_reviewed: checked as boolean })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="investment_strategy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Investment Strategy Reviewed
                </label>
                <p className="text-xs text-muted-foreground">
                  Annual review of investment strategy is mandatory
                </p>
                {data.investment_strategy_reviewed && (
                  <Input
                    type="date"
                    value={data.investment_strategy_date || ''}
                    onChange={(e) => setData({ ...data, investment_strategy_date: e.target.value })}
                    className="mt-2 w-48"
                    placeholder="Review date"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="member_statements"
                checked={data.member_statements_issued}
                onCheckedChange={(checked) =>
                  setData({ ...data, member_statements_issued: checked as boolean })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="member_statements"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Member Statements Issued
                </label>
                <p className="text-xs text-muted-foreground">
                  Annual member benefit statements provided to all members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={data.notes || ''}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="Add any compliance notes or reminders..."
            rows={3}
          />
        </div>

        {/* Warnings */}
        {(data.audit_status === 'issues_found' || data.lodgement_status === 'overdue') && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Compliance Issues Detected</p>
              <ul className="mt-1 list-disc list-inside text-xs">
                {data.audit_status === 'issues_found' && (
                  <li>Audit issues require attention before lodgement</li>
                )}
                {data.lodgement_status === 'overdue' && (
                  <li>Annual return is overdue - penalties may apply</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {completedItems === totalItems && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">
              All compliance requirements completed for FY {financialYear}
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Compliance Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
