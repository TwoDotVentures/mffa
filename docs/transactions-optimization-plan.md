# Transactions Page Optimization Project

## Project Overview
Comprehensive optimization of the transactions page to handle thousands of transactions efficiently with infinite scroll, server-side filtering, and improved inline editing.

**Target:** 100 rows per batch, infinite scroll, handle 10,000+ transactions smoothly

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: DATABASE                              │
│                         (No Dependencies - Start Here)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Task 1.1   │    │   Task 1.2   │    │   Task 1.3   │              │
│  │  Fix N+1     │    │  Pagination  │    │   Indexes    │              │
│  │  Query       │    │  API         │    │              │              │
│  └──────────────┘    └──────┬───────┘    └──────────────┘              │
│                             │                                           │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: CATEGORY DROPDOWN                           │
│                      [depends_on: 1.1]                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐                                  │
│  │   Task 2.1   │───▶│   Task 2.2   │                                  │
│  │  Shared      │    │  Debounce    │                                  │
│  │  Popover     │    │  Search      │                                  │
│  └──────────────┘    └──────────────┘                                  │
│                                                                         │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: VIRTUAL SCROLLING                            │
│                    [depends_on: 1.2, 2.1]                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Task 3.1   │───▶│   Task 3.2   │───▶│   Task 3.3   │              │
│  │  Install     │    │  Virtual     │    │  Infinite    │              │
│  │  Library     │    │  Rows        │    │  Scroll      │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: SERVER-SIDE FILTERING                        │
│                    [depends_on: 1.2, 3.3]                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Task 4.1   │    │   Task 4.2   │    │   Task 4.3   │              │
│  │  Date        │    │  Category/   │    │  Search      │              │
│  │  Filter      │    │  Account     │    │  Filter      │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         └───────────────────┴───────────────────┘                       │
│                             │                                           │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PHASE 5: REFACTORING                                │
│                  [depends_on: 3.3, 4.1, 4.2, 4.3]                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Task 5.1   │    │   Task 5.2   │    │   Task 5.3   │              │
│  │  Split       │    │  Fix Double  │    │  Memoize     │              │
│  │  Components  │    │  Fetch       │    │  Callbacks   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 6: TESTING                                  │
│                    [depends_on: all above]                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   Task 6.1: Final testing and verification                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Task Specifications

### PHASE 1: DATABASE OPTIMIZATIONS
**No dependencies - can start immediately**

#### Task 1.1: Fix N+1 Query in applyCategorisationRules()
**File:** `lib/transactions/actions.ts`
**Priority:** CRITICAL
**Dependencies:** None

**Problem:**
```typescript
// Current: O(n) queries
for (const transaction of transactions) {
  await supabase.from('transactions').update(...).eq('id', transaction.id);
}
```

**Solution:**
```typescript
// Group by category, batch update
const updatesByCategory = new Map<string, string[]>();
for (const transaction of transactions) {
  // ... matching logic
  updatesByCategory.get(categoryId)?.push(transaction.id);
}

// Execute batch updates (one query per category instead of per transaction)
for (const [categoryId, transactionIds] of updatesByCategory) {
  await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', transactionIds);
}
```

**Acceptance Criteria:**
- [ ] Categorising 1000 transactions uses <10 queries (was 1000+)
- [ ] No timeout errors during CSV import
- [ ] Rule application completes in <5 seconds

---

#### Task 1.2: Add Server-Side Pagination to getTransactions()
**File:** `lib/transactions/actions.ts`
**Priority:** CRITICAL
**Dependencies:** None

**New Function Signature:**
```typescript
interface GetTransactionsOptions {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  accountId?: string;
  search?: string;
  sortField?: 'date' | 'amount' | 'payee';
  sortDirection?: 'asc' | 'desc';
}

interface PaginatedTransactions {
  data: Transaction[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

export async function getTransactions(
  options?: GetTransactionsOptions
): Promise<PaginatedTransactions>
```

**Acceptance Criteria:**
- [ ] Default returns first 100 transactions
- [ ] Returns `totalCount` for display
- [ ] Returns `hasMore` boolean for infinite scroll
- [ ] Supports all filter parameters
- [ ] Initial page load <1 second

---

#### Task 1.3: Create Database Indexes
**File:** New migration in `supabase/migrations/`
**Priority:** HIGH
**Dependencies:** None (can run in parallel)

**Migration SQL:**
```sql
-- Index for date-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(date DESC);

-- Index for category filtering and joins
CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category_id);

-- Index for account filtering
CREATE INDEX IF NOT EXISTS idx_transactions_account
ON transactions(account_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_transactions_date_category
ON transactions(date DESC, category_id);

-- Full-text search index for payee/description
CREATE INDEX IF NOT EXISTS idx_transactions_payee_trgm
ON transactions USING gin(payee gin_trgm_ops);
```

**Acceptance Criteria:**
- [ ] All indexes created successfully
- [ ] Query performance improved (check EXPLAIN ANALYZE)

