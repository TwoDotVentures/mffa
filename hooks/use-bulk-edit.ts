/**
 * @fileoverview Hook for managing bulk edit operations on transactions.
 * Provides dialogs and handlers for batch delete, payee, category, and description updates.
 * @module hooks/use-bulk-edit
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  deleteTransactions,
  updateTransactionsPayee,
  updateTransactionsCategory,
  updateTransactionsDescription,
  createCategory,
} from '@/lib/transactions/actions';
import type { Category } from '@/lib/types';

/** State for all bulk edit dialogs and loading indicators */
export interface BulkEditState {
  // Delete
  bulkDeleteOpen: boolean;
  bulkDeleteLoading: boolean;

  // Payee
  bulkPayeeOpen: boolean;
  bulkPayeeValue: string;
  bulkPayeeLoading: boolean;

  // Category
  bulkCategoryOpen: boolean;
  bulkCategoryValue: string;
  bulkCategoryLoading: boolean;
  bulkCategorySearch: string;
  bulkNewCategoryName: string;
  bulkNewCategoryLoading: boolean;
  showBulkNewCategoryInput: boolean;

  // Description
  bulkDescriptionOpen: boolean;
  bulkDescriptionValue: string;
  bulkDescriptionLoading: boolean;
}

export interface UseBulkEditReturn {
  state: BulkEditState;

  // Dialog controls
  openBulkDelete: () => void;
  closeBulkDelete: () => void;
  openBulkPayee: () => void;
  closeBulkPayee: () => void;
  openBulkCategory: () => void;
  closeBulkCategory: () => void;
  openBulkDescription: () => void;
  closeBulkDescription: () => void;

  // Value setters
  setBulkPayeeValue: (value: string) => void;
  setBulkCategoryValue: (value: string) => void;
  setBulkCategorySearch: (value: string) => void;
  setBulkNewCategoryName: (value: string) => void;
  setShowBulkNewCategoryInput: (value: boolean) => void;
  setBulkDescriptionValue: (value: string) => void;

  // Actions
  handleBulkDelete: (selectedIds: Set<string>, onSuccess: () => void) => Promise<void>;
  handleBulkPayeeUpdate: (selectedIds: Set<string>, onSuccess: () => void) => Promise<void>;
  handleBulkCategoryUpdate: (selectedIds: Set<string>, onSuccess: () => void) => Promise<void>;
  handleBulkDescriptionUpdate: (selectedIds: Set<string>, onSuccess: () => void) => Promise<void>;
  handleBulkCreateCategory: (onCategoryCreated: (category: Category) => void) => Promise<void>;
}

/**
 * Hook for managing bulk edit operations on multiple transactions.
 * Provides dialog state and handlers for bulk delete, payee, category, and description updates.
 *
 * @returns State, dialog controls, value setters, and action handlers
 * @example
 * const { state, openBulkDelete, handleBulkDelete } = useBulkEdit();
 */
