# Phase 8: Budgeting & Documents - Implementation Plan

**Moyle Family Finance App | Version 1.0 | January 2026**

---

## Executive Summary

Phase 8 completes the Moyle Family Finance App with three critical modules:
1. **Budgeting** - Category-based budgets with tracking and alerts
2. **Document Storage** - Centralised document management with AI-searchable embeddings
3. **Notifications** - Proactive reminders for deadlines, caps, and budgets

**Key References:**
- `docs/prd.md` Sections 4.5 and 4.6 - Feature requirements
- `docs/ai-accountant-feature.md` Section 4.3 - Document embeddings schema
- `docs/tasks.md` Phase 8 - Task checklist

**Checkpoint Criteria:**
> Full app complete - all entities tracked, AI functional, documents searchable

---

## Phase 8.1: Budgets Module

### 8.1.1 Database Schema - `budgets` Table

```sql
-- budgets: Monthly/annual category spending limits
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Budget definition
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT, -- Fallback if category deleted

  -- Amount & period
  amount DECIMAL(12,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly')),

  -- Tracking
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means ongoing

  -- Alert settings
  alert_threshold INTEGER DEFAULT 80, -- Alert at 80% of budget
  alert_enabled BOOLEAN DEFAULT true,

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX idx_budgets_category ON budgets(category_id);

-- Trigger for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8.1.2 Budget TypeScript Types

```typescript
// Budget Types (add to lib/types.ts)
export type BudgetPeriod = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  alert_threshold: number;
  alert_enabled: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface BudgetFormData {
  name: string;
  category_id?: string;
  amount: number;
  period: BudgetPeriod;
  start_date?: string;
  end_date?: string;
  alert_threshold?: number;
  alert_enabled?: boolean;
  notes?: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isApproachingLimit: boolean; // >= alert_threshold
  transactions: Transaction[];
  daysRemaining: number;
  dailyAllowance: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgets: BudgetProgress[];
  overBudgetCount: number;
  approachingLimitCount: number;
}

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const BUDGET_PERIOD_DAYS: Record<BudgetPeriod, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
};
```

### 8.1.3 Budget Server Actions (`lib/budgets/actions.ts`)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Budget, BudgetFormData, BudgetProgress, BudgetSummary } from '@/lib/types';

// ============================================
// Budget CRUD Operations
// ============================================

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  return data || [];
}

export async function createBudget(formData: BudgetFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get category name for fallback
  let categoryName = null;
  if (formData.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', formData.category_id)
      .single();
    categoryName = category?.name;
  }

  const { error } = await supabase
    .from('budgets')
    .insert({
      ...formData,
      user_id: user.id,
      category_name: categoryName,
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
    });

  if (error) {
    console.error('Error creating budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

export async function updateBudget(
  id: string,
  formData: Partial<BudgetFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('budgets')
    .update(formData)
    .eq('id', id);

  if (error) {
    console.error('Error updating budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

export async function deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

// ============================================
// Budget Progress Tracking
// ============================================

export async function getBudgetProgress(budgetId: string): Promise<BudgetProgress | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get budget
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('id', budgetId)
    .single();

  if (budgetError || !budget) return null;

  // Calculate period dates
  const { startDate, endDate, daysRemaining } = calculatePeriodDates(budget.period);

  // Get transactions for this period and category
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .lt('amount', 0); // Expenses only

  if (budget.category_id) {
    query = query.eq('category_id', budget.category_id);
  }

  const { data: transactions, error: txError } = await query;

  if (txError) {
    console.error('Error fetching transactions:', txError);
    return null;
  }

  // Calculate totals
  const spent = Math.abs((transactions || []).reduce((sum, t) => sum + t.amount, 0));
  const remaining = Math.max(0, budget.amount - spent);
  const percentage = (spent / budget.amount) * 100;
  const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

  return {
    budget,
    spent,
    remaining,
    percentage,
    isOverBudget: spent > budget.amount,
    isApproachingLimit: percentage >= budget.alert_threshold,
    transactions: transactions || [],
    daysRemaining,
    dailyAllowance,
  };
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const budgets = await getBudgets();

  const budgetProgressPromises = budgets.map(b => getBudgetProgress(b.id));
  const progressResults = await Promise.all(budgetProgressPromises);
  const budgetProgress = progressResults.filter((p): p is BudgetProgress => p !== null);

  const totalBudgeted = budgetProgress.reduce((sum, p) => sum + p.budget.amount, 0);
  const totalSpent = budgetProgress.reduce((sum, p) => sum + p.spent, 0);
  const overBudgetCount = budgetProgress.filter(p => p.isOverBudget).length;
  const approachingLimitCount = budgetProgress.filter(p => p.isApproachingLimit && !p.isOverBudget).length;

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining: Math.max(0, totalBudgeted - totalSpent),
    budgets: budgetProgress,
    overBudgetCount,
    approachingLimitCount,
  };
}

// ============================================
// Utility Functions
// ============================================

function calculatePeriodDates(period: string): { startDate: string; endDate: string; daysRemaining: number } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'weekly':
      // Start of current week (Monday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay() + 1);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'fortnightly':
      // Start of current fortnight
      startDate = new Date(now);
      const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const fortnightStart = weekOfYear % 2 === 0 ? 0 : 7;
      startDate.setDate(now.getDate() - now.getDay() + 1 - fortnightStart);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'yearly':
      // Australian Financial Year (July-June)
      const fyYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(fyYear, 6, 1);
      endDate = new Date(fyYear + 1, 5, 30);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysRemaining,
  };
}
```

