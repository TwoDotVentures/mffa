'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, FileText, CheckCircle, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { importTransactions, createCategories } from '@/lib/transactions/actions';
import type { Account, Category, CSVTransaction } from '@/lib/types';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
}

interface CategoryMappingState {
  csvCategory: string;
  action: 'create' | 'map';
  existingCategoryId: string;
  transactionType: 'income' | 'expense' | 'transfer';
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
  if (!dateStr) return null;

  const cleanDate = dateStr.trim();

  // Try various date formats
  const dateFormats: { regex: RegExp; parse: (m: RegExpMatchArray) => string }[] = [
    // DD/MM/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parse: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` },
    // YYYY-MM-DD
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` },
    // DD-MM-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, parse: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` },
    // DD/MM/YY (assume 20xx for years < 50, 19xx otherwise)
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, parse: (m) => {
      const year = parseInt(m[3]) < 50 ? `20${m[3]}` : `19${m[3]}`;
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }},
    // DD-MM-YY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/, parse: (m) => {
      const year = parseInt(m[3]) < 50 ? `20${m[3]}` : `19${m[3]}`;
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }},
    // YYYY/MM/DD
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` },
    // DD MMM YYYY (e.g., 15 Jan 2024)
    { regex: /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i, parse: (m) => {
      const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
    }},
    // MMM DD, YYYY (e.g., Jan 15, 2024)
    { regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})$/i, parse: (m) => {
      const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      return `${m[3]}-${months[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;
    }},
  ];

  for (const { regex, parse } of dateFormats) {
    const match = cleanDate.match(regex);
    if (match) {
      return parse(match);
    }
  }

  // Last resort: try JavaScript Date parsing
  const parsed = new Date(cleanDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
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
  const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type'));
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
    if (fields.length < 2) continue; // Need at least date and description

    // Parse date
    const dateStr = fields[useDateIdx];
    const date = parseDate(dateStr);
    if (!date) continue;

    // Parse description
    const description = fields[useDescIdx];
    if (!description) continue;

    // Parse payee (if column exists)
    const payee = payeeIdx >= 0 ? fields[payeeIdx] || undefined : undefined;

    // Parse category (if column exists)
    const category = categoryIdx >= 0 ? fields[categoryIdx] || undefined : undefined;

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

    // Include all transactions (even zero amounts)
    transactions.push({ date, description, amount, payee, category });
  }

  return transactions;
}

type ImportStep = 'upload' | 'categories' | 'preview' | 'complete';

