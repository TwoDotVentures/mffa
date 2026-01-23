/**
 * @fileoverview Hooks for managing dialog and modal state.
 * Provides generic, confirmation, and multi-dialog patterns.
 * @module hooks/use-dialog
 */

'use client';

import { useState, useCallback } from 'react';

/** Return type for the basic useDialog hook */
export interface UseDialogReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

/**
 * Generic hook for managing dialog open/close state with optional data.
 * Useful for edit, delete, and create dialogs.
 *
 * @template T - Type of data associated with the dialog
 * @param initialData - Optional initial data for the dialog
 * @returns Dialog state and control functions
 * @example
 * const { isOpen, data, open, close } = useDialog<Transaction>();
 * open(transaction); // Opens dialog with data
 */
export function useDialog<T = unknown>(initialData: T | null = null): UseDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optionally clear data after close animation
    // setTimeout(() => setData(null), 300);
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Clear data when closing
      setData(null);
    }
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    setOpen,
  };
}

/** Return type for the confirmation dialog hook */
export interface UseConfirmDialogReturn<T = unknown> {
  isOpen: boolean;
  isLoading: boolean;
  data: T | null;
  open: (data: T) => void;
  close: () => void;
  confirm: () => Promise<void>;
  setConfirmAction: (action: () => Promise<void>) => void;
}

/**
 * Hook for managing a confirmation dialog with loading state.
 * Useful for delete confirmations and other destructive actions.
 *
 * @template T - Type of data associated with the confirmation
 * @returns Confirmation dialog state and handlers
 * @example
 * const { isOpen, isLoading, open, confirm } = useConfirmDialog<string>();
 * open(itemId);
 * await confirm();
 */
export function useConfirmDialog<T = unknown>(): UseConfirmDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [confirmAction, setConfirmActionState] = useState<(() => Promise<void>) | null>(null);

  const open = useCallback((newData: T) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!confirmAction) return;
    setIsLoading(true);
    try {
      await confirmAction();
    } finally {
      setIsLoading(false);
    }
  }, [confirmAction]);

  const setConfirmAction = useCallback((action: () => Promise<void>) => {
    setConfirmActionState(() => action);
  }, []);

  return {
    isOpen,
    isLoading,
    data,
    open,
    close,
    confirm,
    setConfirmAction,
  };
}

/** Type for identifying which dialog is active */
export type DialogType = 'edit' | 'delete' | 'create' | 'view' | string;

export interface UseMultiDialogReturn<T = unknown> {
  activeDialog: DialogType | null;
  data: T | null;
  isOpen: (type: DialogType) => boolean;
  open: (type: DialogType, data?: T) => void;
  close: () => void;
}

/**
 * Hook for managing multiple related dialogs in a component.
 * Only one dialog can be active at a time.
 *
 * @template T - Type of data shared across dialogs
 * @returns Multi-dialog state and control functions
 * @example
 * const { isOpen, open, close } = useMultiDialog<Transaction>();
 * open('edit', transaction);
 * if (isOpen('edit')) { ... }
 */
export function useMultiDialog<T = unknown>(): UseMultiDialogReturn<T> {
  const [activeDialog, setActiveDialog] = useState<DialogType | null>(null);
  const [data, setData] = useState<T | null>(null);

  const isOpen = useCallback((type: DialogType) => activeDialog === type, [activeDialog]);

  const open = useCallback((type: DialogType, newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setActiveDialog(type);
  }, []);

  const close = useCallback(() => {
    setActiveDialog(null);
    setData(null);
  }, []);

  return {
    activeDialog,
    data,
    isOpen,
    open,
    close,
  };
}
