/**
 * CSVImportDialog Component
 *
 * Multi-step wizard for importing transactions from CSV files.
 * Features file upload, category mapping, and preview steps.
 * Fully optimized for mobile with step indicators and large touch targets.
 *
 * @mobile Full-screen wizard with step-by-step navigation
 * @desktop Standard modal with horizontal step indicators
 * @touch Large file drop zone and touch-friendly controls
 */
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
  DialogBody,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { importTransactions, createCategories } from '@/lib/transactions/actions';
import type { Account, Category, CSVTransaction } from '@/lib/types';

/** Props for CSVImportDialog component */
interface CSVImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Available accounts for import target */
  accounts: Account[];
  /** Existing categories for mapping */
  categories: Category[];
}

/** Category mapping configuration */
interface CategoryMappingState {
  csvCategory: string;
  action: 'create' | 'map';
  existingCategoryId: string;
  transactionType: 'income' | 'expense' | 'transfer';
}

/**
 * Parses a CSV line handling quoted fields
 */
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

/**
 * Parses various date formats into ISO format
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const cleanDate = dateStr.trim();

  // Try various date formats
  const dateFormats: { regex: RegExp; parse: (m: RegExpMatchArray) => string }[] = [
    // DD/MM/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parse: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`,
    },
    // YYYY-MM-DD
    {
      regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
    },
    // DD-MM-YYYY
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      parse: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`,
    },
    // DD/MM/YY (assume 20xx for years < 50, 19xx otherwise)
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
      parse: (m) => {
        const year = parseInt(m[3]) < 50 ? `20${m[3]}` : `19${m[3]}`;
        return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      },
    },
    // DD-MM-YY
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/,
      parse: (m) => {
        const year = parseInt(m[3]) < 50 ? `20${m[3]}` : `19${m[3]}`;
        return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      },
    },
    // YYYY/MM/DD
    {
      regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
    },
    // DD MMM YYYY (e.g., 15 Jan 2024)
    {
      regex: /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i,
      parse: (m) => {
        const months: Record<string, string> = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };
        return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
      },
    },
    // MMM DD, YYYY (e.g., Jan 15, 2024)
    {
      regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})$/i,
      parse: (m) => {
        const months: Record<string, string> = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };
        return `${m[3]}-${months[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;
      },
    },
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

/**
 * Parses CSV text into transaction objects
 */
function parseCSV(text: string): CSVTransaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const transactions: CSVTransaction[] = [];

  // Parse header row to detect column positions
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);

  // Detect column indices
  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const descIdx = headers.findIndex(
    (h) =>
      h.includes('description') ||
      h.includes('narrative') ||
      h.includes('details') ||
      h.includes('memo')
  );
  const payeeIdx = headers.findIndex(
    (h) => h.includes('payee') || h.includes('merchant') || h.includes('vendor')
  );
  const categoryIdx = headers.findIndex((h) => h.includes('category') || h.includes('type'));
  const amountIdx = headers.findIndex((h) => h === 'amount' || h.includes('amount'));
  const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('withdrawal'));
  const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('deposit'));

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

/** Import wizard steps */
type ImportStep = 'upload' | 'categories' | 'preview' | 'complete';

/**
 * Formats currency for display
 */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

/**
 * Multi-step CSV import wizard dialog
 */
