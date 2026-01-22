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
import { Badge } from '@/components/ui/badge';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMember: FamilyMember;
  onSuccess?: () => void;
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

  // Link existing document state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentCategory, setDocumentCategory] = useState<MemberDocumentCategory>('other');
  const [notes, setNotes] = useState('');

  // Upload new document state
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

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

  // Filter documents based on search
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (f: File) => {
    setFile(f);
    if (!documentName) {
      setDocumentName(f.name.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  };

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

  async function handleUploadAndLink() {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // First upload the document
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

      // Then link it to the family member
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Link Document to {familyMember.name}</DialogTitle>
          <DialogDescription>
            Link an existing document or upload a new one.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'link' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <Link className="mr-2 h-4 w-4" />
              Link Existing
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            {/* Document Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Document List */}
            <div className="max-h-[200px] overflow-y-auto rounded-md border">
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
                        'flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50',
                        selectedDocument?.id === doc.id && 'bg-primary/10'
                      )}
                      onClick={() => setSelectedDocument(doc)}
                    >
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)} &bull;{' '}
                          {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                        </div>
                      </div>
                      {selectedDocument?.id === doc.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(file.type)}
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm">
                    Drag and drop a file, or{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
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
              <div className="grid gap-2">
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Birth Certificate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Entity</Label>
                  <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                    <SelectTrigger>
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

                <div className="grid gap-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                    <SelectTrigger>
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

              <div className="grid gap-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this document..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Fields */}
        <div className="space-y-3 border-t pt-4">
          <div className="grid gap-2">
            <Label>Category for {familyMember.name}</Label>
            <Select
              value={documentCategory}
              onValueChange={(v) => setDocumentCategory(v as MemberDocumentCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEMBER_DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes specific to this family member..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'link' ? (
            <Button
              onClick={handleLinkDocument}
              disabled={uploading || !selectedDocument}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Document
            </Button>
          ) : (
            <Button
              onClick={handleUploadAndLink}
              disabled={uploading || !file}
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
