'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DocumentUploadDialog } from './document-upload-dialog';

export function AddDocumentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Document
      </Button>
      <DocumentUploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
