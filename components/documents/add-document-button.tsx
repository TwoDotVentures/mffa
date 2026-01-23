/**
 * Add Document Button Component
 *
 * Primary action button for uploading new documents.
 * Touch-optimized with 44px+ touch target.
 * Full-width on mobile for easy reach.
 *
 * @component
 * @example
 * <AddDocumentButton />
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DocumentUploadDialog } from './document-upload-dialog';

export function AddDocumentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        Button with prominent styling for primary action.
        Mobile: Full width for easy thumb reach.
        Desktop: Auto-width aligned to right.
        Touch target: 44px minimum height for accessibility.
      */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="min-h-[44px] w-full gap-2 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] sm:w-auto"
      >
        <Upload className="h-5 w-5" aria-hidden="true" />
        <span>Upload Document</span>
      </Button>

      {/* Upload dialog - Full screen on mobile */}
      <DocumentUploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
