/**
 * TransactionButtons Component
 *
 * Action buttons for transaction management including add, import, and rules.
 * Responsive design with icon-only buttons on mobile and full labels on desktop.
 *
 * @mobile Icon-only compact buttons with tooltip hints
 * @desktop Full buttons with icons and text labels
 * @touch Minimum 44px touch targets
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Upload, Settings2, MoreVertical } from 'lucide-react';
import { TransactionDialog } from './transaction-dialog';
import { CSVImportDialog } from './csv-import-dialog';
import { CategorisationRulesDialog } from './categorisation-rules-dialog';
import type { Account, Category } from '@/lib/types';

/** Props for TransactionButtons component */
interface TransactionButtonsProps {
  /** Available accounts for new transactions */
  accounts: Account[];
  /** Available categories for new transactions */
  categories: Category[];
}

/**
 * Transaction action buttons with responsive mobile/desktop layouts
 */
export function TransactionButtons({ accounts, categories }: TransactionButtonsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <>
      {/*
        Desktop Button Group
        - Full buttons with icons and labels
        - Hidden on mobile
      */}
      <div className="hidden sm:flex gap-2">
        <Button variant="outline" onClick={() => setRulesOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Rules
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/*
        Mobile Button Group
        - Primary action visible, secondary in dropdown
        - Large touch targets (44px)
      */}
      <div className="flex sm:hidden gap-2">
        {/* Secondary Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setImportOpen(true)} className="py-3">
              <Upload className="mr-3 h-4 w-4" />
              Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRulesOpen(true)} className="py-3">
              <Settings2 className="mr-3 h-4 w-4" />
              Manage Rules
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Primary Add Button - Always visible */}
        <Button onClick={() => setAddOpen(true)} className="h-11 px-4">
          <Plus className="mr-2 h-5 w-5" />
          Add
        </Button>
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
        categories={categories}
      />

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        accounts={accounts}
        categories={categories}
      />

      {/* Categorisation Rules Dialog */}
      <CategorisationRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        categories={categories}
      />
    </>
  );
}