---

### PHASE 2: CATEGORY DROPDOWN OPTIMIZATION
**[depends_on: 1.1]**

#### Task 2.1: Refactor to Single Shared Popover
**Files:**
- `components/transactions/transactions-list.tsx`
- `components/transactions/transaction-row.tsx`
- NEW: `components/transactions/category-popover.tsx`

**Current Problem:** Each of 500 rows has its own Popover instance and state.

**Solution:** Create a single floating popover that:
1. Renders once at the parent level
2. Repositions to clicked cell
3. Manages all category state centrally

**New Component:**
```typescript
// category-popover.tsx
interface CategoryPopoverProps {
  categories: Category[];
  anchorEl: HTMLElement | null;
  transactionId: string | null;
  currentCategoryId: string | null;
  onSelect: (transactionId: string, categoryId: string | null) => Promise<void>;
  onCreate: (transactionId: string, name: string) => Promise<void>;
  onClose: () => void;
}
```

**Acceptance Criteria:**
- [ ] Only ONE popover in DOM regardless of row count
- [ ] Clicking category cell opens popover at correct position
- [ ] Category search/create functionality preserved
- [ ] No lag when opening dropdown

---

#### Task 2.2: Add Debounce to Category Search
**File:** `components/transactions/category-popover.tsx`
**Dependencies:** [depends_on: 2.1]

**Implementation:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => setCategoryFilter(value),
  200
);
```

**Acceptance Criteria:**
- [ ] Search input doesn't filter on every keystroke
- [ ] 200ms delay before filtering
- [ ] No perceived lag for user

---

### PHASE 3: VIRTUAL SCROLLING & INFINITE SCROLL
**[depends_on: 1.2, 2.1]**

#### Task 3.1: Install @tanstack/react-virtual
**File:** `package.json`
**Dependencies:** None (can start early)

**Command:**
```bash
pnpm add @tanstack/react-virtual
```

**Acceptance Criteria:**
- [ ] Package installed
- [ ] No peer dependency conflicts

---

#### Task 3.2: Implement Virtual Row Rendering
**File:** `components/transactions/transactions-list.tsx`
**Dependencies:** [depends_on: 3.1, 2.1]

**Implementation Pattern:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: transactions.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56, // row height in px
  overscan: 10, // render 10 extra rows for smooth scrolling
});

return (
  <div ref={parentRef} className="h-[600px] overflow-auto">
    <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <TransactionRow
          key={transactions[virtualRow.index].id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
          transaction={transactions[virtualRow.index]}
          // ... other props
        />
      ))}
    </div>
  </div>
);
```

**Acceptance Criteria:**
- [ ] Only ~30 DOM rows regardless of total transactions
- [ ] Smooth scrolling through 1000+ transactions
- [ ] No blank areas during fast scroll

---

#### Task 3.3: Implement Infinite Scroll with 100-Row Batches
**Files:**
- `components/transactions/transactions-list.tsx`
- `app/transactions/page.tsx`
- NEW: `hooks/use-infinite-transactions.ts`

**New Hook:**
```typescript
interface UseInfiniteTransactionsOptions {
  initialData: Transaction[];
  totalCount: number;
  filters: TransactionFilters;
}

export function useInfiniteTransactions(options: UseInfiniteTransactionsOptions) {
  const [transactions, setTransactions] = useState(options.initialData);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(options.totalCount > 100);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const result = await getTransactions({
      ...options.filters,
      page: page + 1,
      limit: 100,
    });

    setTransactions(prev => [...prev, ...result.data]);
    setHasMore(result.hasMore);
    setPage(p => p + 1);
    setIsLoading(false);
  }, [page, isLoading, hasMore, options.filters]);

  return { transactions, loadMore, isLoading, hasMore };
}
```

**Integration with Virtualizer:**
```typescript
// Trigger loadMore when scrolling near bottom
useEffect(() => {
  const lastItem = virtualizer.getVirtualItems().at(-1);
  if (lastItem && lastItem.index >= transactions.length - 10 && hasMore) {
    loadMore();
  }
}, [virtualizer.getVirtualItems(), hasMore]);
```

**Acceptance Criteria:**
- [ ] Initial load: 100 transactions in <1 second
- [ ] Scroll to bottom triggers next batch load
- [ ] Loading spinner appears during fetch
- [ ] "Load more" works until all transactions loaded
- [ ] Filter changes reset to page 1

---

### PHASE 4: SERVER-SIDE FILTERING
**[depends_on: 1.2, 3.3]**

#### Task 4.1: Server-Side Date Range Filtering
**File:** `lib/transactions/actions.ts`
**Dependencies:** [depends_on: 1.2]

**Implementation:**
```typescript
if (options.dateFrom) {
  query = query.gte('date', options.dateFrom);
}
if (options.dateTo) {
  query = query.lte('date', options.dateTo);
}
```