### 8.1.4 Budget UI Components

| Component | Description |
|-----------|-------------|
| `components/budgets/budget-dashboard.tsx` | Summary cards with progress indicators |
| `components/budgets/budget-list.tsx` | List of budgets with progress bars |
| `components/budgets/budget-dialog.tsx` | Add/edit budget form |
| `components/budgets/budget-card.tsx` | Individual budget with visual progress |
| `components/budgets/add-budget-button.tsx` | Button to open budget dialog |
| `components/budgets/budget-progress-ring.tsx` | Circular progress visualisation |

### 8.1.5 Budget Page (`app/budgets/page.tsx`)

```tsx
import { PageHeader } from '@/components/page-header';
import { BudgetDashboard } from '@/components/budgets/budget-dashboard';
import { BudgetList } from '@/components/budgets/budget-list';
import { AddBudgetButton } from '@/components/budgets/add-budget-button';
import { getBudgetSummary } from '@/lib/budgets/actions';
import { getCategories } from '@/lib/transactions/actions';

export default async function BudgetsPage() {
  const [summary, categories] = await Promise.all([
    getBudgetSummary(),
    getCategories(),
  ]);

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Track spending against category limits"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <BudgetDashboard summary={summary} />

        <div className="flex justify-end">
          <AddBudgetButton categories={categories} />
        </div>

        <BudgetList budgets={summary.budgets} />
      </main>
    </>
  );
}
```

---

## Phase 8.2: Document Storage Module

### 8.2.1 Database Schema - `documents` Table

```sql
-- documents: File storage with metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- File info
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL, -- Bytes

  -- Categorisation
  entity_type TEXT NOT NULL CHECK (entity_type IN ('personal', 'smsf', 'trust')),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bank_statement', 'tax_return', 'receipt', 'invoice',
    'trust_deed', 'distribution_resolution', 'smsf_annual_return',
    'investment_statement', 'contract', 'insurance', 'other'
  )),

  -- Linking
  linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  financial_year TEXT, -- Format: '2024-25'

  -- Processing status
  is_processed BOOLEAN DEFAULT false, -- Has embeddings been generated?
  processing_error TEXT,

  -- Metadata
  description TEXT,
  tags TEXT[], -- Array of tags for filtering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_entity ON documents(user_id, entity_type);
CREATE INDEX idx_documents_type ON documents(user_id, document_type);
CREATE INDEX idx_documents_fy ON documents(user_id, financial_year);
CREATE INDEX idx_documents_transaction ON documents(linked_transaction_id);
```

### 8.2.2 Database Schema - `document_embeddings` Table

