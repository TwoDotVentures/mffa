'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Settings2 } from 'lucide-react';
import { TransactionDialog } from './transaction-dialog';
import { CSVImportDialog } from './csv-import-dialog';
import { CategorisationRulesDialog } from './categorisation-rules-dialog';
import type { Account, Category } from '@/lib/types';

interface TransactionButtonsProps {
  accounts: Account[];
  categories: Category[];
}

export function TransactionButtons({ accounts, categories }: TransactionButtonsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
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

      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
        categories={categories}
      />

      <CSVImportDialog open={importOpen} onOpenChange={setImportOpen} accounts={accounts} />

      <CategorisationRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        categories={categories}
      />
    </>
  );
}
