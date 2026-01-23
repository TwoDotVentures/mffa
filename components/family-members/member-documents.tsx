/**
 * Member Documents Component
 *
 * Displays documents linked to a family member.
 * Mobile-first responsive design with:
 * - Card-based layout on mobile, table on desktop
 * - Touch-friendly document cards
 * - Compact category headers
 * - Full-screen dialogs on mobile
 *
 * @module components/family-members/member-documents
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  FileText,
  Plus,
  MoreHorizontal,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  FileImage,
  File,
} from 'lucide-react';
import {
  getMemberDocuments,
  unlinkDocumentFromMember,
} from '@/lib/family-members/actions';
import { MEMBER_DOCUMENT_CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';
import type { MemberDocument, FamilyMember } from '@/lib/types';

interface MemberDocumentsProps {
  /** The family member to show documents for */
  familyMember: FamilyMember;
  /** Callback when add document is clicked */
  onAddDocument?: () => void;
}

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get appropriate file icon based on file type
 */
function getFileIcon(fileType?: string, className = 'h-5 w-5') {
  if (!fileType) return <File className={className} />;
  if (fileType.startsWith('image/')) return <FileImage className={className} />;
  if (fileType === 'application/pdf') return <FileText className={`${className} text-red-500`} />;
  return <File className={className} />;
}

/**
 * Member Documents Component
 * Displays and manages linked documents
 */
export function MemberDocuments({ familyMember, onAddDocument }: MemberDocumentsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<MemberDocument | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /** Load documents on mount */
  useEffect(() => {
    loadDocuments();
  }, [familyMember.id]);

  /** Fetch documents from server */
  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await getMemberDocuments(familyMember.id);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Show delete confirmation */
  function handleDeleteClick(doc: MemberDocument) {
    setDeletingDoc(doc);
    setDeleteDialogOpen(true);
  }

  /** Execute document unlink */
  async function handleDelete() {
    if (!deletingDoc) return;

    setActionLoading(true);
    try {
      await unlinkDocumentFromMember(deletingDoc.id);
      await loadDocuments();
      setDeleteDialogOpen(false);
      setDeletingDoc(null);
      router.refresh();
    } catch (error) {
      console.error('Error unlinking document:', error);
    } finally {
      setActionLoading(false);
    }
  }

  /** Open document download */
  function handleDownload(doc: MemberDocument) {
    if (doc.document?.download_url) {
      window.open(doc.document.download_url, '_blank');
    }
  }

  /** Group documents by category */
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.document_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, MemberDocument[]>);

  /** Loading state */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header - Stack on mobile */}
        <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Documents
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Documents linked to {familyMember.name}
            </CardDescription>
          </div>
          <Button onClick={onAddDocument} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Link Document
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {documents.length === 0 ? (
            /* Empty state */
            <div className="py-6 text-center sm:py-8">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
              <p className="mt-2 text-sm text-muted-foreground">
                No documents linked to this family member yet.
              </p>
              <Button variant="outline" className="mt-3 sm:mt-4" onClick={onAddDocument}>
                <Plus className="mr-1.5 h-4 w-4" />
                Link a Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <div key={category}>
                  {/* Category header */}
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    {MEMBER_DOCUMENT_CATEGORY_LABELS[category as keyof typeof MEMBER_DOCUMENT_CATEGORY_LABELS] || category}
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {docs.length}
                    </Badge>
                  </h4>

                  {/* Mobile Card View */}
                  <div className="space-y-2 sm:hidden">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start justify-between gap-2 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          {getFileIcon(doc.document?.file_type, 'h-4 w-4 shrink-0 mt-0.5')}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {doc.document?.name || 'Unknown Document'}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                {doc.document?.document_type
                                  ? DOCUMENT_TYPE_LABELS[doc.document.document_type] ||
                                    doc.document.document_type
                                  : '-'}
                              </Badge>
                              {doc.document?.file_size && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatFileSize(doc.document.file_size)}
                                </span>
                              )}
                            </div>
                            {doc.notes && (
                              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                                {doc.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            {doc.document?.download_url && (
                              <DropdownMenuItem onClick={() => handleDownload(doc)} className="gap-2 py-2">
                                <Download className="h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => router.push('/documents')}
                              className="gap-2 py-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View in Docs
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 py-2 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Unlink
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden overflow-hidden rounded-md border sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="w-[100px]">Notes</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {getFileIcon(doc.document?.file_type)}
                                <div>
                                  <div className="font-medium">
                                    {doc.document?.name || 'Unknown Document'}
                                  </div>
                                  {doc.document?.original_filename && (
                                    <div className="text-xs text-muted-foreground">
                                      {doc.document.original_filename}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {doc.document?.document_type
                                  ? DOCUMENT_TYPE_LABELS[doc.document.document_type] ||
                                    doc.document.document_type
                                  : '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {doc.document?.file_size
                                ? formatFileSize(doc.document.file_size)
                                : '-'}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground">
                              {doc.notes || '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {doc.document?.download_url && (
                                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => router.push('/documents')}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View in Documents
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(doc)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Unlink
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Full width on mobile */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-lg sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Unlink Document</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to unlink &quot;{deletingDoc?.document?.name}&quot;
              from {familyMember.name}? This will not delete the document from your
              document library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