```sql
-- Enable vector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- document_embeddings: Vector storage for RAG search
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,

  -- Chunk info
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL, -- The actual text chunk

  -- Embedding vector (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),

  -- Metadata
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy (via document ownership)
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access embeddings of their documents"
  ON document_embeddings FOR ALL USING (
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- Indexes for vector similarity search
CREATE INDEX idx_document_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 8.2.3 Supabase Storage Setup

Create a storage bucket via Supabase Dashboard or SQL:

```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- RLS policies for storage
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 8.2.4 Document TypeScript Types

```typescript
// Document Types (add to lib/types.ts)
export type EntityType = 'personal' | 'smsf' | 'trust';

export type DocumentType =
  | 'bank_statement'
  | 'tax_return'
  | 'receipt'
  | 'invoice'
  | 'trust_deed'
  | 'distribution_resolution'
  | 'smsf_annual_return'
  | 'investment_statement'
  | 'contract'
  | 'insurance'
  | 'other';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  entity_type: EntityType;
  document_type: DocumentType;
  linked_transaction_id: string | null;
  financial_year: string | null;
  is_processed: boolean;
  processing_error: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed
  download_url?: string;
}

export interface DocumentUploadData {
  file: File;
  name: string;
  entity_type: EntityType;
  document_type: DocumentType;
  description?: string;
  financial_year?: string;
  linked_transaction_id?: string;
  tags?: string[];
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  created_at: string;
}

export interface DocumentSearchResult {
  document: Document;
  chunk: DocumentEmbedding;
  similarity: number;
}

export interface DocumentFilters {
  entity_type?: EntityType;
  document_type?: DocumentType;
  financial_year?: string;
  search?: string;
  tags?: string[];
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  personal: 'Personal',
  smsf: 'SMSF',
  trust: 'Family Trust',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  receipt: 'Receipt',
  invoice: 'Invoice',
  trust_deed: 'Trust Deed',
  distribution_resolution: 'Distribution Resolution',
  smsf_annual_return: 'SMSF Annual Return',
  investment_statement: 'Investment Statement',
  contract: 'Contract',
  insurance: 'Insurance',
  other: 'Other',
};
```

### 8.2.5 Document Server Actions (`lib/documents/actions.ts`)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Document, DocumentFilters, DocumentSearchResult } from '@/lib/types';

// ============================================
// Document CRUD Operations
// ============================================

export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }
  if (filters?.document_type) {
    query = query.eq('document_type', filters.document_type);
  }
  if (filters?.financial_year) {
    query = query.eq('financial_year', filters.financial_year);
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  // Generate download URLs
  const documentsWithUrls = await Promise.all(
    (data || []).map(async (doc) => {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry
      return { ...doc, download_url: urlData?.signedUrl };
    })
  );

  return documentsWithUrls;
}

export async function uploadDocument(formData: FormData): Promise<{ success: boolean; error?: string; data?: Document }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const file = formData.get('file') as File;
  const name = formData.get('name') as string;
  const entity_type = formData.get('entity_type') as string;
  const document_type = formData.get('document_type') as string;
  const description = formData.get('description') as string | null;
  const financial_year = formData.get('financial_year') as string | null;
  const linked_transaction_id = formData.get('linked_transaction_id') as string | null;
  const tagsJson = formData.get('tags') as string | null;
  const tags = tagsJson ? JSON.parse(tagsJson) : [];

  // Generate unique storage path
  const fileExt = file.name.split('.').pop();
  const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { success: false, error: uploadError.message };
  }

  // Create database record
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      name,
      original_filename: file.name,
      storage_path: storagePath,
      file_type: file.type,
      file_size: file.size,
      entity_type,
      document_type,
      description,
      financial_year,
      linked_transaction_id,
      tags,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Error creating document record:', dbError);
    // Clean up uploaded file
    await supabase.storage.from('documents').remove([storagePath]);
    return { success: false, error: dbError.message };
  }

  // Queue for embedding generation (async)
  // This would be handled by a background job or edge function
  await queueForEmbedding(data.id);

  revalidatePath('/documents');
  return { success: true, data };
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get document to find storage path
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!doc) return { success: false, error: 'Document not found' };

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('Error deleting file:', storageError);
  }

  // Delete database record (embeddings cascade)
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting document:', dbError);
    return { success: false, error: dbError.message };
  }

  revalidatePath('/documents');
  return { success: true };
}

// ============================================
// Document Search (RAG)
// ============================================

