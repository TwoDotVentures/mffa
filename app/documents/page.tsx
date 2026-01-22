import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentFilters } from '@/components/documents/document-filters';
import { AddDocumentButton } from '@/components/documents/add-document-button';
import { getDocuments, getDocumentStats } from '@/lib/documents/actions';
import { FileText, FolderOpen, CheckCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { EntityType, DocumentType } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{ entity?: string; type?: string; year?: string }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

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
      <PageHeader
        title="Documents"
        description="Upload and manage financial documents"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Uploaded files</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byEntity.personal || 0}</div>
              <p className="text-xs text-muted-foreground">Personal documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMSF & Trust</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byEntity.smsf || 0) + (stats.byEntity.trust || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Entity documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Searchable</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.processedCount}
              </div>
              <p className="text-xs text-muted-foreground">Ready for AI search</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={<Skeleton className="h-10 w-[400px]" />}>
            <DocumentFilters />
          </Suspense>
          <AddDocumentButton />
        </div>

        {/* Document List */}
        <DocumentList documents={documents} />
      </main>
    </>
  );
}
