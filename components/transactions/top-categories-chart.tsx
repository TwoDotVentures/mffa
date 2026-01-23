'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, ChevronDown, ChevronRight } from 'lucide-react';
import { TransactionsPopup } from './transactions-popup';
import type { Transaction } from '@/lib/types';

interface TopCategoriesChartProps {
  transactions: Transaction[];
}

interface SubCategory {
  name: string;
  fullName: string;
  amount: number;
}

interface CategoryGroup {
  name: string;
  amount: number;
  subCategories: SubCategory[];
  hasSubCategories: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

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

export function TopCategoriesChart({ transactions }: TopCategoriesChartProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupTransactions, setPopupTransactions] = useState<Transaction[]>([]);

  // Filter expense transactions (excluding transfers)
  const expenseTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.transaction_type === 'expense' && t.category?.category_type !== 'transfer'
    );
  }, [transactions]);

  const categoryData = useMemo(() => {
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

  const handleCategoryClick = (category: CategoryGroup) => {
    // Get transactions for this category (including all sub-categories if it's a parent)
    let filtered: Transaction[];

    if (category.hasSubCategories) {
      // Match any category that starts with "ParentName:"
      const prefix = category.name + ':';
      filtered = expenseTransactions.filter(
        (t) => t.category?.name?.startsWith(prefix)
      );
    } else {
      // Match exact category name
      filtered = expenseTransactions.filter(
        (t) => (t.category?.name || 'Uncategorised') === category.name
      );
    }

    setPopupTitle(category.name);
    setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPopupOpen(true);
  };

  const handleSubCategoryClick = (e: React.MouseEvent, subCategory: SubCategory) => {
    e.stopPropagation();

    const filtered = expenseTransactions.filter(
      (t) => t.category?.name === subCategory.fullName
    );

    setPopupTitle(subCategory.fullName);
    setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPopupOpen(true);
  };

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
                  {/* Main category row */}
                  <div
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="flex items-center gap-1">
                      {category.hasSubCategories && (
                        <button
                          onClick={(e) => toggleExpanded(e, category.name)}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          }
                        </button>
                      )}
                      <span className="truncate font-medium">{category.name}</span>
                      {category.hasSubCategories && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({category.subCategories.length})
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(category.amount)}
                      <span className="ml-1 text-xs">({totalPercentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${COLORS[index % COLORS.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Sub-categories (expanded) */}
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
                            className="space-y-1 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
                            onClick={(e) => handleSubCategoryClick(e, sub)}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate text-muted-foreground">{sub.name}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(sub.amount)}
                                <span className="ml-1">({subTotalPercentage.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className={`h-1.5 rounded-full ${SUB_COLORS[subIndex % SUB_COLORS.length]}`}
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
      />
    </>
  );
}