export async function searchDocuments(
  query: string,
  filters?: { entity_type?: string; document_type?: string },
  limit: number = 5
): Promise<DocumentSearchResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Generate embedding for query
  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  // Vector similarity search using pgvector
  const { data, error } = await supabase.rpc('search_document_embeddings', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
    filter_user_id: user.id,
    filter_entity_type: filters?.entity_type || null,
    filter_document_type: filters?.document_type || null,
  });

  if (error) {
    console.error('Error searching documents:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Embedding Generation
// ============================================

async function queueForEmbedding(documentId: string): Promise<void> {
  // In production, this would trigger a background job
  // For now, we'll process synchronously or via edge function
  const supabase = await createClient();

  // Update document status
  await supabase
    .from('documents')
    .update({ is_processed: false, processing_error: null })
    .eq('id', documentId);

  // Actual embedding generation would happen here or in a separate worker
  // See lib/documents/embeddings.ts for implementation
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  // Use OpenAI embedding API or alternative
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}
```

### 8.2.6 Document Embedding Edge Function (`supabase/functions/generate-embeddings/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (downloadError) {
      throw new Error('Failed to download file');
    }

    // Extract text based on file type
    let text = '';
    if (doc.file_type === 'application/pdf') {
      // Use pdf-parse or similar
      text = await extractTextFromPdf(fileData);
    } else if (doc.file_type.startsWith('text/')) {
      text = await fileData.text();
    } else {
      throw new Error('Unsupported file type for embedding');
    }

    // Split into chunks (max ~500 tokens each)
    const chunks = splitIntoChunks(text, 500);

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);

      await supabase.from('document_embeddings').insert({
        document_id: documentId,
        chunk_index: i,
        content: chunks[i],
        embedding,
        token_count: countTokens(chunks[i]),
      });
    }

    // Mark document as processed
    await supabase
      .from('documents')
      .update({ is_processed: true })
      .eq('id', documentId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function splitIntoChunks(text: string, maxTokens: number): string[] {
  // Simple chunking by paragraphs
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (countTokens(currentChunk + para) > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function countTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}
```

### 8.2.7 Document UI Components

| Component | Description |
|-----------|-------------|
| `components/documents/document-list.tsx` | Grid/list view of documents with filters |
| `components/documents/document-upload-dialog.tsx` | Upload form with drag-and-drop |
| `components/documents/document-card.tsx` | Document preview card with download |
| `components/documents/document-filters.tsx` | Filter by entity, type, year, tags |
| `components/documents/document-viewer.tsx` | In-app document preview |
| `components/documents/add-document-button.tsx` | Upload trigger button |

### 8.2.8 Documents Page (`app/documents/page.tsx`)

```tsx
import { PageHeader } from '@/components/page-header';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentFilters } from '@/components/documents/document-filters';
import { AddDocumentButton } from '@/components/documents/add-document-button';
import { getDocuments } from '@/lib/documents/actions';

interface Props {
  searchParams: { entity?: string; type?: string; year?: string };
}

export default async function DocumentsPage({ searchParams }: Props) {
  const documents = await getDocuments({
    entity_type: searchParams.entity as any,
    document_type: searchParams.type as any,
    financial_year: searchParams.year,
  });

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload and manage financial documents"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <DocumentFilters />
          <AddDocumentButton />
        </div>

        <DocumentList documents={documents} />
      </main>
    </>
  );
}
```

---

## Phase 8.3: Notifications Module

### 8.3.1 Database Schema - `notifications` Table

```sql
-- notifications: Alerts and reminders
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'trust_distribution_reminder',
    'super_cap_warning',
    'smsf_audit_reminder',
    'budget_alert',
    'document_processed',
    'tax_deadline',
    'general'
  )),

  -- Priority and status
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  -- Scheduling
  scheduled_for TIMESTAMPTZ, -- When to show (NULL = show immediately)
  expires_at TIMESTAMPTZ, -- When to auto-dismiss

  -- Linking
  link_url TEXT, -- URL to navigate to when clicked
  related_entity_type TEXT, -- 'budget', 'document', 'smsf', 'trust', etc.
  related_entity_id UUID,

  -- Metadata
  metadata JSONB, -- Additional context data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, is_dismissed)
  WHERE is_read = false AND is_dismissed = false;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for)
  WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(user_id, notification_type);