export function useBulkEdit(): UseBulkEditReturn {
  const router = useRouter();

  // Delete state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Payee state
  const [bulkPayeeOpen, setBulkPayeeOpen] = useState(false);
  const [bulkPayeeValue, setBulkPayeeValue] = useState('');
  const [bulkPayeeLoading, setBulkPayeeLoading] = useState(false);

  // Category state
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState('');
  const [bulkCategoryLoading, setBulkCategoryLoading] = useState(false);
  const [bulkCategorySearch, setBulkCategorySearch] = useState('');
  const [bulkNewCategoryName, setBulkNewCategoryName] = useState('');
  const [bulkNewCategoryLoading, setBulkNewCategoryLoading] = useState(false);
  const [showBulkNewCategoryInput, setShowBulkNewCategoryInput] = useState(false);

  // Description state
  const [bulkDescriptionOpen, setBulkDescriptionOpen] = useState(false);
  const [bulkDescriptionValue, setBulkDescriptionValue] = useState('');
  const [bulkDescriptionLoading, setBulkDescriptionLoading] = useState(false);

  // Dialog open/close handlers
  const openBulkDelete = useCallback(() => setBulkDeleteOpen(true), []);
  const closeBulkDelete = useCallback(() => setBulkDeleteOpen(false), []);

  const openBulkPayee = useCallback(() => setBulkPayeeOpen(true), []);
  const closeBulkPayee = useCallback(() => {
    setBulkPayeeOpen(false);
    setBulkPayeeValue('');
  }, []);

  const openBulkCategory = useCallback(() => setBulkCategoryOpen(true), []);
  const closeBulkCategory = useCallback(() => {
    setBulkCategoryOpen(false);
    setBulkCategoryValue('');
    setBulkCategorySearch('');
    setShowBulkNewCategoryInput(false);
    setBulkNewCategoryName('');
  }, []);

  const openBulkDescription = useCallback(() => setBulkDescriptionOpen(true), []);
  const closeBulkDescription = useCallback(() => {
    setBulkDescriptionOpen(false);
    setBulkDescriptionValue('');
  }, []);

  // Action handlers
  const handleBulkDelete = useCallback(
    async (selectedIds: Set<string>, onSuccess: () => void) => {
      if (selectedIds.size === 0) return;

      setBulkDeleteLoading(true);
      const result = await deleteTransactions(Array.from(selectedIds));

      if (result.success) {
        toast.success(`Deleted ${result.deleted} transactions`);
        onSuccess();
        setBulkDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete transactions');
      }

      setBulkDeleteLoading(false);
    },
    [router]
  );

  const handleBulkPayeeUpdate = useCallback(
    async (selectedIds: Set<string>, onSuccess: () => void) => {
      if (selectedIds.size === 0) return;

      setBulkPayeeLoading(true);
      const result = await updateTransactionsPayee(Array.from(selectedIds), bulkPayeeValue);

      if (result.success) {
        toast.success(`Updated payee for ${result.updated} transactions`);
        onSuccess();
        setBulkPayeeOpen(false);
        setBulkPayeeValue('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update payee');
      }

      setBulkPayeeLoading(false);
    },
    [bulkPayeeValue, router]
  );

  const handleBulkCategoryUpdate = useCallback(
    async (selectedIds: Set<string>, onSuccess: () => void) => {
      if (selectedIds.size === 0) return;

      setBulkCategoryLoading(true);
      const categoryId = bulkCategoryValue === 'none' ? null : bulkCategoryValue;
      const result = await updateTransactionsCategory(Array.from(selectedIds), categoryId);

      if (result.success) {
        toast.success(`Updated category for ${result.updated} transactions`);
        onSuccess();
        setBulkCategoryOpen(false);
        setBulkCategoryValue('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update category');
      }

      setBulkCategoryLoading(false);
    },
    [bulkCategoryValue, router]
  );

  const handleBulkDescriptionUpdate = useCallback(
    async (selectedIds: Set<string>, onSuccess: () => void) => {
      if (selectedIds.size === 0) return;

      setBulkDescriptionLoading(true);
      const result = await updateTransactionsDescription(
        Array.from(selectedIds),
        bulkDescriptionValue
      );

      if (result.success) {
        toast.success(`Updated description for ${result.updated} transactions`);
        onSuccess();
        setBulkDescriptionOpen(false);
        setBulkDescriptionValue('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update description');
      }

      setBulkDescriptionLoading(false);
    },
    [bulkDescriptionValue, router]
  );

  const handleBulkCreateCategory = useCallback(
    async (onCategoryCreated: (category: Category) => void) => {
      if (!bulkNewCategoryName.trim()) return;

      setBulkNewCategoryLoading(true);
      // Default to expense type for bulk operations
      const result = await createCategory(bulkNewCategoryName.trim(), 'expense');

      if (result.success && result.category) {
        toast.success(`Created category "${result.category.name}"`);
        onCategoryCreated(result.category);
        setBulkCategoryValue(result.category.id);
        setBulkNewCategoryName('');
        setShowBulkNewCategoryInput(false);
      } else {
        toast.error(result.error || 'Failed to create category');
      }

      setBulkNewCategoryLoading(false);
    },
    [bulkNewCategoryName]
  );

  return {
    state: {
      bulkDeleteOpen,
      bulkDeleteLoading,
      bulkPayeeOpen,
      bulkPayeeValue,
      bulkPayeeLoading,
      bulkCategoryOpen,
      bulkCategoryValue,
      bulkCategoryLoading,
      bulkCategorySearch,
      bulkNewCategoryName,
      bulkNewCategoryLoading,
      showBulkNewCategoryInput,
      bulkDescriptionOpen,
      bulkDescriptionValue,
      bulkDescriptionLoading,
    },

    openBulkDelete,
    closeBulkDelete,
    openBulkPayee,
    closeBulkPayee,
    openBulkCategory,
    closeBulkCategory,
    openBulkDescription,
    closeBulkDescription,

    setBulkPayeeValue,
    setBulkCategoryValue,
    setBulkCategorySearch,
    setBulkNewCategoryName,
    setShowBulkNewCategoryInput,
    setBulkDescriptionValue,

    handleBulkDelete,
    handleBulkPayeeUpdate,
    handleBulkCategoryUpdate,
    handleBulkDescriptionUpdate,
    handleBulkCreateCategory,
  };
}
