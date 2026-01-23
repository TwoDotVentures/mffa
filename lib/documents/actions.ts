/**
 * @fileoverview Server actions for managing financial documents.
 * Provides CRUD operations, file uploads, vector search, and embedding generation.
 * @module lib/documents/actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Document,
  DocumentFilters,
  DocumentSearchResult,
  DocumentUploadData,
} from '@/lib/types';

// ============================================
// Document CRUD Operations
// ============================================

/**
 * Retrieves documents with optional filters and generates signed download URLs.
 * Supports filtering by entity type, document type, financial year, and search text.
 *
 * @param filters - Optional filters to apply to the query
 * @returns Promise resolving to an array of Document objects with download URLs
 */
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

  // Generate signed download URLs
  type DocRow = { id: string; storage_path: string; [key: string]: unknown };
  const documentsWithUrls = await Promise.all(
    ((data || []) as DocRow[]).map(async (doc: DocRow) => {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry
      return { ...doc, download_url: urlData?.signedUrl };
    })
  );

  return documentsWithUrls as unknown as Document[];
}

/**
 * Retrieves a single document by ID with a signed download URL.
 *
 * @param id - The UUID of the document to retrieve
 * @returns Promise resolving to the Document object or null if not found
 */
export async function getDocument(id: string): Promise<Document | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  // Generate signed URL
  if (data) {
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.storage_path, 3600);
    return { ...data, download_url: urlData?.signedUrl } as unknown as Document;
  }

  return data as unknown as Document;
}

/**
 * Uploads a document file to Supabase Storage and creates a database record.
 * Files are stored in user-specific paths with unique identifiers.
 *
 * @param formData - FormData containing file and metadata fields
 * @returns Promise resolving to success status, optional error, and created Document
 */
export async function uploadDocument(formData: FormData): Promise<{ success: boolean; error?: string; data?: Document }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  const name = formData.get('name') as string;
  const entityType = formData.get('entity_type') as string;
  const documentType = formData.get('document_type') as string;
  const description = formData.get('description') as string | null;
  const financialYear = formData.get('financial_year') as string | null;
  const linkedTransactionId = formData.get('linked_transaction_id') as string | null;
  const tagsJson = formData.get('tags') as string | null;
  const tags = tagsJson ? JSON.parse(tagsJson) : [];

  // Generate unique storage path: user_id/timestamp-uuid.ext
  const fileExt = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID();
  const storagePath = `${user.id}/${timestamp}-${uniqueId}.${fileExt}`;

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
      entity_type: entityType,
      document_type: documentType,
      description: description || null,
      financial_year: financialYear || null,
      linked_transaction_id: linkedTransactionId || null,
      tags,
      is_processed: false,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Error creating document record:', dbError);
    // Clean up uploaded file
    await supabase.storage.from('documents').remove([storagePath]);
    return { success: false, error: dbError.message };
  }

  // Queue for embedding generation (async - would be handled by edge function in production)
  // For now, just mark the document as needing processing

  revalidatePath('/documents');
  return { success: true, data: data as unknown as Document };
}

/**
 * Updates document metadata (not the file itself).
 *
 * @param id - The UUID of the document to update
 * @param updates - Partial document data to update
 * @returns Promise resolving to success status and optional error
 */
export async function updateDocument(
  id: string,
  updates: Partial<DocumentUploadData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('documents')
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.entity_type && { entity_type: updates.entity_type }),
      ...(updates.document_type && { document_type: updates.document_type }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.financial_year !== undefined && { financial_year: updates.financial_year }),
      ...(updates.linked_transaction_id !== undefined && { linked_transaction_id: updates.linked_transaction_id }),
      ...(updates.tags && { tags: updates.tags }),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating document:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/documents');
  return { success: true };
}

/**
 * Deletes a document from both storage and database.
 * Also removes associated embeddings via cascade delete.
 *
 * @param id - The UUID of the document to delete
 * @returns Promise resolving to success status and optional error
 */
export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get document to find storage path
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!doc) {
    return { success: false, error: 'Document not found' };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    // Continue anyway - delete the DB record
  }

  // Delete database record (embeddings cascade)
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting document record:', dbError);
    return { success: false, error: dbError.message };
  }

  revalidatePath('/documents');
  return { success: true };
}

// ============================================
// Document Search (RAG)
// ============================================