```

### 8.3.2 Notification TypeScript Types

```typescript
// Notification Types (add to lib/types.ts)
export type NotificationType =
  | 'trust_distribution_reminder'
  | 'super_cap_warning'
  | 'smsf_audit_reminder'
  | 'budget_alert'
  | 'document_processed'
  | 'tax_deadline'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_dismissed: boolean;
  scheduled_for: string | null;
  expires_at: string | null;
  link_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  scheduled_for?: string;
  expires_at?: string;
  link_url?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  trust_distribution_reminder: 'Trust Distribution',
  super_cap_warning: 'Super Cap Warning',
  smsf_audit_reminder: 'SMSF Audit',
  budget_alert: 'Budget Alert',
  document_processed: 'Document Ready',
  tax_deadline: 'Tax Deadline',
  general: 'General',
};

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-slate-500',
  medium: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
};
```

### 8.3.3 Notification Server Actions (`lib/notifications/actions.ts`)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Notification, CreateNotificationData } from '@/lib/types';
import { getCurrentFinancialYear, getDaysUntilEOFY } from '@/lib/trust/utils';

// ============================================
// Notification CRUD
// ============================================

export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (error) {
    console.error('Error counting notifications:', error);
    return 0;
  }
  return count || 0;
}

export async function markAsRead(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function dismissNotification(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('id', id);

  if (error) {
    console.error('Error dismissing notification:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function createNotification(data: CreateNotificationData): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('notifications')
    .insert({
      ...data,
      user_id: user.id,
      priority: data.priority || 'medium',
    });

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

// ============================================
// Automated Notification Checks
// ============================================

export async function checkAndCreateReminders(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    checkTrustDistributionReminder(supabase, user.id),
    checkSuperCapWarnings(supabase, user.id),
    checkSmsfAuditReminder(supabase, user.id),
    checkBudgetAlerts(supabase, user.id),
  ]);
}

async function checkTrustDistributionReminder(supabase: any, userId: string) {
  const daysUntilEOFY = getDaysUntilEOFY();

  // Remind at 60, 30, 14, and 7 days before EOFY
  if (![60, 30, 14, 7].includes(daysUntilEOFY)) return;

  // Check if trust exists with undistributed income
  const { data: trust } = await supabase
    .from('trusts')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!trust) return;

  // Check if reminder already sent for this day
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', 'trust_distribution_reminder')
    .gte('created_at', new Date().toISOString().split('T')[0])
    .single();

  if (existing) return;

  const priority = daysUntilEOFY <= 7 ? 'urgent' : daysUntilEOFY <= 14 ? 'high' : 'medium';

  await supabase.from('notifications').insert({
    user_id: userId,
    title: '30 June Trust Distribution Deadline',
    message: `${daysUntilEOFY} days until the trust distribution deadline. Ensure ${trust.name} income is distributed before 30 June to avoid penalty tax.`,
    notification_type: 'trust_distribution_reminder',
    priority,
    link_url: '/trust',
    related_entity_type: 'trust',
    related_entity_id: trust.id,
  });
}

async function checkSuperCapWarnings(supabase: any, userId: string) {
  const fy = getCurrentFinancialYear();

  // Check personal super contributions
  const { data: contributions } = await supabase
    .from('super_contributions')
    .select('amount, contribution_type')
    .eq('user_id', userId)
    .eq('financial_year', fy);

  if (!contributions) return;

  const concessional = contributions
    .filter((c: any) => c.contribution_type === 'concessional')
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  const concessionalCap = 30000;
  const remaining = concessionalCap - concessional;
  const percentage = (concessional / concessionalCap) * 100;

  if (percentage >= 90 && percentage < 100) {
    // Check if already notified this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', 'super_cap_warning')
      .gte('created_at', weekAgo.toISOString())
      .single();

    if (!existing) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Super Contribution Cap Warning',
        message: `You have used ${percentage.toFixed(0)}% of your concessional super cap. $${remaining.toLocaleString()} remaining for ${fy}.`,
        notification_type: 'super_cap_warning',
        priority: 'high',
        link_url: '/smsf',
        metadata: { percentage, remaining, cap: concessionalCap },
      });
    }
  }
}

async function checkSmsfAuditReminder(supabase: any, userId: string) {
  // Check SMSF compliance records
  const { data: smsf } = await supabase
    .from('smsf_funds')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!smsf) return;

  const { data: compliance } = await supabase
    .from('smsf_compliance')
    .select('*')
    .eq('fund_id', smsf.id)
    .order('audit_date', { ascending: false })
    .limit(1)
    .single();

  if (!compliance?.audit_date) return;

  const lastAudit = new Date(compliance.audit_date);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (lastAudit < oneYearAgo) {
    // Check if already notified this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', 'smsf_audit_reminder')
      .gte('created_at', monthAgo.toISOString())
      .single();

    if (!existing) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'SMSF Audit Overdue',
        message: `${smsf.name} annual audit may be overdue. Last audit was ${compliance.audit_date}.`,
        notification_type: 'smsf_audit_reminder',
        priority: 'high',
        link_url: '/smsf',
        related_entity_type: 'smsf',
        related_entity_id: smsf.id,
      });
    }
  }
}

async function checkBudgetAlerts(supabase: any, userId: string) {
  // This would be called by the budget tracking system
  // When a budget exceeds alert_threshold, create a notification
  // Implementation depends on budget progress calculation
}

export async function createBudgetAlert(
  budgetId: string,
  budgetName: string,
  percentage: number
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const isOverBudget = percentage >= 100;
  const title = isOverBudget ? 'Budget Exceeded' : 'Budget Alert';
  const priority = isOverBudget ? 'urgent' : 'high';

  await supabase.from('notifications').insert({
    user_id: user.id,
    title,
    message: `${budgetName} is at ${percentage.toFixed(0)}% of budget.`,
    notification_type: 'budget_alert',
    priority,
    link_url: '/budgets',
    related_entity_type: 'budget',
    related_entity_id: budgetId,
    metadata: { percentage },
  });
}
```

