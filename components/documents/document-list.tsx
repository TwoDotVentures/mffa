/**
 * Document List Component
 *
 * Renders a grid of document cards with responsive layout.
 * Single column on mobile for list-style viewing.
 * Includes empty state with helpful guidance.
 *
 * @component
 * @example
 * <DocumentList documents={documents} />
 */
'use client';

import { DocumentCard } from './document-card';
import { FileText, Upload, Sparkles } from 'lucide-react';
import type { Document } from '@/lib/types';

/** Props for the DocumentList component */
interface DocumentListProps {
  /** Array of documents to display */
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  /**
   * Empty State Component
   * Shown when no documents exist or match filters.
   * Provides guidance on getting started.
   */
  if (documents.length === 0) {
    return (
      <div className="hover:border-primary/30 hover:bg-muted/30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors sm:py-20">
        {/* Icon */}
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <FileText className="text-primary h-8 w-8" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h3 className="text-foreground text-xl font-semibold">No documents yet</h3>

        {/* Description */}
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Upload your first document to start building your financial document library.
        </p>

        {/* Feature Hints */}
        <div className="text-muted-foreground mt-6 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Upload className="text-primary h-4 w-4" aria-hidden="true" />
            <span>Drag & drop files</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>AI-powered search</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/*
        Document Cards Grid - Responsive layout:
        Mobile: Single column for list-style viewing
        Desktop: 2 columns for efficient scanning
        Gap increases on larger screens.
      */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </>
  );
}
