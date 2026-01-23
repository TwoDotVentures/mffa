/**
 * Budget List Component
 *
 * Renders a grid of budget cards with responsive layout.
 * Stacks to single column on mobile for better readability.
 * Includes empty state with helpful guidance.
 *
 * @component
 * @example
 * <BudgetList budgets={budgetProgressArray} categories={categories} />
 */
'use client';

import { BudgetCard } from './budget-card';
import { Wallet, Plus, TrendingUp } from 'lucide-react';
import type { BudgetProgress, Category } from '@/lib/types';

/** Props for the BudgetList component */
interface BudgetListProps {
  /** Array of budget progress objects to display */
  budgets: BudgetProgress[];
  /** Available categories for budget editing */
  categories: Category[];
}

export function BudgetList({ budgets, categories }: BudgetListProps) {
  /**
   * Empty State Component
   * Shown when user has no budgets set up yet.
   * Provides guidance on getting started.
   */
  if (budgets.length === 0) {
    return (
      <div className="hover:border-primary/30 hover:bg-muted/30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors sm:py-20">
        {/* Icon */}
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Wallet className="text-primary h-8 w-8" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h3 className="text-foreground text-xl font-semibold">No budgets yet</h3>

        {/* Description */}
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Create your first budget to start tracking spending and stay on top of your finances.
        </p>

        {/* Feature Hints */}
        <div className="text-muted-foreground mt-6 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Plus className="text-primary h-4 w-4" aria-hidden="true" />
            <span>Set spending limits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>Track progress</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/*
        Budget Cards Grid - Responsive layout:
        Mobile: Single column for full-width cards
        Tablet: 2 columns
        Desktop: 3 columns for efficient space usage
        Gap increases on larger screens for visual breathing room.
      */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((progress) => (
          <BudgetCard key={progress.budget.id} progress={progress} categories={categories} />
        ))}
      </div>
    </>
  );
}