/**
 * Searches documents using vector similarity (RAG).
 * Generates an embedding for the query and finds similar document chunks.
 *
 * @param query - Natural language search query
 * @param filters - Optional filters for entity type and document type
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Promise resolving to an array of DocumentSearchResult objects
 */
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
  if (!embedding) {
    console.error('Failed to generate embedding for query');
    return [];
  }

  // Vector similarity search using our database function
  // Convert embedding array to string format for pgvector
  const embeddingString = `[${embedding.join(',')}]`;
  const { data, error } = await supabase.rpc('search_document_embeddings', {
    query_embedding: embeddingString,
    match_threshold: 0.7,
    match_count: limit,
    filter_user_id: user.id,
    filter_entity_type: filters?.entity_type || undefined,
    filter_document_type: filters?.document_type || undefined,
  });

  if (error) {
    console.error('Error searching documents:', error);
    return [];
  }

  return (data || []) as unknown as DocumentSearchResult[];
}

// ============================================
// Embedding Generation
// ============================================

/**
 * Generates a text embedding using OpenAI's embedding API.
 *
 * @param text - The text to generate an embedding for
 * @returns Promise resolving to embedding vector or null on error
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.slice(0, 8000), // Limit input length
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// ============================================
// Document Processing (Embedding Generation)
// ============================================

/**
 * Processes a document to generate embeddings for vector search.
 * Downloads the file, extracts text, splits into chunks, and generates embeddings.
 *
 * @param documentId - The UUID of the document to process
 * @returns Promise resolving to success status and optional error
 */
export async function processDocumentForEmbeddings(documentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get document
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return { success: false, error: 'Document not found' };
  }

  // Download file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(doc.storage_path);

  if (downloadError || !fileData) {
    await supabase.from('documents').update({
      processing_error: 'Failed to download file',
    }).eq('id', documentId);
    return { success: false, error: 'Failed to download file' };
  }

  try {
    // Extract text based on file type
    let text = '';
    if (doc.file_type === 'text/plain' || doc.file_type.startsWith('text/')) {
      text = await fileData.text();
    } else if (doc.file_type === 'application/pdf') {
      // PDF parsing would need additional library like pdf-parse
      // For now, skip PDF embedding
      text = `Document: ${doc.name}. ${doc.description || ''}`;
    } else {
      // For other types, just use metadata
      text = `Document: ${doc.name}. Type: ${doc.document_type}. ${doc.description || ''}`;
    }

    // Split into chunks (roughly 500 tokens each, ~2000 chars)
    const chunks = splitIntoChunks(text, 2000);

    // Delete existing embeddings
    await supabase.from('document_embeddings').delete().eq('document_id', documentId);

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      if (embedding) {
        // Convert embedding array to string format for pgvector
        const embeddingString = `[${embedding.join(',')}]`;
        await supabase.from('document_embeddings').insert({
          document_id: documentId,
          chunk_index: i,
          content: chunks[i],
          embedding: embeddingString,
          token_count: Math.ceil(chunks[i].length / 4), // Rough estimate
        });
      }
    }

    // Mark document as processed
    await supabase.from('documents').update({
      is_processed: true,
      processing_error: null,
    }).eq('id', documentId);

    return { success: true };
  } catch (error) {
    console.error('Error processing document:', error);
    await supabase.from('documents').update({
      processing_error: error instanceof Error ? error.message : 'Processing failed',
    }).eq('id', documentId);
    return { success: false, error: 'Processing failed' };
  }
}

/**
 * Splits text into chunks for embedding generation.
 * Attempts to split on paragraph boundaries to maintain context.
 *
 * @param text - The text to split
 * @param maxChars - Maximum characters per chunk
 * @returns Array of text chunks
 */
function splitIntoChunks(text: string, maxChars: number): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks, create one from the whole text
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text.trim().slice(0, maxChars));
  }

  return chunks;
}

// ============================================
// Document Stats
// ============================================

/**
 * Calculates document statistics for the current user.
 * Groups documents by entity type and document type.
 *
 * @returns Promise resolving to document counts by category
 */
export async function getDocumentStats(): Promise<{
  totalDocuments: number;
  byEntity: Record<string, number>;
  byType: Record<string, number>;
  processedCount: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { totalDocuments: 0, byEntity: {}, byType: {}, processedCount: 0 };
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('entity_type, document_type, is_processed')
    .eq('user_id', user.id);

  if (!documents) {
    return { totalDocuments: 0, byEntity: {}, byType: {}, processedCount: 0 };
  }

  const byEntity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let processedCount = 0;

  for (const doc of documents) {
    byEntity[doc.entity_type] = (byEntity[doc.entity_type] || 0) + 1;
    byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
    if (doc.is_processed) processedCount++;
  }

  return {
    totalDocuments: documents.length,
    byEntity,
    byType,
    processedCount,
  };
}
