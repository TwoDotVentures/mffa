/**
 * CategorisationRulesDialog Component
 *
 * Dialog for managing auto-categorisation rules for transactions.
 * Rules automatically assign categories based on matching criteria.
 * Fully optimized for mobile with card-based rule display.
 *
 * @mobile Card-based rule list with touch-friendly controls
 * @desktop Table view with inline actions
 * @touch Large toggle switches and action buttons
 */
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
  DialogBody,
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
import { Loader2, Trash2, Plus, Wand2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getCategorisationRules,
  createCategorisationRule,
  updateCategorisationRule,
  deleteCategorisationRule,
  applyCategorisationRules,
  type CategorisationRuleFormData,
} from '@/lib/transactions/actions';
import type { CategorisationRule, Category } from '@/lib/types';

/** Props for CategorisationRulesDialog component */
interface CategorisationRulesDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Available categories for rule assignment */
  categories: Category[];
}

/**
 * Dialog for managing auto-categorisation rules with mobile support
 */
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

  /**
   * Loads rules from server
   */
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

  /**
   * Handles creating a new rule
   */
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

  /**
   * Toggles rule active state
   */
  const handleToggleActive = async (rule: CategorisationRule) => {
    await updateCategorisationRule(rule.id, { is_active: !rule.is_active });
    await loadRules();
    router.refresh();
  };

  /**
   * Deletes a rule
   */
  const handleDelete = async (ruleId: string) => {
    await deleteCategorisationRule(ruleId);
    await loadRules();
    router.refresh();
  };

  /**
   * Applies rules to all uncategorised transactions
   */
  const handleApplyRules = async () => {
    setApplying(true);
    const result = await applyCategorisationRules();
    if (result.success) {
      router.refresh();
    }
    setApplying(false);
  };

  /**
   * Gets category name by ID
   */
  const getCategoryName = (catId: string) => {
    const category = categories.find((c) => c.id === catId);
    return category?.name || 'Unknown';
  };

  /**
   * Gets human-readable match type label
   */
  const getMatchTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contains: 'Contains',
      starts_with: 'Starts with',
      ends_with: 'Ends with',
      exact: 'Exact match',
    };
    return labels[type] || type;
  };

  /**
   * Gets human-readable field label
   */
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
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-[800px] p-0 sm:p-6 gap-0">
        {/* Header - Sticky */}
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-0 sm:pt-0 border-b sm:border-0 flex-shrink-0">
          <DialogTitle className="text-lg">Auto-Categorisation Rules</DialogTitle>
          <DialogDescription className="text-sm">
            Set up rules to automatically categorise imported transactions.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <DialogBody className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 space-y-4">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-11 sm:h-9"
            >
              {showAddForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleApplyRules}
              disabled={applying}
              className="h-11 sm:h-9"
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
              <div className="space-y-4">
                {/* Mobile: Stack vertically, Desktop: 2 columns */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">When</Label>
                    <Select value={matchField} onValueChange={(v) => setMatchField(v as typeof matchField)}>
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="payee">Payee</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Match Type</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
                      <SelectTrigger className="h-11 sm:h-10">
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Match Value</Label>
                  <Input
                    value={matchValue}
                    onChange={(e) => setMatchValue(e.target.value)}
                    placeholder="e.g., WOOLWORTHS, COLES, UBER"
                    className="h-11 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assign Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-11 sm:h-10">
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

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddRule}
                    disabled={saving || !categoryId || !matchValue.trim()}
                    className="h-10"
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="text-base font-medium">No categorisation rules yet.</p>
              <p className="text-sm mt-1">Add a rule to automatically categorise transactions.</p>
            </div>
          ) : (
            <>
              {/*
                Mobile Rules - Card Layout
                - Expandable cards with all rule details
                - Touch-friendly switch and delete
              */}
              <div className="sm:hidden space-y-3">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    categoryName={getCategoryName(rule.category_id)}
                    fieldLabel={getFieldLabel(rule.match_field)}
                    matchTypeLabel={getMatchTypeLabel(rule.match_type)}
                    onToggle={() => handleToggleActive(rule)}
                    onDelete={() => handleDelete(rule.id)}
                  />
                ))}
              </div>

              {/*
                Desktop Rules - Table Layout
                - Compact table with inline controls
              */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">Active</TableHead>
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
                        <TableCell className="text-muted-foreground text-sm">
                          {getMatchTypeLabel(rule.match_type)}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[150px] truncate">
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
            </>
          )}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="px-4 py-4 sm:px-0 sm:pt-0 border-t sm:border-0 bg-background flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 sm:h-10 w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * RuleCard Component - Mobile rule display card
 */
interface RuleCardProps {
  rule: CategorisationRule;
  categoryName: string;
  fieldLabel: string;
  matchTypeLabel: string;
  onToggle: () => void;
  onDelete: () => void;
}

function RuleCard({
  rule,
  categoryName,
  fieldLabel,
  matchTypeLabel,
  onToggle,
  onDelete,
}: RuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border transition-colors ${rule.is_active ? 'bg-card' : 'bg-muted/30'}`}>
      {/* Main row - always visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Switch
            checked={rule.is_active}
            onCheckedChange={() => onToggle()}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{rule.match_value}</p>
            <p className="text-xs text-muted-foreground">
              {fieldLabel} {matchTypeLabel.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {categoryName}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t">
          <div className="pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Match Field:</span>
              <span>{fieldLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Match Type:</span>
              <span>{matchTypeLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Match Value:</span>
              <span className="font-mono truncate max-w-[60%] text-right">{rule.match_value}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span>{categoryName}</span>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-9"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
