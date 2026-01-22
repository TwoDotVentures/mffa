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
import { cn } from '@/lib/utils';

interface MemberDocumentsProps {
  familyMember: FamilyMember;
  onAddDocument?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-5 w-5" />;
  if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5" />;
}

export function MemberDocuments({ familyMember, onAddDocument }: MemberDocumentsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<MemberDocument | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [familyMember.id]);

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

  function handleDeleteClick(doc: MemberDocument) {
    setDeletingDoc(doc);
    setDeleteDialogOpen(true);
  }

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

  function handleDownload(doc: MemberDocument) {
    if (doc.document?.download_url) {
      window.open(doc.document.download_url, '_blank');
    }
  }

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.document_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, MemberDocument[]>);

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Documents linked to {familyMember.name}
            </CardDescription>
          </div>
          <Button onClick={onAddDocument}>
            <Plus className="mr-2 h-4 w-4" />
            Link Document
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No documents linked to this family member yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={onAddDocument}>
                <Plus className="mr-2 h-4 w-4" />
                Link a Document
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <div key={category}>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    {MEMBER_DOCUMENT_CATEGORY_LABELS[category as keyof typeof MEMBER_DOCUMENT_CATEGORY_LABELS] || category}
                    <Badge variant="secondary" className="ml-2">
                      {docs.length}
                    </Badge>
                  </h4>
                  <div className="rounded-md border">
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
                            <TableCell className="text-muted-foreground truncate max-w-[150px]">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink &quot;{deletingDoc?.document?.name}&quot;
              from {familyMember.name}? This will not delete the document from your
              document library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
