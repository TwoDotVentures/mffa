/**
 * School Fees List Component
 *
 * Displays school fees for an enrolment with payment tracking.
 * Mobile-first responsive design with:
 * - Card-based layout on mobile, table on desktop
 * - Touch-friendly checkboxes and action buttons
 * - Clear payment status indicators
 * - Prominent due dates and amounts
 *
 * @module components/family-members/school-fees-list
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SchoolFeeDialog } from './school-fee-dialog';
import {
  getFeesByEnrolment,
  deleteSchoolFee,
  markFeeAsPaid,
} from '@/lib/family-members/actions';
import { formatCurrency, formatDate } from '@/lib/family-members/utils';
import type { SchoolEnrolment, SchoolFee, SchoolFeePaymentData } from '@/lib/types';

interface SchoolFeesListProps {
  /** The enrolment to display fees for */
  enrolment: SchoolEnrolment;
}

/**
 * School Fees List Component
 * Displays and manages school fees with payment tracking
 */
export function SchoolFeesList({ enrolment }: SchoolFeesListProps) {
  const router = useRouter();
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [loading, setLoading] = useState(true);

  /** Dialog states */
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<SchoolFee | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFee, setDeletingFee] = useState<SchoolFee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Payment dialog state */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payingFee, setPayingFee] = useState<SchoolFee | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<SchoolFeePaymentData>({
    is_paid: true,
    paid_date: new Date().toISOString().split('T')[0],
    paid_amount: 0,
    payment_method: '',
  });

  /** Load fees on enrolment change */
  useEffect(() => {
    loadFees();
  }, [enrolment.id]);

  /** Fetch fees from server */
  async function loadFees() {
    try {
      setLoading(true);
      const data = await getFeesByEnrolment(enrolment.id);
      setFees(data);
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Open add fee dialog */
  function handleAddFee() {
    setEditingFee(undefined);
    setFeeDialogOpen(true);
  }

  /** Open edit fee dialog */
  function handleEditFee(fee: SchoolFee) {
    setEditingFee(fee);
    setFeeDialogOpen(true);
  }

  /** Show delete confirmation */
  function handleDeleteClick(fee: SchoolFee) {
    setDeletingFee(fee);
    setDeleteDialogOpen(true);
  }

  /** Execute fee deletion */
  async function handleDelete() {
    if (!deletingFee) return;

    setDeleteLoading(true);
    try {
      await deleteSchoolFee(deletingFee.id);
      await loadFees();
      setDeleteDialogOpen(false);
      setDeletingFee(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting fee:', error);
    } finally {
      setDeleteLoading(false);
    }
  }

  /** Open payment dialog */
  function handleMarkPaid(fee: SchoolFee) {
    setPayingFee(fee);
    setPaymentData({
      is_paid: true,
      paid_date: new Date().toISOString().split('T')[0],
      paid_amount: fee.amount,
      payment_method: '',
    });
    setPaymentDialogOpen(true);
  }

  /** Submit payment record */
  async function handlePaymentSubmit() {
    if (!payingFee) return;

    setPaymentLoading(true);
    try {
      await markFeeAsPaid(payingFee.id, paymentData);
      await loadFees();
      setPaymentDialogOpen(false);
      setPayingFee(null);
      router.refresh();
    } catch (error) {
      console.error('Error marking fee as paid:', error);
    } finally {
      setPaymentLoading(false);
    }
  }

  /** Quick toggle paid status */
  async function handleQuickTogglePaid(fee: SchoolFee) {
    try {
      if (fee.is_paid) {
        await markFeeAsPaid(fee.id, {
          is_paid: false,
          paid_date: undefined,
          paid_amount: undefined,
          payment_method: undefined,
        });
      } else {
        await markFeeAsPaid(fee.id, {
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
          paid_amount: fee.amount,
        });
      }
      await loadFees();
      router.refresh();
    } catch (error) {
      console.error('Error toggling paid status:', error);
    }
  }

  /** Check if fee is overdue */
  function isOverdue(fee: SchoolFee): boolean {
    if (fee.is_paid || !fee.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(fee.due_date);
    return dueDate < today;
  }

  /** Check if fee is due within 14 days */
  function isDueSoon(fee: SchoolFee): boolean {
    if (fee.is_paid || !fee.due_date) return false;
    const today = new Date();
    const dueDate = new Date(fee.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 14 && daysUntilDue >= 0;
  }

  /** Calculate totals */
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = fees.filter((f) => f.is_paid).reduce((sum, f) => sum + (f.paid_amount || f.amount), 0);
  const remainingFees = totalFees - paidFees;

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            School Fees
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
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              School Fees
            </CardTitle>
            {/* Summary stats - Wrap on mobile */}
            {fees.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                <span>Total: {formatCurrency(totalFees)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-green-600">Paid: {formatCurrency(paidFees)}</span>
                <span className="hidden sm:inline">•</span>
                <span className={remainingFees > 0 ? 'text-amber-600' : ''}>
                  Remaining: {formatCurrency(remainingFees)}
                </span>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleAddFee} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Fee
          </Button>
        </CardHeader>

        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {fees.length === 0 ? (
            /* Empty state */
            <div className="py-6 text-center text-muted-foreground sm:py-8">
              <DollarSign className="mx-auto h-10 w-10 opacity-50 sm:h-12 sm:w-12" />
              <p className="mt-2 text-sm">No fees recorded yet</p>
              <p className="text-xs sm:text-sm">Click &quot;Add Fee&quot; to track school fees</p>
            </div>
          ) : (
            /* Fee Cards - Mobile optimized */
            <div className="space-y-2 sm:space-y-3">
              {fees.map((fee) => (
                <div
                  key={fee.id}
                  className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors sm:items-center sm:p-4 ${
                    fee.is_paid ? 'bg-muted/30 opacity-70' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={fee.is_paid}
                    onCheckedChange={() => handleQuickTogglePaid(fee)}
                    className="mt-0.5 h-5 w-5 sm:mt-0"
                  />

                  {/* Fee Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-1.5 sm:items-center sm:gap-2">
                      <span className={`text-sm font-medium sm:text-base ${fee.is_paid ? 'line-through' : ''}`}>
                        {fee.description}
                      </span>
                      {/* Status badges */}
                      {isOverdue(fee) && (
                        <Badge variant="destructive" className="text-[10px] sm:text-xs">
                          <AlertCircle className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                          Overdue
                        </Badge>
                      )}
                      {isDueSoon(fee) && !isOverdue(fee) && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs">
                          Due Soon
                        </Badge>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground sm:text-xs">
                      {fee.fee_type?.name && <span>{fee.fee_type.name}</span>}
                      {fee.due_date && (
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formatDate(fee.due_date)}
                        </span>
                      )}
                      {fee.is_paid && fee.paid_date && (
                        <span>
                          Paid {formatDate(fee.paid_date)}
                          {fee.payment_method && ` via ${fee.payment_method}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold sm:text-base">
                      {formatCurrency(fee.amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px]">
                      {!fee.is_paid && (
                        <>
                          <DropdownMenuItem onClick={() => handleMarkPaid(fee)} className="gap-2 py-2">
                            <Check className="h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleEditFee(fee)} className="gap-2 py-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 py-2 text-destructive focus:text-destructive"
                        onClick={() => handleDeleteClick(fee)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Dialog */}
      <SchoolFeeDialog
        open={feeDialogOpen}
        onOpenChange={setFeeDialogOpen}
        enrolment={enrolment}
        fee={editingFee}
        onSuccess={() => loadFees()}
      />

      {/* Payment Dialog - Mobile optimized */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Record Payment</DialogTitle>
            <DialogDescription className="text-sm">
              Mark &quot;{payingFee?.description}&quot; as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paid_date" className="text-sm">Payment Date</Label>
              <Input
                id="paid_date"
                type="date"
                className="h-11 text-base sm:h-10 sm:text-sm"
                value={paymentData.paid_date || ''}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, paid_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_amount" className="text-sm">Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                  value={paymentData.paid_amount || ''}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paid_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method" className="text-sm">Payment Method</Label>
              <Select
                value={paymentData.payment_method || ''}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, payment_method: value })
                }
              >
                <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                  <SelectValue placeholder="Select method (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer" className="py-2.5 sm:py-2">Bank Transfer</SelectItem>
                  <SelectItem value="bpay" className="py-2.5 sm:py-2">BPAY</SelectItem>
                  <SelectItem value="credit_card" className="py-2.5 sm:py-2">Credit Card</SelectItem>
                  <SelectItem value="direct_debit" className="py-2.5 sm:py-2">Direct Debit</SelectItem>
                  <SelectItem value="cash" className="py-2.5 sm:py-2">Cash</SelectItem>
                  <SelectItem value="other" className="py-2.5 sm:py-2">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={paymentLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Fee</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete &quot;{deletingFee?.description}&quot;?
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
