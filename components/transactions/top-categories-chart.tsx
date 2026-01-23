/**
 * TopCategoriesChart Component
 *
 * Horizontal bar chart showing top expense categories with expandable
 * sub-categories. Clicking bars opens transaction details popup.
 * Optimized for mobile with touch-friendly tap targets and gestures.
 *
 * @mobile Touch-friendly bars with 44px minimum height
 * @desktop Compact bars with hover states
 * @touch Large tap targets for category and subcategory rows
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { TransactionsPopup } from './transactions-popup';
import type { Transaction, PaginatedTransactionOptions } from '@/lib/types';
import type { CategorySummary } from '@/lib/transactions/actions';
import { getTransactionsForChartPopup } from '@/lib/transactions/actions';

/** Props for TopCategoriesChart component */
interface TopCategoriesChartProps {
  /** Transactions to analyze (used if summaryData not provided) */
  transactions?: Transaction[];
  /** Pre-computed summary data from server (takes precedence over transactions) */
  summaryData?: CategorySummary[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Current filter options (for on-demand popup fetching) */
  filterOptions?: PaginatedTransactionOptions;
}

/** Sub-category data structure */
interface SubCategory {
  name: string;
  fullName: string;
  amount: number;
}

/** Category group data structure */
interface CategoryGroup {
  name: string;
  amount: number;
  subCategories: SubCategory[];
  hasSubCategories: boolean;
}

/**
 * Formats a number as Australian currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/** Color palette for main category bars */
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
];

/** Color palette for sub-category bars */
const SUB_COLORS = [
  'bg-blue-300',
  'bg-green-300',
  'bg-yellow-300',
  'bg-purple-300',
  'bg-pink-300',
  'bg-indigo-300',
  'bg-orange-300',
  'bg-teal-300',
];

/**
 * Chart displaying top expense categories with expandable sub-categories
 */
