'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users } from 'lucide-react';
import { createTrust, addBeneficiary } from '@/lib/trust/actions';

export function TrustSetupDialog() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'form'>('info');

  const [name, setName] = useState('Moyle Family Trust');
  const [abn, setAbn] = useState('');
  const [trusteeName, setTrusteeName] = useState('Moyle Australia Pty Ltd');
  const [trusteeAbn, setTrusteeAbn] = useState('');
  const [establishmentDate, setEstablishmentDate] = useState('');

  const handleSetupDefault = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create the trust
      const result = await createTrust({
        name: 'Moyle Family Trust',
        abn: '',
        trustee_name: 'Moyle Australia Pty Ltd',
        trustee_abn: '',
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create trust');
        return;
      }

      // Add default beneficiaries
      await addBeneficiary(result.data.id, {
        name: 'Grant Moyle',
        beneficiary_type: 'primary',
      });

      await addBeneficiary(result.data.id, {
        name: 'Shannon Moyle',
        beneficiary_type: 'primary',
      });

      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createTrust({
        name,
        abn: abn || undefined,
        trustee_name: trusteeName,
        trustee_abn: trusteeAbn || undefined,
        establishment_date: establishmentDate || undefined,
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create trust');
        return;
      }

      // Add default beneficiaries
      await addBeneficiary(result.data.id, {
        name: 'Grant Moyle',
        beneficiary_type: 'primary',
      });

      await addBeneficiary(result.data.id, {
        name: 'Shannon Moyle',
        beneficiary_type: 'primary',
      });

      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'info') {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Set Up Family Trust
          </CardTitle>
          <CardDescription>
            Configure your family trust to start tracking income and distributions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Default Configuration</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>Trust Name: Moyle Family Trust</li>
              <li>Trustee: Moyle Australia Pty Ltd</li>
              <li>Primary Beneficiaries: Grant Moyle, Shannon Moyle</li>
            </ul>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button onClick={handleSetupDefault} disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Use Default Setup'}
            </Button>
            <Button variant="outline" onClick={() => setStep('form')}>
              Customise
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Trust Details</CardTitle>
        <CardDescription>
          Enter your trust details. You can update these later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Trust Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abn">Trust ABN (optional)</Label>
              <Input
                id="abn"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="XX XXX XXX XXX"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trusteeName">Trustee Name</Label>
              <Input
                id="trusteeName"
                value={trusteeName}
                onChange={(e) => setTrusteeName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trusteeAbn">Trustee ABN (optional)</Label>
              <Input
                id="trusteeAbn"
                value={trusteeAbn}
                onChange={(e) => setTrusteeAbn(e.target.value)}
                placeholder="XX XXX XXX XXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="establishmentDate">Establishment Date (optional)</Label>
            <Input
              id="establishmentDate"
              type="date"
              value={establishmentDate}
              onChange={(e) => setEstablishmentDate(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Trust'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('info')}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