### 8.3.4 Notification UI Components

| Component | Description |
|-----------|-------------|
| `components/notifications/notification-bell.tsx` | Bell icon with unread count badge |
| `components/notifications/notification-dropdown.tsx` | Dropdown list of recent notifications |
| `components/notifications/notification-list.tsx` | Full page notification list |
| `components/notifications/notification-item.tsx` | Individual notification with actions |
| `components/notifications/notification-settings.tsx` | Configure notification preferences |

### 8.3.5 Notification Bell Component (for sidebar/header)

```tsx
// components/notifications/notification-bell.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from './notification-dropdown';
import { getUnreadCount, getNotifications } from '@/lib/notifications/actions';
import type { Notification } from '@/lib/types';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [count, notifs] = await Promise.all([
        getUnreadCount(),
        getNotifications(10),
      ]);
      setUnreadCount(count);
      setNotifications(notifs);
    };

    fetchData();

    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Phase 8.4: AI Tools Integration

### Update `lib/ai/tools.ts`

Add new tools for budgets, documents, and notifications:

```typescript
// ============================================
// Budget Tools
// ============================================

export const getBudgetsTool = tool({
  description: 'Get all budgets with current progress and spending',
  inputSchema: z.object({
    period: z.enum(['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly']).optional(),
  }),
  execute: async ({ period }) => {
    const summary = await getBudgetSummary();
    let budgets = summary.budgets;

    if (period) {
      budgets = budgets.filter(b => b.budget.period === period);
    }

    return {
      total_budgeted: summary.totalBudgeted,
      total_spent: summary.totalSpent,
      total_remaining: summary.totalRemaining,
      over_budget_count: summary.overBudgetCount,
      approaching_limit_count: summary.approachingLimitCount,
      budgets: budgets.map(b => ({
        name: b.budget.name,
        category: b.budget.category_name,
        period: b.budget.period,
        budgeted: b.budget.amount,
        spent: b.spent,
        remaining: b.remaining,
        percentage: b.percentage,
        is_over_budget: b.isOverBudget,
        is_approaching_limit: b.isApproachingLimit,
        daily_allowance: b.dailyAllowance,
        days_remaining: b.daysRemaining,
      })),
    };
  },
});