export function CSVImportDialog({
  open,
  onOpenChange,
  accounts,
  categories,
}: CSVImportDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CSVTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Category mapping state
  const [categoryMappings, setCategoryMappings] = useState<Record<string, CategoryMappingState>>(
    {}
  );

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
      const match = categories.find((c) => c.name.toLowerCase() === csvCat.toLowerCase());
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
      const match = categories.find((c) => c.name.toLowerCase() === csvCat.toLowerCase());
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

  /**
   * Handles file selection and parsing
   */
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

  /**
   * Advances to next step
   */
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

  /**
   * Goes back to previous step
   */
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

  /**
   * Updates a category mapping field
   */
  const updateCategoryMapping = (
    csvCategory: string,
    field: keyof CategoryMappingState,
    value: string
  ) => {
    setCategoryMappings((prev) => ({
      ...prev,
      [csvCategory]: {
        ...prev[csvCategory],
        [field]: value,
        // Reset existingCategoryId when switching to create
        ...(field === 'action' && value === 'create' ? { existingCategoryId: '' } : {}),
      },
    }));
  };

  /**
   * Handles the import process
   */
  const handleImport = async () => {
    if (!accountId || transactions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // First, create any new categories
      const categoriesToCreate = Object.values(categoryMappings)
        .filter((m) => m.action === 'create')
        .map((m) => ({
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
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  /**
   * Closes dialog and resets state
   */
  const handleClose = () => {
    setFile(null);
    setTransactions([]);
    setStep('upload');
    setImportedCount(0);
    setError(null);
    setCategoryMappings({});
    onOpenChange(false);
  };

  // Calculate transaction summary
  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.amount > 0);
    const expenses = transactions.filter((t) => t.amount < 0);
    return {
      total: transactions.length,
      income: income.length,
      expenses: expenses.length,
      incomeTotal: income.reduce((sum, t) => sum + t.amount, 0),
      expenseTotal: Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0)),
    };
  }, [transactions]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-[700px] p-0 sm:p-6 gap-0">
        {/* Header - Sticky */}
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-0 sm:pt-0 border-b sm:border-0 flex-shrink-0">
          <DialogTitle className="text-lg">
            {step === 'upload' && 'Import Transactions'}
            {step === 'categories' && 'Map Categories'}
            {step === 'preview' && 'Preview Import'}
            {step === 'complete' && 'Import Complete'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === 'upload' && 'Upload a CSV file from your bank to import transactions.'}
            {step === 'categories' &&
              "Some categories in your CSV don't exist yet. Choose how to handle them."}
            {step === 'preview' && 'Review your transactions before importing.'}
            {step === 'complete' && `Successfully imported ${importedCount} transactions.`}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator - Mobile */}
        {step !== 'complete' && (
          <div className="sm:hidden px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step{' '}
                {step === 'upload' ? '1' : step === 'categories' ? '2' : '3'} of{' '}
                {newCategories.length > 0 ? '3' : '2'}
              </span>
              <div className="flex gap-1.5">
                <div
                  className={`h-2 w-8 rounded-full ${
                    step === 'upload' ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                {newCategories.length > 0 && (
                  <div
                    className={`h-2 w-8 rounded-full ${
                      step === 'categories' ? 'bg-primary' : step === 'preview' ? 'bg-muted' : 'bg-muted'
                    }`}
                  />
                )}
                <div
                  className={`h-2 w-8 rounded-full ${
                    step === 'preview' ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0">
          {step === 'complete' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground text-center mt-2">
                Successfully imported {importedCount} transactions.
              </p>
              <Button className="mt-6 h-11" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Error Display */}
              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step: Upload */}
              {step === 'upload' && (
                <div className="space-y-4">
                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="account" className="text-sm font-medium">
                      Import to Account *
                    </Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger className="h-11">
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

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CSV File</Label>
                    <label className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-10 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50 active:bg-muted">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {file ? (
                        <>
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">Click to upload CSV</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            or drag and drop
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Transaction Summary */}
                  {transactions.length > 0 && (
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {summary.total} transactions found
                        </span>
                        {csvCategories.length > 0 && (
                          <Badge variant="secondary">
                            {csvCategories.length} categories
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Income:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(summary.incomeTotal)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                          <span className="text-muted-foreground">Expenses:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(summary.expenseTotal)}
                          </span>
                        </div>
                      </div>
                      {newCategories.length > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {newCategories.length} new{' '}
                          {newCategories.length === 1 ? 'category' : 'categories'} will need
                          to be created
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Categories */}
              {step === 'categories' && (
                <div className="space-y-4">
                  {/* New Categories Alert */}
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="font-medium text-amber-700 dark:text-amber-400 text-sm">
                      {newCategories.length} new{' '}
                      {newCategories.length === 1 ? 'category' : 'categories'} found
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Choose to create them or map to existing categories.
                    </p>
                  </div>

                  {/* Category Mapping Cards */}
                  <div className="space-y-3">
                    {newCategories.map((csvCat) => {
                      const mapping = categoryMappings[csvCat];
                      if (!mapping) return null;

                      return (
                        <div
                          key={csvCat}
                          className="rounded-lg border bg-card p-4 space-y-3"
                        >
                          {/* Category Name */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              {csvCat}
                            </Badge>
                          </div>

                          {/* Action Selection */}
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={mapping.action === 'create' ? 'default' : 'outline'}
                              size="sm"
                              className="h-10 justify-start"
                              onClick={() => updateCategoryMapping(csvCat, 'action', 'create')}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create New
                            </Button>
                            <Button
                              type="button"
                              variant={mapping.action === 'map' ? 'default' : 'outline'}
                              size="sm"
                              className="h-10 justify-start"
                              onClick={() => updateCategoryMapping(csvCat, 'action', 'map')}
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Map Existing
                            </Button>
                          </div>

                          {/* Type or Mapping Selection */}
                          {mapping.action === 'create' ? (
                            <Select
                              value={mapping.transactionType}
                              onValueChange={(v) =>
                                updateCategoryMapping(csvCat, 'transactionType', v)
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Category type" />
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
                              onValueChange={(v) =>
                                updateCategoryMapping(csvCat, 'existingCategoryId', v)
                              }
                            >
                              <SelectTrigger className="h-10">
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
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto-matched Categories */}
                  {existingCategories.length > 0 && (
                    <div className="text-sm text-muted-foreground flex items-start gap-2 pt-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {existingCategories.length}{' '}
                        {existingCategories.length === 1 ? 'category' : 'categories'}{' '}
                        auto-matched: {existingCategories.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Preview */}
              {step === 'preview' && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">
                        Ready to import {transactions.length} transactions
                      </span>
                    </div>
                    {Object.keys(categoryMappings).length > 0 && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Categories to create:{' '}
                          {
                            Object.values(categoryMappings).filter((m) => m.action === 'create')
                              .length
                          }
                        </p>
                        <p>
                          Categories to map:{' '}
                          {
                            Object.values(categoryMappings).filter((m) => m.action === 'map')
                              .length
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Transaction Preview List */}
                  <div className="rounded-lg border divide-y max-h-[300px] overflow-y-auto">
                    {transactions.slice(0, 10).map((t, i) => (
                      <div key={i} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.description}</p>
                          <p className="text-xs text-muted-foreground">{t.date}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {t.category && (
                            <Badge variant="secondary" className="text-xs max-w-[80px] truncate">
                              {t.category}
                            </Badge>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              t.amount < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {formatCurrency(t.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {transactions.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        ... and {transactions.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Sticky */}
        {step !== 'complete' && (
          <DialogFooter className="px-4 py-4 sm:px-0 sm:pt-0 border-t sm:border-0 bg-background flex-shrink-0 gap-2 sm:gap-0">
            {step !== 'upload' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-11 sm:h-10 flex-1 sm:flex-initial"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 sm:h-10 flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            {step === 'upload' && (
              <Button
                onClick={handleNext}
                disabled={!accountId || transactions.length === 0}
                className="h-11 sm:h-10 flex-1 sm:flex-initial"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 'categories' && (
              <Button onClick={handleNext} className="h-11 sm:h-10 flex-1 sm:flex-initial">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 'preview' && (
              <Button
                onClick={handleImport}
                disabled={loading}
                className="h-11 sm:h-10 flex-1 sm:flex-initial"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {transactions.length} Transactions
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