export function TopCategoriesChart({ transactions = [], summaryData, loading = false, filterOptions }: TopCategoriesChartProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupTransactions, setPopupTransactions] = useState<Transaction[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);

  // Filter expense transactions (excluding transfers) - only used if no summaryData
  const expenseTransactions = useMemo(() => {
    if (summaryData) return []; // Not needed when using summary data
    return transactions.filter(
      (t) => t.transaction_type === 'expense' && t.category?.category_type !== 'transfer'
    );
  }, [transactions, summaryData]);

  // Use server-side data when summaryData is provided
  const useServerData = !!summaryData;

  // Calculate category totals and group by parent
  const categoryData = useMemo(() => {
    // If we have pre-computed summary data, use it directly
    if (summaryData && summaryData.length > 0) {
      const grouped: Record<string, CategoryGroup> = {};

      for (const cat of summaryData) {
        const fullName = cat.name;
        const colonIndex = fullName.indexOf(':');

        if (colonIndex > 0) {
          const parentName = fullName.substring(0, colonIndex).trim();
          const childName = fullName.substring(colonIndex + 1).trim();

          if (!grouped[parentName]) {
            grouped[parentName] = {
              name: parentName,
              amount: 0,
              subCategories: [],
              hasSubCategories: true,
            };
          }
          grouped[parentName].amount += cat.amount;
          grouped[parentName].subCategories.push({
            name: childName,
            fullName: fullName,
            amount: cat.amount,
          });
        } else {
          if (!grouped[fullName]) {
            grouped[fullName] = {
              name: fullName,
              amount: cat.amount,
              subCategories: [],
              hasSubCategories: false,
            };
          } else {
            grouped[fullName].amount += cat.amount;
          }
        }
      }

      // Sort sub-categories by amount
      for (const group of Object.values(grouped)) {
        group.subCategories.sort((a, b) => b.amount - a.amount);
      }

      return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    }

    // Fall back to computing from transactions
    // First, collect all categories with their amounts
    const rawTotals: Record<string, number> = {};

    for (const t of expenseTransactions) {
      const categoryName = t.category?.name || 'Uncategorised';
      rawTotals[categoryName] = (rawTotals[categoryName] || 0) + t.amount;
    }

    // Now group by parent category (before the ":")
    const grouped: Record<string, CategoryGroup> = {};

    for (const [fullName, amount] of Object.entries(rawTotals)) {
      // Check if category has a ":" separator
      const colonIndex = fullName.indexOf(':');

      if (colonIndex > 0) {
        // Has parent:child format
        const parentName = fullName.substring(0, colonIndex).trim();
        const childName = fullName.substring(colonIndex + 1).trim();

        if (!grouped[parentName]) {
          grouped[parentName] = {
            name: parentName,
            amount: 0,
            subCategories: [],
            hasSubCategories: true,
          };
        }

        grouped[parentName].amount += amount;
        grouped[parentName].subCategories.push({ name: childName, fullName, amount });
      } else {
        // No separator, standalone category
        if (!grouped[fullName]) {
          grouped[fullName] = {
            name: fullName,
            amount: 0,
            subCategories: [],
            hasSubCategories: false,
          };
        }
        grouped[fullName].amount += amount;
      }
    }

    // Sort sub-categories by amount
    for (const group of Object.values(grouped)) {
      group.subCategories.sort((a, b) => b.amount - a.amount);
    }

    return Object.values(grouped)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [expenseTransactions]);

  const maxAmount = categoryData.length > 0 ? categoryData[0].amount : 0;
  const totalExpenses = categoryData.reduce((sum, c) => sum + c.amount, 0);

  /**
   * Toggles expansion state for a category
   */
  const toggleExpanded = (e: React.MouseEvent, categoryName: string) => {
    e.stopPropagation();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  /**
   * Opens popup with transactions for a category
   * Uses on-demand server fetch when summaryData is used for efficiency
   */
  const handleCategoryClick = useCallback(async (category: CategoryGroup) => {
    setPopupTitle(category.name);
    setPopupOpen(true);

    if (useServerData) {
      // Fetch transactions on-demand from server
      setPopupLoading(true);
      setPopupTransactions([]);
      try {
        const data = await getTransactionsForChartPopup('category', category.name, filterOptions || {});
        setPopupTransactions(data);
      } catch (error) {
        console.error('Error fetching category transactions:', error);
      } finally {
        setPopupLoading(false);
      }
    } else {
      // Use local filtering for legacy mode
      let filtered: Transaction[];
      if (category.hasSubCategories) {
        const prefix = category.name + ':';
        filtered = expenseTransactions.filter(
          (t) => t.category?.name?.startsWith(prefix)
        );
      } else {
        filtered = expenseTransactions.filter(
          (t) => (t.category?.name || 'Uncategorised') === category.name
        );
      }
      setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [useServerData, filterOptions, expenseTransactions]);

  /**
   * Opens popup with transactions for a sub-category
   * Uses on-demand server fetch when summaryData is used for efficiency
   */
  const handleSubCategoryClick = useCallback(async (e: React.MouseEvent, subCategory: SubCategory) => {
    e.stopPropagation();
    setPopupTitle(subCategory.fullName);
    setPopupOpen(true);

    if (useServerData) {
      // Fetch transactions on-demand from server (use full name for exact match)
      setPopupLoading(true);
      setPopupTransactions([]);
      try {
        const data = await getTransactionsForChartPopup('category', subCategory.fullName, filterOptions || {});
        setPopupTransactions(data);
      } catch (error) {
        console.error('Error fetching subcategory transactions:', error);
      } finally {
        setPopupLoading(false);
      }
    } else {
      // Use local filtering for legacy mode
      const filtered = expenseTransactions.filter(
        (t) => t.category?.name === subCategory.fullName
      );
      setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [useServerData, filterOptions, expenseTransactions]);

  // Loading state with animated skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[80, 65, 50, 40, 30].map((width, i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full">
                  <div
                    className="h-2.5 bg-muted-foreground/20 rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No expense transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((category, index) => {
              const percentage = maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;
              const totalPercentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
              const isExpanded = expandedCategories.has(category.name);
              const subMaxAmount = category.subCategories.length > 0
                ? category.subCategories[0].amount
                : 0;

              return (
                <div key={category.name} className="space-y-1">
                  {/*
                    Main category row
                    - Touch-friendly minimum height (44px via py-2)
                    - Active state feedback for mobile
                  */}
                  <div
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 active:bg-muted -mx-2 px-2 py-2 rounded-lg transition-colors"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="truncate font-medium">{category.name}</span>
                      {category.hasSubCategories && (
                        <button
                          onClick={(e) => toggleExpanded(e, category.name)}
                          className="p-1 hover:bg-muted rounded-md transition-colors flex-shrink-0"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                      )}
                    </div>
                    <span className="text-muted-foreground text-right flex-shrink-0 ml-2">
                      {formatCurrency(category.amount)}
                      <span className="ml-1 text-xs">({totalPercentage.toFixed(0)}%)</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 md:h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2.5 md:h-2 rounded-full transition-all duration-300 ${COLORS[index % COLORS.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/*
                    Sub-categories (expanded)
                    - Indented with border indicator
                    - Same touch-friendly sizing
                  */}
                  {category.hasSubCategories && isExpanded && (
                    <div className="ml-4 mt-2 space-y-2 border-l-2 border-muted pl-3">
                      {category.subCategories.map((sub, subIndex) => {
                        const subPercentage = subMaxAmount > 0
                          ? (sub.amount / subMaxAmount) * 100
                          : 0;
                        const subTotalPercentage = category.amount > 0
                          ? (sub.amount / category.amount) * 100
                          : 0;

                        return (
                          <div
                            key={sub.name}
                            className="space-y-1 cursor-pointer hover:bg-muted/50 active:bg-muted -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                            onClick={(e) => handleSubCategoryClick(e, sub)}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate text-muted-foreground">{sub.name}</span>
                              <span className="text-muted-foreground ml-2 flex-shrink-0">
                                {formatCurrency(sub.amount)}
                                <span className="ml-1">({subTotalPercentage.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="h-2 md:h-1.5 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 md:h-1.5 rounded-full transition-all duration-300 ${SUB_COLORS[subIndex % SUB_COLORS.length]}`}
                                style={{ width: `${subPercentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TransactionsPopup
        open={popupOpen}
        onOpenChange={setPopupOpen}
        title={popupTitle}
        transactions={popupTransactions}
        loading={popupLoading}
      />
    </>
  );
}