// ============================================
// Document Search Tool
// ============================================

export const searchDocumentsTool = tool({
  description: 'Search uploaded documents using semantic search. Use this to find information in bank statements, tax returns, trust deeds, SMSF documents, etc.',
  inputSchema: z.object({
    query: z.string().describe('The search query - what information are you looking for?'),
    entity_type: z.enum(['personal', 'smsf', 'trust']).optional().describe('Filter by entity'),
    document_type: z.enum([
      'bank_statement', 'tax_return', 'receipt', 'invoice',
      'trust_deed', 'distribution_resolution', 'smsf_annual_return',
      'investment_statement', 'contract', 'insurance', 'other'
    ]).optional().describe('Filter by document type'),
  }),
  execute: async ({ query, entity_type, document_type }) => {
    const results = await searchDocuments(query, { entity_type, document_type }, 5);

    if (results.length === 0) {
      return { message: 'No matching documents found.', results: [] };
    }

    return {
      results: results.map(r => ({
        document_name: r.document.name,
        entity: r.document.entity_type,
        type: r.document.document_type,
        financial_year: r.document.financial_year,
        relevant_content: r.chunk.content,
        similarity_score: r.similarity,
      })),
    };
  },
});

// ============================================
// Notification Tool
// ============================================

export const getNotificationsTool = tool({
  description: 'Get pending notifications and reminders for the user',
  inputSchema: z.object({
    type: z.enum([
      'trust_distribution_reminder', 'super_cap_warning', 'smsf_audit_reminder',
      'budget_alert', 'document_processed', 'tax_deadline', 'general'
    ]).optional(),
    unread_only: z.boolean().optional().default(false),
  }),
  execute: async ({ type, unread_only }) => {
    let notifications = await getNotifications(20);

    if (type) {
      notifications = notifications.filter(n => n.notification_type === type);
    }
    if (unread_only) {
      notifications = notifications.filter(n => !n.is_read);
    }

    return {
      count: notifications.length,
      unread_count: notifications.filter(n => !n.is_read).length,
      notifications: notifications.map(n => ({
        title: n.title,
        message: n.message,
        type: n.notification_type,
        priority: n.priority,
        is_read: n.is_read,
        created_at: n.created_at,
        link: n.link_url,
      })),
    };
  },
});
```

### Update System Prompt

Add to `lib/ai/system-prompt.ts`:

```
ADDITIONAL TOOLS (Phase 8)

Budgets:
- get_budgets - Get all budgets with current spending progress
- Use this to answer questions about spending limits and whether the family is on track

Documents:
- search_documents - RAG search across all uploaded documents
- Filter by entity (personal/smsf/trust) and document type
- Use this when the user asks about information that might be in their documents

Notifications:
- get_notifications - Get pending reminders and alerts
- Check this when asked about upcoming deadlines or warnings

PROACTIVE INSIGHTS - Phase 8

Budget Monitoring:
- Alert when budgets are approaching limits
- Suggest adjustments when consistently over/under

Document Reminders:
- Suggest uploading supporting documents for deductions
- Remind about missing tax documents

