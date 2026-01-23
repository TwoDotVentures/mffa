/**
 * Document Upload Dialog Component
 *
 * Full-screen modal on mobile, centered dialog on desktop.
 * Features drag-and-drop file upload with visual feedback.
 * Form fields are optimized for touch input.
 *
 * @component
 * @example
 * <DocumentUploadDialog open={open} onOpenChange={setOpen} />
 */
'use client';

import { useState, useRef, useCallback } from 'react';
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
import { Loader2, Upload, FileText, X, AlertCircle, CheckCircle, File } from 'lucide-react';
import { uploadDocument } from '@/lib/documents/actions';
import { ENTITY_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';
import type { EntityType, DocumentType } from '@/lib/types';

/** Props for the DocumentUploadDialog component */
interface DocumentUploadDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Formats file size in human-readable format.
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form fields
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');
  const [financialYear, setFinancialYear] = useState('');

  /**
   * Handles drag events for the drop zone.
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handles file drop event.
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  /**
   * Handles file selection from input.
   */
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  /**
   * Processes selected file and auto-fills name.
   */
  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      if (!name) {
        // Remove extension and use as document name
        setName(f.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    },
    [name]
  );

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('entity_type', entityType);
    formData.append('document_type', documentType);
    if (description) formData.append('description', description);
    if (financialYear && financialYear !== 'none') formData.append('financial_year', financialYear);

    const result = await uploadDocument(formData);

    if (result.success) {
      onOpenChange(false);
      resetForm();
      router.refresh();
    } else {
      setError(result.error || 'Upload failed');
    }

    setLoading(false);
  };

  /**
   * Resets form to initial state.
   */
  const resetForm = useCallback(() => {
    setFile(null);
    setName('');
    setEntityType('personal');
    setDocumentType('other');
    setDescription('');
    setFinancialYear('');
    setError(null);
  }, []);

  // Generate FY options (last 5 years)
  const fyOptions: string[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 5; i++) {
    const year = currentMonth >= 6 ? currentYear - i : currentYear - 1 - i;
    fyOptions.push(`${year}-${(year + 1).toString().slice(-2)}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      {/*
        Dialog Content - Full screen on mobile, centered on desktop.
        Max width of 550px for comfortable reading.
        Scrollable content for smaller screens.
      */}
      <DialogContent className="flex max-h-[100dvh] w-full flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-[550px] sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          {/* Header - Sticky on mobile */}
          <DialogHeader className="border-b px-4 pt-4 pb-2 sm:border-0 sm:px-0 sm:pt-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2.5">
                <Upload className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg">Upload Document</DialogTitle>
                <DialogDescription className="text-sm">
                  Upload a financial document to store and make searchable by the AI Accountant.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-950/50">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* File Drop Zone */}
            <div
              className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-8 ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
              } `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                /* File Selected State */
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <div className="bg-primary/10 rounded-xl p-3">
                    <FileText className="text-primary h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-foreground line-clamp-1 font-semibold">{file.name}</p>
                    <p className="text-muted-foreground text-sm">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 h-10 w-10 sm:relative sm:top-0 sm:right-0"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Empty State */
                <>
                  <div className="bg-muted/50 mx-auto mb-3 rounded-full p-4">
                    <Upload className="text-muted-foreground h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="text-foreground text-sm font-medium">
                    Drag and drop a file, or{' '}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    PDF, images, or text files up to 10MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.csv"
              />
            </div>

            {/* Document Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Document Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bank Statement - January 2025"
                className="h-12 text-base sm:h-10 sm:text-sm"
                required
                autoComplete="off"
              />
            </div>

            {/* Entity & Document Type - Side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Entity</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                  <SelectTrigger className="h-12 text-base sm:h-10 sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Document Type</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => setDocumentType(v as DocumentType)}
                >
                  <SelectTrigger className="h-12 text-base sm:h-10 sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Financial Year */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Financial Year
                <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
              </Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger className="h-12 text-base sm:h-10 sm:text-sm">
                  <SelectValue placeholder="Select financial year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {fyOptions.map((fy) => (
                    <SelectItem key={fy} value={fy}>
                      FY {fy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
                <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this document..."
                rows={3}
                className="min-h-[80px] resize-none text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Footer - Sticky on mobile */}
          <DialogFooter className="bg-background flex-row gap-3 border-t px-4 py-4 sm:border-0 sm:bg-transparent sm:px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 sm:h-10 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="h-12 flex-1 sm:h-10 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
