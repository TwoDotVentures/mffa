/**
 * @fileoverview Trust Setup Dialog Component
 * @description Initial setup interface for creating a new family trust
 * with default or custom configuration options.
 *
 * @features
 * - Quick setup with default Moyle Family Trust configuration
 * - Custom trust details form for personalized setup
 * - Automatic beneficiary creation (Grant & Shannon Moyle)
 * - Two-step flow: info screen then custom form
 * - Mobile-optimized card layout with touch-friendly inputs
 * - Loading state during setup
 *
 * @mobile Full-width card with stacked form fields
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users, Loader2, ArrowLeft } from 'lucide-react';
import { createTrust, addBeneficiary } from '@/lib/trust/actions';

/**
 * Trust Setup Dialog Component
 *
 * Provides options for setting up a new family trust with
 * either default configuration or custom details.
 *
 * @returns Rendered trust setup interface
 */
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

  /**
   * Sets up trust with default configuration
   */
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

  /**
   * Handles custom trust creation form submission
   *
   * @param e - Form event
   */
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

  // Info step - shows default config and quick setup option
  if (step === 'info') {
    return (
      <Card className="max-w-2xl">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            Set Up Family Trust
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure your family trust to start tracking income and distributions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Default Configuration Info */}
          <div className="space-y-3 rounded-lg border p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium sm:text-base">Default Configuration</span>
            </div>
            <ul className="text-muted-foreground ml-6 list-disc space-y-1 text-xs sm:text-sm">
              <li>Trust Name: Moyle Family Trust</li>
              <li>Trustee: Moyle Australia Pty Ltd</li>
              <li>Primary Beneficiaries: Grant Moyle, Shannon Moyle</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              onClick={handleSetupDefault}
              disabled={isLoading}
              className="h-11 w-full text-sm sm:h-10 sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Setting up...' : 'Use Default Setup'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('form')}
              className="h-11 w-full text-sm sm:h-10 sm:w-auto"
            >
              Customise
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form step - custom trust details
  return (
    <Card className="max-w-2xl">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Trust Details</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter your trust details. You can update these later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trust Name & ABN */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Trust Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 text-sm sm:h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abn" className="text-xs sm:text-sm">
                Trust ABN (optional)
              </Label>
              <Input
                id="abn"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="XX XXX XXX XXX"
                className="h-10 text-sm sm:h-9"
              />
            </div>
          </div>

          {/* Trustee Name & ABN */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="trusteeName" className="text-xs sm:text-sm">
                Trustee Name
              </Label>
              <Input
                id="trusteeName"
                value={trusteeName}
                onChange={(e) => setTrusteeName(e.target.value)}
                required
                className="h-10 text-sm sm:h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trusteeAbn" className="text-xs sm:text-sm">
                Trustee ABN (optional)
              </Label>
              <Input
                id="trusteeAbn"
                value={trusteeAbn}
                onChange={(e) => setTrusteeAbn(e.target.value)}
                placeholder="XX XXX XXX XXX"
                className="h-10 text-sm sm:h-9"
              />
            </div>
          </div>

          {/* Establishment Date */}
          <div className="space-y-1.5">
            <Label htmlFor="establishmentDate" className="text-xs sm:text-sm">
              Establishment Date (optional)
            </Label>
            <Input
              id="establishmentDate"
              type="date"
              value={establishmentDate}
              onChange={(e) => setEstablishmentDate(e.target.value)}
              className="h-10 w-full text-sm sm:h-9 sm:w-48"
            />
          </div>

          {/* Error Display */}
          {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full text-sm sm:h-10 sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Trust'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('info')}
              className="h-11 w-full text-sm sm:h-10 sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