**Acceptance Criteria:**
- [ ] Date filter applied at database level
- [ ] Filtered count returned accurately
- [ ] FY presets work correctly

---

#### Task 4.2: Server-Side Category/Account Filtering
**File:** `lib/transactions/actions.ts`
**Dependencies:** [depends_on: 1.2]

**Implementation:**
```typescript
if (options.categoryId) {
  if (options.categoryId === 'uncategorised') {
    query = query.is('category_id', null);
  } else {
    query = query.eq('category_id', options.categoryId);
  }
}
if (options.accountId) {
  query = query.eq('account_id', options.accountId);
}
```

**Acceptance Criteria:**
- [ ] Category filter at database level
- [ ] Account filter at database level
- [ ] "Uncategorised" filter works

---

#### Task 4.3: Server-Side Search
**File:** `lib/transactions/actions.ts`
**Dependencies:** [depends_on: 1.2]

**Implementation:**
```typescript
if (options.search) {
  query = query.or(`payee.ilike.%${options.search}%,description.ilike.%${options.search}%`);
}
```

**Acceptance Criteria:**
- [ ] Search queries database, not client
- [ ] Case-insensitive matching
- [ ] Searches both payee and description

---

### PHASE 5: REFACTORING
**[depends_on: 3.3, 4.1, 4.2, 4.3]**

#### Task 5.1: Split TransactionsList Component
**Files:**
- `components/transactions/transactions-list.tsx` (refactored)
- NEW: `components/transactions/transaction-filters.tsx`
- NEW: `components/transactions/transaction-table.tsx`
- NEW: `components/transactions/transaction-charts.tsx`

**New Structure:**
```
TransactionsList (orchestrator - ~200 lines)
├── TransactionFilters (filters UI - ~300 lines)
├── TransactionCharts (charts - ~200 lines)
└── TransactionTable (virtual table - ~400 lines)
    └── TransactionRow (unchanged)
```

**Acceptance Criteria:**
- [ ] No single file >500 lines
- [ ] Clear separation of concerns
- [ ] All functionality preserved

---

#### Task 5.2: Fix Double-Fetch Pattern
**File:** `app/transactions/page.tsx`
**Dependencies:** None (can be done anytime)

**Current Problem:**
```typescript
if (categories.length === 0) {
  await createDefaultCategories();
}
const finalCategories = categories.length === 0 ? await getCategories() : categories;
```

**Solution:**
```typescript
// Move to a separate initialization check
const categories = await getCategories();
// Default categories are created via database seed or first-run wizard
```

**Acceptance Criteria:**
- [ ] No duplicate getCategories() calls
- [ ] Page loads with single fetch per resource

---

#### Task 5.3: Memoize Row Callbacks
**File:** `components/transactions/transactions-list.tsx`
**Dependencies:** [depends_on: 5.1]

**Implementation:**
```typescript
const handleCategoryUpdate = useCallback(async (transactionId: string, categoryId: string | null) => {
  // ... implementation
}, [/* stable deps only */]);

const handleEdit = useCallback((transaction: Transaction) => {
  setEditTransaction(transaction);
  setEditOpen(true);
}, []);
```

**Acceptance Criteria:**
- [ ] Row callbacks don't cause re-renders
- [ ] React DevTools shows stable references

---

### PHASE 6: TESTING & VERIFICATION
**[depends_on: all above]**

#### Task 6.1: Final Testing
**Scope:** End-to-end verification

**Test Checklist:**
- [ ] Load page with 5000+ transactions - should load in <2 seconds
- [ ] Scroll through all transactions smoothly (60fps)
- [ ] Apply categorisation rules to 500 transactions - <5 seconds
- [ ] Inline category edit responds in <200ms
- [ ] Filter by date range - instant response
- [ ] Filter by category - instant response
- [ ] Search - <500ms response
- [ ] Infinite scroll loads next batch correctly
- [ ] No console errors
- [ ] Mobile view works correctly

---

## Success Metrics

| Metric | Before | Target | Verification |
|--------|--------|--------|--------------|
| Initial Load (1000 txns) | 8-15s | <1s | Browser DevTools |
| Categorisation (500 txns) | 30s+ timeout | <5s | Console timing |
| Inline Category Edit | 2-3s | <200ms | Perceived response |
| Memory (5000 txns) | ~500MB | <100MB | Chrome Task Manager |
| DOM Nodes | 5000+ rows | ~30 rows | React DevTools |
| Scroll FPS | Janky | 60fps | Chrome Performance |

---

## Rollback Plan

Each phase can be rolled back independently:
1. Phase 1: Revert migration, restore original actions.ts
2. Phase 2: Remove shared popover, restore row state
3. Phase 3: Remove virtualizer, restore static list
4. Phase 4: Client-side filters still work as fallback
5. Phase 5: Keep refactored components (no functionality change)

---

## Notes

- All changes preserve existing data and functionality
- Backward compatible with existing CSV imports
- No changes to database schema (only indexes added)
- Mobile responsiveness maintained throughout
