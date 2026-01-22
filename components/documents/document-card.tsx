'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
} from 'lucide-react';
import { deleteDocument } from '@/lib/documents/actions';
import { ENTITY_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';
import type { Document } from '@/lib/types';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const getFileIcon = () => {
    if (doc.file_type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    if (doc.file_type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeleting(true);
    await deleteDocument(doc.id);
    router.refresh();
  };

  const handleDownload = () => {
    if (doc.download_url) {
      window.open(doc.download_url, '_blank');
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className="shrink-0">
            {getFileIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate">{doc.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {doc.original_filename}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {doc.download_url && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                {ENTITY_TYPE_LABELS[doc.entity_type]}
              </Badge>
              <Badge variant="secondary">
                {DOCUMENT_TYPE_LABELS[doc.document_type]}
              </Badge>
              {doc.financial_year && (
                <Badge variant="outline">
                  FY {doc.financial_year}
                </Badge>
              )}
            </div>

            {/* Meta */}
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>{formatDate(doc.created_at)}</span>
              {doc.is_processed ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Searchable
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-3 w-3" />
                  Processing
                </span>
              )}
            </div>

            {/* Description */}
            {doc.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {doc.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
