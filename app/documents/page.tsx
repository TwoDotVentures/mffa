/**
 * Documents Page - Mobile-First Document Management
 *
 * Displays document statistics, filters, and a list of uploaded documents.
 * Optimized for mobile with touch-friendly controls and responsive layouts.
 * Supports filtering by entity type, document type, and financial year.
 *
 * @component
 * @example
 * // Accessible at /documents route
 * // Supports query params: ?entity=personal&type=bank_statement&year=2024-25
 */

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentFilters } from '@/components/documents/document-filters';
import { AddDocumentButton } from '@/components/documents/add-document-button';
import { getDocuments, getDocumentStats } from '@/lib/documents/actions';
import { FileText, FolderOpen, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { EntityType, DocumentType } from '@/lib/types';

/** Page props with search params for filtering */
interface PageProps {
  searchParams: Promise<{ entity?: string; type?: string; year?: string }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Fetch documents and stats in parallel for performance
  const [documents, stats] = await Promise.all([
    getDocuments({
      entity_type: params.entity as EntityType | undefined,
      document_type: params.type as DocumentType | undefined,
      financial_year: params.year,
    }),
    getDocumentStats(),
  ]);

  return (
    <>
      <PageHeader title="Documents" description="Upload and manage financial documents" />

      {/*
        Main content area with responsive padding.
        Extra bottom padding on mobile for FAB clearance.
      */}
      <main className="flex-1 space-y-4 p-4 pb-24 md:space-y-6 md:p-6 md:pb-6">
        {/*
          Stats Cards Grid - 2x2 on mobile, 4 columns on desktop.
          Each card is compact on mobile for quick scanning.
        */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Total Documents Card */}
          <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
                Total Files
              </CardTitle>
              <div className="bg-primary/10 group-hover:bg-primary/20 rounded-full p-2 transition-colors">
                <FileText className="text-primary h-4 w-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums sm:text-2xl">
                {stats.totalDocuments}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Uploaded documents</p>
            </CardContent>
          </Card>

          {/* Personal Documents Card */}
          <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
                Personal
              </CardTitle>
              <div className="rounded-full bg-blue-500/10 p-2 transition-colors group-hover:bg-blue-500/20">
                <FolderOpen className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums sm:text-2xl">
                {stats.byEntity.personal || 0}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Personal docs</p>
            </CardContent>
          </Card>

          {/* SMSF & Trust Documents Card */}
          <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
                SMSF & Trust
              </CardTitle>
              <div className="rounded-full bg-purple-500/10 p-2 transition-colors group-hover:bg-purple-500/20">
                <FolderOpen className="h-4 w-4 text-purple-500" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums sm:text-2xl">
                {(stats.byEntity.smsf || 0) + (stats.byEntity.trust || 0)}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Entity docs</p>
            </CardContent>
          </Card>

          {/* AI Searchable Card */}
          <Card className="group transition-all duration-300 hover:border-emerald-500/20 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
                AI Ready
              </CardTitle>
              <div className="rounded-full bg-emerald-500/10 p-2 transition-colors group-hover:bg-emerald-500/20">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-600 tabular-nums sm:text-2xl dark:text-emerald-400">
                {stats.processedCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Searchable by AI</p>
            </CardContent>
          </Card>
        </div>

        {/*
          Action Bar - Filters and Upload Button
          On mobile: Filters stack above button
          On desktop: Side by side with space between
        */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[100px]" />
              </div>
            }
          >
            <DocumentFilters />
          </Suspense>
          <AddDocumentButton />
        </div>

        {/* Document List - Cards layout */}
        <DocumentList documents={documents} />
      </main>
    </>
  );
}
