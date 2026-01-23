/**
 * @fileoverview Custom hooks barrel export for the MFFA application.
 * Provides hooks for mobile detection, transaction management, and dialogs.
 * @module hooks
 */

// Mobile detection
export { useIsMobile } from './use-mobile';

// Transaction hooks
export {
  useTransactionFilters,
  type DateRangePreset,
  type TransactionFilterState,
  type UseTransactionFiltersReturn,
  DATE_RANGE_LABELS,
  getDateRangeForPreset,
  formatDateRange,
} from './use-transaction-filters';

export {
  useTransactionSelection,
  type UseTransactionSelectionReturn,
} from './use-transaction-selection';

export {
  useTransactionSorting,
  type SortColumn,
  type SortDirection,
  type UseTransactionSortingReturn,
} from './use-transaction-sorting';

export { useBulkEdit, type BulkEditState, type UseBulkEditReturn } from './use-bulk-edit';

// Dialog hooks
export {
  useDialog,
  useConfirmDialog,
  useMultiDialog,
  type UseDialogReturn,
  type UseConfirmDialogReturn,
  type UseMultiDialogReturn,
  type DialogType,
} from './use-dialog';

// Family member data hook
export { useMemberData, type UseMemberDataReturn } from './use-member-data';
