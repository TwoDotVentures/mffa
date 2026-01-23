/**
 * Document Card Component
 *
 * Displays a single document with file info, badges, and actions.
 * Optimized for mobile viewing with touch-friendly controls.
 * Shows file type icon, metadata, and processing status.
 * Memoized to prevent unnecessary re-renders.
 *
 * @component
 * @example
 * <DocumentCard document={document} />
 */
'use client';

import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { deleteDocument } from '@/lib/documents/actions';
import { ENTITY_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';
import type { Document } from '@/lib/types';

/** Props for the DocumentCard component */
interface DocumentCardProps {
  /** Document object containing file and metadata */
  document: Document;
}

/**
 * Returns appropriate icon component based on file MIME type.
 * Images get blue icon, PDFs get red, others get gray.
 * @param fileType - MIME type of the file
 * @returns Icon wrapped in styled container
 */
function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return (
      <div className="rounded-xl bg-blue-500/10 p-3 transition-colors group-hover:bg-blue-500/15">
        <FileImage className="h-6 w-6 text-blue-500" aria-hidden="true" />
      </div>
    );
  }
  if (fileType === 'application/pdf') {
    return (
      <div className="rounded-xl bg-red-500/10 p-3 transition-colors group-hover:bg-red-500/15">
        <FileText className="h-6 w-6 text-red-500" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-gray-500/10 p-3 transition-colors group-hover:bg-gray-500/15">
      <File className="h-6 w-6 text-gray-500" aria-hidden="true" />
    </div>
  );
}

/**
 * Formats file size in human-readable format.
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats date in Australian locale.
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "15 Jan 2025")
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DocumentCardComponent({ document: doc }: DocumentCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  /**
   * Handles document deletion with confirmation.
   */
  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeleting(true);
    await deleteDocument(doc.id);
    router.refresh();
  }, [doc.id, router]);

  /**
   * Opens document in new tab for download/preview.
   */
  const handleDownload = useCallback(() => {
    if (doc.download_url) {
      window.open(doc.download_url, '_blank');
    }
  }, [doc.download_url]);

  return (
    <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg active:scale-[0.995]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon - Larger touch target on mobile */}
          <div className="shrink-0">{getFileIcon(doc.file_type)}</div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header with title and actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Document Name */}
                <h3 className="line-clamp-1 text-base leading-tight font-semibold">{doc.name}</h3>

                {/* Original Filename - Truncated */}
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  {doc.original_filename}
                </p>
              </div>

              {/* Actions Menu - 44px touch target */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted/80 h-10 w-10 shrink-0"
                    aria-label="Document options"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <MoreVertical className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </DropdownMenuItem>
                  {doc.download_url && (
                    <DropdownMenuItem onClick={handleDownload} className="gap-2">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open in New Tab
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges - Wrap on small screens */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-xs font-medium">
                {ENTITY_TYPE_LABELS[doc.entity_type]}
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {DOCUMENT_TYPE_LABELS[doc.document_type]}
              </Badge>
              {doc.financial_year && (
                <Badge variant="outline" className="text-xs font-medium">
                  FY {doc.financial_year}
                </Badge>
              )}
            </div>

            {/* Metadata Row */}
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="font-medium tabular-nums">{formatFileSize(doc.file_size)}</span>
              <span>{formatDate(doc.created_at)}</span>

              {/* Processing Status */}
              {doc.is_processed ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-medium">AI Ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                  <span className="font-medium">Processing</span>
                </span>
              )}
            </div>

            {/* Description - If present */}
            {doc.description && (
              <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
                {doc.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Memoized DocumentCard to prevent unnecessary re-renders when parent list updates */
export const DocumentCard = memo(DocumentCardComponent);
