'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  enrolment: SchoolEnrolment;
}

export function SchoolFeesList({ enrolment }: SchoolFeesListProps) {
  const router = useRouter();
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<SchoolFee | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFee, setDeletingFee] = useState<SchoolFee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payingFee, setPayingFee] = useState<SchoolFee | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<SchoolFeePaymentData>({
    is_paid: true,
    paid_date: new Date().toISOString().split('T')[0],
    paid_amount: 0,
    payment_method: '',
  });

  useEffect(() => {
    loadFees();
  }, [enrolment.id]);

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

  function handleAddFee() {
    setEditingFee(undefined);
    setFeeDialogOpen(true);
  }

  function handleEditFee(fee: SchoolFee) {
    setEditingFee(fee);
    setFeeDialogOpen(true);
  }

  function handleDeleteClick(fee: SchoolFee) {
    setDeletingFee(fee);
    setDeleteDialogOpen(true);
  }

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

  async function handleQuickTogglePaid(fee: SchoolFee) {
    try {
      if (fee.is_paid) {
        // Mark as unpaid
        await markFeeAsPaid(fee.id, {
          is_paid: false,
          paid_date: undefined,
          paid_amount: undefined,
          payment_method: undefined,
        });
      } else {
        // Mark as paid with defaults
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

  function isOverdue(fee: SchoolFee): boolean {
    if (fee.is_paid || !fee.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(fee.due_date);
    return dueDate < today;
  }

  function isDueSoon(fee: SchoolFee): boolean {
    if (fee.is_paid || !fee.due_date) return false;
    const today = new Date();
    const dueDate = new Date(fee.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 14 && daysUntilDue >= 0;
  }

  // Calculate totals
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = fees.filter((f) => f.is_paid).reduce((sum, f) => sum + (f.paid_amount || f.amount), 0);
  const remainingFees = totalFees - paidFees;
  const overdueCount = fees.filter((f) => isOverdue(f)).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            School Fees
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
              <DollarSign className="h-5 w-5" />
              School Fees
            </CardTitle>
            {fees.length > 0 && (
              <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                <span>Total: {formatCurrency(totalFees)}</span>
                <span>•</span>
                <span className="text-green-600">Paid: {formatCurrency(paidFees)}</span>
                <span>•</span>
                <span className={remainingFees > 0 ? 'text-amber-600' : ''}>
                  Remaining: {formatCurrency(remainingFees)}
                </span>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleAddFee}>
            <Plus className="mr-1 h-4 w-4" />
            Add Fee
          </Button>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <DollarSign className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No fees recorded yet</p>
              <p className="text-sm">Click &quot;Add Fee&quot; to track school fees</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Paid</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id} className={fee.is_paid ? 'opacity-60' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={fee.is_paid}
                          onCheckedChange={() => handleQuickTogglePaid(fee)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={fee.is_paid ? 'line-through' : ''}>
                            {fee.description}
                          </span>
                          {isOverdue(fee) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Overdue
                            </Badge>
                          )}
                          {isDueSoon(fee) && !isOverdue(fee) && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                              Due Soon
                            </Badge>
                          )}
                        </div>
                        {fee.is_paid && fee.paid_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Paid {formatDate(fee.paid_date)}
                            {fee.payment_method && ` via ${fee.payment_method}`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fee.fee_type?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {fee.due_date ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(fee.due_date)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(fee.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!fee.is_paid && (
                              <>
                                <DropdownMenuItem onClick={() => handleMarkPaid(fee)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleEditFee(fee)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(fee)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Mark &quot;{payingFee?.description}&quot; as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paid_date">Payment Date</Label>
              <Input
                id="paid_date"
                type="date"
                value={paymentData.paid_date || ''}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, paid_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  className="pl-7"
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
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentData.payment_method || ''}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="bpay">BPAY</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="direct_debit">Direct Debit</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={paymentLoading}>
              {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingFee?.description}&quot;?
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
