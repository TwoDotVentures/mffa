/**
 * @fileoverview Super Contribution Dialog Component
 * @description Modal dialog for adding super contribution entries with
 * type selection, fund details, and concessional tracking.
 *
 * @features
 * - Contribution type selection (employer SG, salary sacrifice, etc.)
 * - Fund name and ABN input
 * - Employer name for SG/salary sacrifice
 * - Amount with concessional toggle
 * - Cap warning display
 * - Mobile-optimized form layout
 *
 * @mobile Full-width dialog with stacked form fields, touch-friendly inputs
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { addSuperContribution } from '@/lib/super/actions';
import type { SuperContributionType, PersonType } from '@/lib/types';
import { SUPER_CONTRIBUTION_TYPE_LABELS } from '@/lib/types';

/** Props interface for SuperDialog component */
interface SuperDialogProps {
  /** Person to add super contribution for (cannot be joint) */
  person: Exclude<PersonType, 'joint'>;
  /** Whether dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
}

/** Contribution types that are automatically concessional (pre-tax) */
const CONCESSIONAL_TYPES: SuperContributionType[] = [
  'employer_sg',
  'salary_sacrifice',
  'personal_deductible',
];

/**
 * Super Contribution Dialog Component
 *
 * Provides a comprehensive form for recording super contributions
 * with automatic concessional status based on contribution type
 * and cap warning display.
 *
 * @param props - Component props
 * @returns Rendered super contribution dialog
 */
export function SuperDialog({ person, open, onOpenChange }: SuperDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [fundName, setFundName] = useState('');
  const [fundAbn, setFundAbn] = useState('');
  const [contributionType, setContributionType] = useState<SuperContributionType>('employer_sg');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employerName, setEmployerName] = useState('');
  const [isConcessional, setIsConcessional] = useState(true);
  const [notes, setNotes] = useState('');

  /**
   * Handles contribution type change and auto-sets concessional status
   * @param type - Selected contribution type
   */
  const handleTypeChange = (type: SuperContributionType) => {
    setContributionType(type);
    setIsConcessional(CONCESSIONAL_TYPES.includes(type));
  };

  /**
   * Handles form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarnings([]);
    setIsLoading(true);

    try {
      const result = await addSuperContribution({
        person,
        fund_name: fundName,
        fund_abn: fundAbn || undefined,
        contribution_type: contributionType,
        amount: Number(amount),
        date,
        is_concessional: isConcessional,
        employer_name: employerName || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || 'Failed to add contribution');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /** Resets form to initial state */
  const resetForm = () => {
    setFundName('');
    setFundAbn('');
    setContributionType('employer_sg');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setEmployerName('');
    setIsConcessional(true);
    setNotes('');
    setError(null);
    setWarnings([]);
  };

  const personName = person === 'grant' ? 'Grant' : 'Shannon';
  const showEmployerField =
    contributionType === 'employer_sg' || contributionType === 'salary_sacrifice';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Add Super Contribution for {personName}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record employer SG, salary sacrifice, or personal super contributions.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Contribution Type & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contributionType" className="text-xs sm:text-sm">
                  Contribution Type
                </Label>
                <Select value={contributionType} onValueChange={handleTypeChange}>
                  <SelectTrigger id="contributionType" className="h-10 text-sm sm:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPER_CONTRIBUTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs sm:text-sm">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-10 text-sm sm:h-9"
                />
              </div>
            </div>

            {/* Fund Name & ABN */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fundName" className="text-xs sm:text-sm">
                  Fund Name
                </Label>
                <Input
                  id="fundName"
                  placeholder="e.g., Australian Super"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  required
                  className="h-10 text-sm sm:h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fundAbn" className="text-xs sm:text-sm">
                  Fund ABN (optional)
                </Label>
                <Input
                  id="fundAbn"
                  placeholder="XX XXX XXX XXX"
                  value={fundAbn}
                  onChange={(e) => setFundAbn(e.target.value)}
                  className="h-10 text-sm sm:h-9"
                />
              </div>
            </div>

            {/* Employer Name (conditional) */}
            {showEmployerField && (
              <div className="space-y-1.5">
                <Label htmlFor="employerName" className="text-xs sm:text-sm">
                  Employer Name
                </Label>
                <Input
                  id="employerName"
                  placeholder="e.g., Company Pty Ltd"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="h-10 text-sm sm:h-9"
                />
              </div>
            )}

            {/* Amount & Concessional Toggle */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs sm:text-sm">
                  Amount ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-10 text-sm sm:h-9"
                />
              </div>

              <div className="flex items-center space-x-2 pt-0 sm:pt-6">
                <Switch
                  id="isConcessional"
                  checked={isConcessional}
                  onCheckedChange={setIsConcessional}
                />
                <Label htmlFor="isConcessional" className="text-xs sm:text-sm">
                  Concessional (pre-tax)
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs sm:text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Cap Warnings Display */}
            {warnings.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4 text-xs sm:text-sm">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11 sm:min-h-10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-h-11 sm:min-h-10">
              {isLoading ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
