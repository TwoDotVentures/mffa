/**
 * Member Document Upload Component
 *
 * Dialog for linking/uploading documents to a family member.
 * Mobile-first responsive design with:
 * - Full-screen dialog on mobile
 * - Touch-friendly file selection
 * - Scrollable document list
 * - Large touch targets
 *
 * @module components/family-members/member-document-upload
 */
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Upload,
  FileText,
  X,
  Search,
  Link,
  FileImage,
  File,
  Check,
} from 'lucide-react';
import { getDocuments, uploadDocument } from '@/lib/documents/actions';
import { linkDocumentToMember } from '@/lib/family-members/actions';
import {
  MEMBER_DOCUMENT_CATEGORY_LABELS,
  ENTITY_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/types';
import type {
  FamilyMember,
  Document,
  MemberDocumentCategory,
  EntityType,
  DocumentType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

interface MemberDocumentUploadProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Family member to link document to */
  familyMember: FamilyMember;
  /** Callback on successful upload/link */
  onSuccess?: () => void;
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
 * Get appropriate file icon based on type
 */
function getFileIcon(fileType?: string, className = 'h-5 w-5') {
  if (!fileType) return <File className={className} />;
  if (fileType.startsWith('image/')) return <FileImage className={className} />;
  if (fileType === 'application/pdf') return <FileText className={`${className} text-red-500`} />;
  return <File className={className} />;
}

/**
 * Member Document Upload Component
 * Handles linking existing or uploading new documents
 */
export function MemberDocumentUpload({
  open,
  onOpenChange,
  familyMember,
  onSuccess,
}: MemberDocumentUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  /** Link existing document state */
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentCategory, setDocumentCategory] = useState<MemberDocumentCategory>('other');
  const [notes, setNotes] = useState('');

  /** Upload new document state */
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');

  /** Load documents when dialog opens */
  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  /** Fetch available documents */
  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  /** Filter documents based on search */
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /** Handle drag events */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /** Handle file drop */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  /** Handle file input change */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  /** Process selected file */
  const handleFile = (f: File) => {
    setFile(f);
    if (!documentName) {
      setDocumentName(f.name.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  };

  /** Link existing document to member */
  async function handleLinkDocument() {
    if (!selectedDocument) {
      setError('Please select a document');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await linkDocumentToMember({
        family_member_id: familyMember.id,
        document_id: selectedDocument.id,
        document_category: documentCategory,
        notes: notes || undefined,
      });

      onOpenChange(false);
      resetForm();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link document');
    } finally {
      setUploading(false);
    }
  }

  /** Upload new document and link to member */
  async function handleUploadAndLink() {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentName);
      formData.append('entity_type', entityType);
      formData.append('document_type', documentType);
      if (description) formData.append('description', description);

      const uploadResult = await uploadDocument(formData);

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      await linkDocumentToMember({
        family_member_id: familyMember.id,
        document_id: uploadResult.data.id,
        document_category: documentCategory,
        notes: notes || undefined,
      });

      onOpenChange(false);
      resetForm();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  /** Reset form state */
  function resetForm() {
    setActiveTab('link');
    setSearchQuery('');
    setSelectedDocument(null);
    setDocumentCategory('other');
    setNotes('');
    setFile(null);
    setDocumentName('');
    setEntityType('personal');
    setDocumentType('other');
    setDescription('');
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[600px]">
        {/* Header */}
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">Link Document to {familyMember.name}</DialogTitle>
          <DialogDescription className="text-sm">
            Link an existing document or upload a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'link' | 'upload')}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="link" className="gap-1.5 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm">
                <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Link Existing
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Upload New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-0 space-y-3 sm:space-y-4">
              {/* Document Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground sm:top-2.5" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-9 text-base sm:h-10 sm:text-sm"
                />
              </div>

              {/* Document List */}
              <div className="max-h-[180px] overflow-y-auto rounded-md border sm:max-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No documents match your search'
                      : 'No documents available'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2.5 p-3 text-left hover:bg-muted/50 sm:gap-3',
                          selectedDocument?.id === doc.id && 'bg-primary/10'
                        )}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        {getFileIcon(doc.file_type, 'h-4 w-4 sm:h-5 sm:w-5 shrink-0')}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{doc.name}</div>
                          <div className="text-[10px] text-muted-foreground sm:text-xs">
                            {formatFileSize(doc.file_size)} &bull;{' '}
                            {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </div>
                        </div>
                        {selectedDocument?.id === doc.id && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 space-y-3 sm:space-y-4">
              {/* File Drop Zone */}
              <div
                className={cn(
                  'relative rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-6',
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                    {getFileIcon(file.type, 'h-4 w-4 sm:h-5 sm:w-5 shrink-0')}
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                    <p className="mt-2 text-xs sm:text-sm">
                      Drag and drop a file, or{' '}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
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

              {/* Document Details */}
              <div className="grid gap-3">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="docName" className="text-xs sm:text-sm">
                    Document Name
                  </Label>
                  <Input
                    id="docName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Birth Certificate"
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">Entity</Label>
                    <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                      <SelectTrigger className="h-11 text-sm sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="py-2.5 sm:py-2">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">Document Type</Label>
                    <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                      <SelectTrigger className="h-11 text-sm sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="py-2.5 sm:py-2">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="desc" className="text-xs sm:text-sm">
                    Description (optional)
                  </Label>
                  <Input
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this document..."
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">Category for {familyMember.name}</Label>
              <Select
                value={documentCategory}
                onValueChange={(v) => setDocumentCategory(v as MemberDocumentCategory)}
              >
                <SelectTrigger className="h-11 text-sm sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEMBER_DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="py-2.5 sm:py-2">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes specific to this family member..."
                rows={2}
                className="text-base sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:gap-0 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            Cancel
          </Button>
          {activeTab === 'link' ? (
            <Button
              onClick={handleLinkDocument}
              disabled={uploading || !selectedDocument}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Document
            </Button>
          ) : (
            <Button
              onClick={handleUploadAndLink}
              disabled={uploading || !file}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload & Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