export function CSVImportDialog({ open, onOpenChange, accounts, categories }: CSVImportDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CSVTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Category mapping state
  const [categoryMappings, setCategoryMappings] = useState<Record<string, CategoryMappingState>>({});

  // Get unique categories from CSV that don't exist
  const csvCategories = useMemo(() => {
    const unique = new Set<string>();
    for (const t of transactions) {
      if (t.category) {
        unique.add(t.category);
      }
    }
    return Array.from(unique);
  }, [transactions]);

  // Categorize CSV categories as existing or new
  const { existingCategories, newCategories } = useMemo(() => {
    const existing: string[] = [];
    const newCats: string[] = [];

    for (const csvCat of csvCategories) {
      const match = categories.find(
        c => c.name.toLowerCase() === csvCat.toLowerCase()
      );
      if (match) {
        existing.push(csvCat);
      } else {
        newCats.push(csvCat);
      }
    }

    return { existingCategories: existing, newCategories: newCats };
  }, [csvCategories, categories]);

  // Initialize category mappings when new categories are detected
  const initializeCategoryMappings = useCallback(() => {
    const mappings: Record<string, CategoryMappingState> = {};

    // Auto-map existing categories
    for (const csvCat of existingCategories) {
      const match = categories.find(
        c => c.name.toLowerCase() === csvCat.toLowerCase()
      );
      if (match) {
        mappings[csvCat] = {
          csvCategory: csvCat,
          action: 'map',
          existingCategoryId: match.id,
          transactionType: match.category_type as 'income' | 'expense',
        };
      }
    }

    // Default new categories to 'create' with expense type
    for (const csvCat of newCategories) {
      mappings[csvCat] = {
        csvCategory: csvCat,
        action: 'create',
        existingCategoryId: '',
        transactionType: 'expense',
      };
    }

    setCategoryMappings(mappings);
  }, [existingCategories, newCategories, categories]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

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

  const handleNext = useCallback(() => {
    if (step === 'upload') {
      if (newCategories.length > 0) {
        initializeCategoryMappings();
        setStep('categories');
      } else {
        initializeCategoryMappings();
        setStep('preview');
      }
    } else if (step === 'categories') {
      setStep('preview');
    }
  }, [step, newCategories.length, initializeCategoryMappings]);

  const handleBack = useCallback(() => {
    if (step === 'categories') {
      setStep('upload');
    } else if (step === 'preview') {
      if (newCategories.length > 0) {
        setStep('categories');
      } else {
        setStep('upload');
      }
    }
  }, [step, newCategories.length]);

  const updateCategoryMapping = (csvCategory: string, field: keyof CategoryMappingState, value: string) => {
    setCategoryMappings(prev => ({
      ...prev,
      [csvCategory]: {
        ...prev[csvCategory],
        [field]: value,
        // Reset existingCategoryId when switching to create
        ...(field === 'action' && value === 'create' ? { existingCategoryId: '' } : {}),
      },
    }));
  };

  const handleImport = async () => {
    if (!accountId || transactions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // First, create any new categories
      const categoriesToCreate = Object.values(categoryMappings)
        .filter(m => m.action === 'create')
        .map(m => ({
          name: m.csvCategory,
          categoryType: m.transactionType,
        }));

      let categoryMap: Record<string, string> = {};

      if (categoriesToCreate.length > 0) {
        const createResult = await createCategories(categoriesToCreate);
        if (!createResult.success) {
          setError(createResult.error || 'Failed to create categories');
          setLoading(false);
          return;
        }
        categoryMap = { ...createResult.created };
      }

      // Add existing category mappings
      for (const [csvCat, mapping] of Object.entries(categoryMappings)) {
        if (mapping.action === 'map' && mapping.existingCategoryId) {
          categoryMap[csvCat] = mapping.existingCategoryId;
        }
      }

      // Import transactions with category mapping
      const result = await importTransactions(accountId, transactions, categoryMap);

      if (result.success) {
        setImportedCount(result.imported);
        setStep('complete');
        router.refresh();
      } else {
        setError(result.error || 'Failed to import transactions');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setTransactions([]);
    setStep('upload');
    setImportedCount(0);
    setError(null);
    setCategoryMappings({});
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Import Transactions'}
            {step === 'categories' && 'Map Categories'}
            {step === 'preview' && 'Preview Import'}
            {step === 'complete' && 'Import Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file from your bank to import transactions.'}
            {step === 'categories' && 'Some categories in your CSV don\'t exist yet. Choose how to handle them.'}
            {step === 'preview' && 'Review your transactions before importing.'}
            {step === 'complete' && `Successfully imported ${importedCount} transactions.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'complete' ? (
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
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {step === 'upload' && (
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
                    <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/25 px-4 py-8 transition-colors hover:border-muted-foreground/50">
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
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <p><strong>{transactions.length}</strong> transactions found</p>
                    {csvCategories.length > 0 && (
                      <p className="mt-1">
                        <strong>{csvCategories.length}</strong> categories detected
                        {newCategories.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
                            {' '}({newCategories.length} new)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 'categories' && (
              <div className="grid gap-4">
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {newCategories.length} new {newCategories.length === 1 ? 'category' : 'categories'} found
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Choose to create them or map to existing categories.
                  </p>
                </div>

                <div className="max-h-[400px] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV Category</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Map To / Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newCategories.map((csvCat) => {
                        const mapping = categoryMappings[csvCat];
                        if (!mapping) return null;

                        return (
                          <TableRow key={csvCat}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{csvCat}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={mapping.action}
                                onValueChange={(v) => updateCategoryMapping(csvCat, 'action', v)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="create">
                                    <span className="flex items-center gap-2">
                                      <Plus className="h-3 w-3" /> Create New
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="map">
                                    <span className="flex items-center gap-2">
                                      <ArrowRight className="h-3 w-3" /> Map to Existing
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {mapping.action === 'create' ? (
                                <Select
                                  value={mapping.transactionType}
                                  onValueChange={(v) => updateCategoryMapping(csvCat, 'transactionType', v)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Select
                                  value={mapping.existingCategoryId}
                                  onValueChange={(v) => updateCategoryMapping(csvCat, 'existingCategoryId', v)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {existingCategories.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                      {existingCategories.length} {existingCategories.length === 1 ? 'category' : 'categories'} auto-matched: {existingCategories.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Preview ({transactions.length} transactions)</Label>
                  <div className="max-h-[300px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((t, i) => (
                          <TableRow key={i}>
                            <TableCell>{t.date}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {t.description}
                            </TableCell>
                            <TableCell>
                              {t.category ? (
                                <Badge variant="secondary" className="truncate max-w-[100px]">
                                  {t.category}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
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
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              ... and {transactions.length - 10} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {Object.keys(categoryMappings).length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Categories to create:{' '}
                      {Object.values(categoryMappings).filter(m => m.action === 'create').length}
                    </p>
                    <p>
                      Categories to map:{' '}
                      {Object.values(categoryMappings).filter(m => m.action === 'map').length}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {step !== 'upload' && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step === 'upload' && (
                <Button
                  onClick={handleNext}
                  disabled={!accountId || transactions.length === 0}
                >
                  Next
                </Button>
              )}
              {step === 'categories' && (
                <Button onClick={handleNext}>
                  Continue to Preview
                </Button>
              )}
              {step === 'preview' && (
                <Button
                  onClick={handleImport}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import {transactions.length} Transactions
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
