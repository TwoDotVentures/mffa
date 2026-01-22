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

interface SuperDialogProps {
  person: Exclude<PersonType, 'joint'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Types that are automatically concessional
const CONCESSIONAL_TYPES: SuperContributionType[] = [
  'employer_sg',
  'salary_sacrifice',
  'personal_deductible',
];

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

  // Auto-set concessional based on type
  const handleTypeChange = (type: SuperContributionType) => {
    setContributionType(type);
    setIsConcessional(CONCESSIONAL_TYPES.includes(type));
  };

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
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
  const showEmployerField = contributionType === 'employer_sg' || contributionType === 'salary_sacrifice';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Super Contribution for {personName}</DialogTitle>
          <DialogDescription>
            Record employer SG, salary sacrifice, or personal super contributions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contributionType">Contribution Type</Label>
              <Select value={contributionType} onValueChange={handleTypeChange}>
                <SelectTrigger id="contributionType">
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

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fundName">Fund Name</Label>
              <Input
                id="fundName"
                placeholder="e.g., Australian Super"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundAbn">Fund ABN (optional)</Label>
              <Input
                id="fundAbn"
                placeholder="XX XXX XXX XXX"
                value={fundAbn}
                onChange={(e) => setFundAbn(e.target.value)}
              />
            </div>
          </div>

          {showEmployerField && (
            <div className="space-y-2">
              <Label htmlFor="employerName">Employer Name</Label>
              <Input
                id="employerName"
                placeholder="e.g., Company Pty Ltd"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isConcessional"
                checked={isConcessional}
                onCheckedChange={setIsConcessional}
              />
              <Label htmlFor="isConcessional">Concessional (pre-tax)</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
