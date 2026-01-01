'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, Plus, Wand2 } from 'lucide-react';
import {
  getCategorisationRules,
  createCategorisationRule,
  updateCategorisationRule,
  deleteCategorisationRule,
  applyCategorisationRules,
  type CategorisationRuleFormData,
} from '@/lib/transactions/actions';
import type { CategorisationRule, Category } from '@/lib/types';

interface CategorisationRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export function CategorisationRulesDialog({
  open,
  onOpenChange,
  categories,
}: CategorisationRulesDialogProps) {
  const router = useRouter();
  const [rules, setRules] = useState<CategorisationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [matchField, setMatchField] = useState<'description' | 'payee' | 'reference'>('description');
  const [matchType, setMatchType] = useState<'contains' | 'starts_with' | 'ends_with' | 'exact'>('contains');
  const [matchValue, setMatchValue] = useState('');

  useEffect(() => {
    if (open) {
      loadRules();
    }
  }, [open]);

  const loadRules = async () => {
    setLoading(true);
    const data = await getCategorisationRules();
    setRules(data);
    setLoading(false);
  };

  const handleAddRule = async () => {
    if (!categoryId || !matchValue.trim()) return;

    setSaving(true);
    const formData: CategorisationRuleFormData = {
      category_id: categoryId,
      match_field: matchField,
      match_type: matchType,
      match_value: matchValue.trim(),
    };

    const result = await createCategorisationRule(formData);

    if (result.success) {
      await loadRules();
      setShowAddForm(false);
      setCategoryId('');
      setMatchValue('');
      router.refresh();
    }

    setSaving(false);
  };

  const handleToggleActive = async (rule: CategorisationRule) => {
    await updateCategorisationRule(rule.id, { is_active: !rule.is_active });
    await loadRules();
    router.refresh();
  };

  const handleDelete = async (ruleId: string) => {
    await deleteCategorisationRule(ruleId);
    await loadRules();
    router.refresh();
  };

  const handleApplyRules = async () => {
    setApplying(true);
    const result = await applyCategorisationRules();
    if (result.success) {
      router.refresh();
    }
    setApplying(false);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getMatchTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contains: 'Contains',
      starts_with: 'Starts with',
      ends_with: 'Ends with',
      exact: 'Exact match',
    };
    return labels[type] || type;
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      payee: 'Payee',
      reference: 'Reference',
    };
    return labels[field] || field;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Auto-Categorisation Rules</DialogTitle>
          <DialogDescription>
            Set up rules to automatically categorise imported transactions based on their description, payee, or reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApplyRules}
              disabled={applying}
            >
              {applying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Apply Rules to Uncategorised
            </Button>
          </div>

          {/* Add rule form */}
          {showAddForm && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>When</Label>
                    <Select value={matchField} onValueChange={(v) => setMatchField(v as typeof matchField)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="payee">Payee</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Match Type</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="starts_with">Starts with</SelectItem>
                        <SelectItem value="ends_with">Ends with</SelectItem>
                        <SelectItem value="exact">Exact match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Match Value</Label>
                  <Input
                    value={matchValue}
                    onChange={(e) => setMatchValue(e.target.value)}
                    placeholder="e.g., WOOLWORTHS, COLES, UBER"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Assign Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddRule}
                    disabled={saving || !categoryId || !matchValue.trim()}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rules list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No categorisation rules yet.</p>
              <p className="text-sm">Add a rule to automatically categorise transactions.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Active</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFieldLabel(rule.match_field)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getMatchTypeLabel(rule.match_type)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {rule.match_value}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getCategoryName(rule.category_id)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
