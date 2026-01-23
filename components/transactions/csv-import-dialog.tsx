'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Loader2, FileText, CheckCircle } from 'lucide-react';
import { importTransactions } from '@/lib/transactions/actions';
import type { Account, CSVTransaction } from '@/lib/types';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseDate(dateStr: string): string | null {
  const dateFormats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  ];

  for (const format of dateFormats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === dateFormats[0]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      } else if (format === dateFormats[1]) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }
  return null;
}

function parseCSV(text: string): CSVTransaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const transactions: CSVTransaction[] = [];

  // Parse header row to detect column positions
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);

  // Detect column indices
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('narrative') || h.includes('details') || h.includes('memo'));
  const payeeIdx = headers.findIndex(h => h.includes('payee') || h.includes('merchant') || h.includes('vendor'));
  const amountIdx = headers.findIndex(h => h === 'amount' || h.includes('amount'));
  const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
  const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'));

  // Fallback to positional parsing if headers not found
  const useDateIdx = dateIdx >= 0 ? dateIdx : 0;
  const useDescIdx = descIdx >= 0 ? descIdx : 1;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 3) continue;

    // Parse date
    const dateStr = fields[useDateIdx];
    const date = parseDate(dateStr);
    if (!date) continue;

    // Parse description
    const description = fields[useDescIdx];
    if (!description) continue;

    // Parse payee (if column exists)
    const payee = payeeIdx >= 0 ? fields[payeeIdx] || undefined : undefined;

    // Parse amount
    let amount = 0;
    if (amountIdx >= 0) {
      // Single amount column
      amount = parseFloat(fields[amountIdx].replace(/[^0-9.-]/g, '')) || 0;
    } else if (debitIdx >= 0 && creditIdx >= 0) {
      // Debit/Credit format
      const debit = parseFloat(fields[debitIdx].replace(/[^0-9.-]/g, '')) || 0;
      const credit = parseFloat(fields[creditIdx].replace(/[^0-9.-]/g, '')) || 0;
      amount = credit - debit;
    } else {
      // Fallback: assume amount is in column after description (or payee if present)
      const amtColIdx = payeeIdx >= 0 ? Math.max(useDescIdx, payeeIdx) + 1 : useDescIdx + 1;
      if (amtColIdx < fields.length) {
        amount = parseFloat(fields[amtColIdx].replace(/[^0-9.-]/g, '')) || 0;
      }
    }

    if (amount !== 0) {
      transactions.push({ date, description, amount, payee });
    }
  }

  return transactions;
}

export function CSVImportDialog({ open, onOpenChange, accounts }: CSVImportDialogProps) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CSVTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setImported(false);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        setError('Could not parse any transactions from the file. Please check the format.');
        return;
      }

      setTransactions(parsed);
    } catch {
      setError('Failed to read the file.');
    }
  }, []);

  const handleImport = async () => {
    if (!accountId || transactions.length === 0) return;

    setLoading(true);
    setError(null);

    const result = await importTransactions(accountId, transactions);

    if (result.success) {
      setImported(true);
      setImportedCount(result.imported);
      router.refresh();
    } else {
      setError(result.error || 'Failed to import transactions');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setTransactions([]);
    setImported(false);
    setImportedCount(0);
    setError(null);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV file from your bank to import transactions.
          </DialogDescription>
        </DialogHeader>

        {imported ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">Import Complete!</h3>
            <p className="text-muted-foreground">
              Successfully imported {importedCount} transactions.
            </p>
            <Button className="mt-4" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="account">Import to Account *</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>CSV File</Label>
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/25 px-4 py-8 transition-colors hover:border-muted-foreground/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file ? (
                      <>
                        <FileText className="h-5 w-5" />
                        <span>{file.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Click to upload CSV</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {transactions.length > 0 && (
                <div className="grid gap-2">
                  <Label>Preview ({transactions.length} transactions)</Label>
                  <div className="max-h-[300px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((t, i) => (
                          <TableRow key={i}>
                            <TableCell>{t.date}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {t.description}
                            </TableCell>
                            <TableCell
                              className={`text-right ${
                                t.amount < 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {formatCurrency(t.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {transactions.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              ... and {transactions.length - 10} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || !accountId || transactions.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {transactions.length} Transactions
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