Deadline Awareness:
- 30 June trust distribution deadline
- Super contribution cap tracking before EOFY
- SMSF audit due dates
```

---

## Phase 8.5: Navigation Updates

### Update Sidebar (`components/app-sidebar.tsx`)

Add new menu items:

```tsx
// Add to navigation items
{
  title: 'Budgets',
  url: '/budgets',
  icon: PieChart,
},
{
  title: 'Documents',
  url: '/documents',
  icon: FileText,
},
{
  title: 'Net Worth',
  url: '/net-worth',
  icon: TrendingUp,
},
```

Add notification bell to header area.

---

## Implementation Sequence

### Week 1: Budgets Module

**Day 1-2: Database & Types**
1. Create `budgets` table migration
2. Add budget types to `lib/types.ts`
3. Create `lib/budgets/actions.ts`

**Day 3-4: UI Components**
1. Create `components/budgets/` folder
2. Build budget-dialog, budget-list, budget-card
3. Build budget-dashboard with progress visualisations

**Day 5: Integration**
1. Create `/budgets` page
2. Add sidebar navigation
3. Wire up AI tool
4. Test budget tracking

### Week 2: Documents Module

**Day 1-2: Database & Storage**
1. Create `documents` table migration
2. Create `document_embeddings` table migration
3. Set up Supabase Storage bucket
4. Add document types to `lib/types.ts`

**Day 3-4: Actions & Embeddings**
1. Create `lib/documents/actions.ts`
2. Implement upload, download, delete
3. Create embedding generation edge function
4. Implement search with pgvector

**Day 5: UI Components**
1. Create `components/documents/` folder
2. Build upload dialog with drag-and-drop
3. Build document list with filters
4. Build document viewer

**Day 6: Integration**
1. Create `/documents` page
2. Add sidebar navigation
3. Wire up AI search tool
4. Test document workflows

### Week 3: Notifications Module

**Day 1-2: Database & Actions**
1. Create `notifications` table migration
2. Add notification types to `lib/types.ts`
3. Create `lib/notifications/actions.ts`
4. Implement automated reminder checks

**Day 3: UI Components**
1. Create notification bell component
2. Create notification dropdown
3. Create notification list page

**Day 4: Integration**
1. Add notification bell to header
2. Wire up reminder system
3. Connect to budget alerts
4. Test notification flows

**Day 5: Polish & Testing**
1. End-to-end testing
2. Fix edge cases
3. Performance optimisation
4. Documentation

---

## Checkpoint Verification

**Phase 8 is complete when:**

### 8.1 Budgets
- [ ] Budgets table created with RLS
- [ ] Can create/edit/delete budgets
- [ ] Budget vs actual tracking working
- [ ] Alerts trigger when approaching limit
- [ ] AI can query budget status

### 8.2 Documents
- [ ] Documents table with Supabase Storage
- [ ] Can upload statements, receipts, trust deeds, SMSF docs
- [ ] Documents categorised by entity (personal, SMSF, trust)
- [ ] document_embeddings table with vector storage
- [ ] Embedding generation on upload
- [ ] Can link documents to transactions
- [ ] AI can search documents with RAG

### 8.3 Notifications
- [ ] Notifications table created
- [ ] 30 June trust distribution reminder working
- [ ] Super cap approaching warnings working
- [ ] SMSF audit due reminder working
- [ ] Budget alerts working
- [ ] Notification bell shows unread count
- [ ] Can mark as read/dismiss

### Final Checkpoint
- [ ] All entities tracked (Personal, SMSF, Trust)
- [ ] AI Accountant functional with all tools
- [ ] Documents searchable via RAG
- [ ] Proactive notifications for key deadlines

---

## File Summary

### Database Migrations (3 new files)
```
supabase/migrations/
├── 20260102000001_create_budgets_table.sql
├── 20260102000002_create_documents_table.sql
├── 20260102000003_create_document_embeddings_table.sql
└── 20260102000004_create_notifications_table.sql
```

### Server Actions (3 new files)
```
lib/
├── budgets/
│   └── actions.ts
├── documents/
│   ├── actions.ts
│   └── embeddings.ts
└── notifications/
    └── actions.ts
```

### Components (15+ new files)
```
components/
├── budgets/
│   ├── budget-dashboard.tsx
│   ├── budget-list.tsx
│   ├── budget-dialog.tsx
│   ├── budget-card.tsx
│   ├── budget-progress-ring.tsx
│   └── add-budget-button.tsx
├── documents/
│   ├── document-list.tsx
│   ├── document-upload-dialog.tsx
│   ├── document-card.tsx
│   ├── document-filters.tsx
│   ├── document-viewer.tsx
│   └── add-document-button.tsx
└── notifications/
    ├── notification-bell.tsx
    ├── notification-dropdown.tsx
    ├── notification-list.tsx
    └── notification-item.tsx
```

### Pages (2 new files)
```
app/
├── budgets/
│   └── page.tsx
└── documents/
    └── page.tsx
```

### Updates to Existing Files
- `lib/types.ts` - Add all new types
- `lib/ai/tools.ts` - Add 3 new tools
- `lib/ai/system-prompt.ts` - Add Phase 8 guidelines
- `components/app-sidebar.tsx` - Add navigation items
- `supabase/functions/` - Add embedding generation function

---

*Generated: 1 January 2026*
