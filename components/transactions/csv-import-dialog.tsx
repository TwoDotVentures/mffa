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

function parseCSV(text: string): CSVTransaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const transactions: CSVTransaction[] = [];

  // Skip header row and parse each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted fields
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

    // Try to parse date, description, amount
    // Common CSV formats: Date, Description, Debit, Credit, Balance
    // or: Date, Description, Amount, Balance
    if (fields.length >= 3) {
      const dateStr = fields[0];
      const description = fields[1];

      // Parse date (try various formats)
      let date = '';
      const dateFormats = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ];

      for (const format of dateFormats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === dateFormats[0]) {
            date = `${match[3]}-${match[2]}-${match[1]}`;
          } else if (format === dateFormats[1]) {
            date = `${match[1]}-${match[2]}-${match[3]}`;
          } else {
            date = `${match[3]}-${match[2]}-${match[1]}`;
          }
          break;
        }
      }

      if (!date) continue;

      // Parse amount (handle debit/credit columns or single amount column)
      let amount = 0;
      if (fields.length >= 4) {
        // Debit/Credit format
        const debit = parseFloat(fields[2].replace(/[^0-9.-]/g, '')) || 0;
        const credit = parseFloat(fields[3].replace(/[^0-9.-]/g, '')) || 0;
        amount = credit - debit;
      } else {
        // Single amount column
        amount = parseFloat(fields[2].replace(/[^0-9.-]/g, '')) || 0;
      }

      if (description && amount !== 0) {
        transactions.push({ date, description, amount });
      }
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
