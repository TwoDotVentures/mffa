'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import type { Category, Transaction } from '@/lib/types';

/**
 * Shared category selection popover that renders once at the parent level.
 * Dramatically reduces DOM nodes and React state when displaying many transactions.
 *
 * Instead of each row having its own popover (N popovers for N rows),
 * this single component positions itself next to the clicked category cell.
 */

export interface CategoryPopoverState {
  /** Whether the popover is open */
  isOpen: boolean;
  /** The transaction being edited */
  transaction: Transaction | null;
  /** Position to render the popover */
  anchorRect: DOMRect | null;
}

interface CategoryPopoverProps {
  /** Current state of the popover */
  state: CategoryPopoverState;
  /** All available categories */
  categories: Category[];
  /** Callback when a category is selected */
  onSelect: (transactionId: string, categoryId: string | null) => Promise<void>;
  /** Callback when a new category should be created */
  onCreate: (transactionId: string, transaction: Transaction, name: string) => Promise<void>;
  /** Callback to close the popover */
  onClose: () => void;
  /** Whether a category update is in progress */
  isLoading?: boolean;
}

export function CategoryPopover({
  state,
  categories,
  onSelect,
  onCreate,
  onClose,
  isLoading = false,
}: CategoryPopoverProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search to avoid filtering on every keystroke
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 200);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch]
  );

  // Reset state when popover closes
  useEffect(() => {
    if (!state.isOpen) {
      setSearchValue('');
      setDebouncedSearch('');
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    }
  }, [state.isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (state.isOpen && searchInputRef.current) {
      // Small delay to ensure popover is positioned
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [state.isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, onClose]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    async (categoryId: string | null) => {
      if (!state.transaction) return;
      await onSelect(state.transaction.id, categoryId);
      onClose();
    },
    [state.transaction, onSelect, onClose]
  );

  // Handle new category creation
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim() || !state.transaction) return;
    setIsCreatingCategory(true);
    try {
      await onCreate(state.transaction.id, state.transaction, newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      onClose();
    } finally {
      setIsCreatingCategory(false);
    }
  }, [newCategoryName, state.transaction, onCreate, onClose]);

  // Handle enter key in new category input
  const handleNewCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateCategory();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowNewCategoryInput(false);
        setNewCategoryName('');
      }
    },
    [handleCreateCategory]
  );

  // Filter categories based on debounced search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Don't render if not open or no anchor position
  if (!state.isOpen || !state.anchorRect || !state.transaction) {
    return null;
  }

  // Calculate popover position
  const { left, top, height } = state.anchorRect;
  const popoverTop = top + height + 4; // 4px gap below anchor

  return (
    <div
      ref={popoverRef}
      className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 fixed z-50 w-[220px] rounded-md border p-2 shadow-md outline-none"
      style={{
        left: `${left}px`,
        top: `${popoverTop}px`,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <Input
            ref={searchInputRef}
            placeholder="Search categories..."
            value={searchValue}
            onChange={handleSearchChange}
            className="mb-2 h-8"
          />
          <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
            {!debouncedSearch && (
              <button
                className={`hover:bg-muted w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  !state.transaction.category_id ? 'bg-muted' : ''
                }`}
                onClick={() => handleCategorySelect(null)}
              >
                No Category
              </button>
            )}
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                className={`hover:bg-muted w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  state.transaction?.category_id === category.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </button>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-muted-foreground py-2 text-center text-sm">No categories found</p>
            )}
          </div>
          <div className="mt-2 border-t pt-2">
            {showNewCategoryInput ? (
              <div className="space-y-2">
                <Input
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-8"
                  autoFocus
                  onKeyDown={handleNewCategoryKeyDown}
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 flex-1"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                  >
                    {isCreatingCategory && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="hover:bg-muted text-primary flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm transition-colors"
                onClick={() => setShowNewCategoryInput(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add new category
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hook to manage category popover state.
 * Use this in the parent component that renders the TransactionsList.
 */
export function useCategoryPopover() {
  const [state, setState] = useState<CategoryPopoverState>({
    isOpen: false,
    transaction: null,
    anchorRect: null,
  });

  const open = useCallback((transaction: Transaction, anchorElement: HTMLElement) => {
    const rect = anchorElement.getBoundingClientRect();
    setState({
      isOpen: true,
      transaction,
      anchorRect: rect,
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      transaction: null,
      anchorRect: null,
    });
  }, []);

  return { state, open, close };
}
