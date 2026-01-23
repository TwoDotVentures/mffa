# Documents Components

Components for uploading and managing financial documents with AI-powered search.

## Components

### DocumentList
`document-list.tsx`

Grid display of uploaded documents with filtering options.

**Props:**
- `documents: Document[]` - Documents to display
- `onRefresh?: () => void` - Refresh callback

**Features:**
- Grid layout with document cards
- Filter by entity type and document type
- Search by name
- Financial year filter

### DocumentCard
`document-card.tsx`

Individual document card showing metadata and actions.

**Props:**
- `document: Document` - The document to display
- `onDelete?: () => void` - Delete callback

**Features:**
- File type icon
- Document name and description
- Entity and document type badges
- Financial year tag
- Download and delete actions
- Processing status indicator

### DocumentFilters
`document-filters.tsx`

Filter controls for the document list.

**Props:**
- `filters: DocumentFilters` - Current filter state
- `onFiltersChange: (filters: DocumentFilters) => void` - Filter change callback

**Features:**
- Entity type dropdown
- Document type dropdown
- Financial year selector
- Search input

### DocumentUploadDialog
`document-upload-dialog.tsx`

Modal dialog for uploading new documents.

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State change callback
- `onSuccess?: () => void` - Success callback

**Features:**
- Drag and drop file upload
- Name and description fields
- Entity type selection (Personal, Trust, SMSF, Business)
- Document type selection (Tax Return, Statement, Receipt, etc.)
- Financial year assignment
- Tags input

### AddDocumentButton
`add-document-button.tsx`

Button that opens document upload dialog.

**Props:**
- None (self-contained with dialog state)

## Usage

```tsx
import { DocumentList } from '@/components/documents/document-list';
import { AddDocumentButton } from '@/components/documents/add-document-button';

export function DocumentsPage({ documents }) {
  return (
    <div>
      <AddDocumentButton />
      <DocumentList documents={documents} />
    </div>
  );
}
```

## Vector Search

Documents are processed to generate embeddings for AI-powered semantic search. The processing status is shown on each document card.

## Related

- `/lib/documents/actions.ts` - Server actions for document operations
- Documents are stored in Supabase Storage with signed URLs for secure access
