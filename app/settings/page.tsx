/**
 * @fileoverview Settings Page
 *
 * Central hub for configuring app preferences, connections, and profiles.
 * Optimized for mobile with touch-friendly controls and clear groupings.
 *
 * @module app/settings/page
 */

import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Database,
  User,
  Building2,
  ChevronRight,
  Zap,
  Shield,
  Bell,
  Palette,
} from 'lucide-react';
import { getXeroConnections } from '@/lib/xero/actions';

/**
 * SettingsPage Component
 *
 * @description Main settings page with organized sections for:
 * - Bank/external connections
 * - AI configuration
 * - Database status
 * - Family member profiles
 *
 * @returns {Promise<JSX.Element>} The settings page
 */
export default async function SettingsPage() {
  /** Fetch existing Xero connections to show status */
  const { connections: xeroConnections } = await getXeroConnections();
  const hasXeroConnection = xeroConnections.length > 0;
  const activeConnection = xeroConnections.find((c) => c.status === 'active');

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your app preferences"
      />

      <main className="flex-1 p-3 md:p-4 lg:p-6">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
          {/*
            Connections Section
            @description External service connections (Xero, banks, etc.)
          */}
          <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Bank Connections
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Connect your bank accounts for automatic transaction sync
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Link href="/settings/bank-connections" className="block">
                <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 active:bg-muted/70">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0">
                      <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">
                        {hasXeroConnection ? 'Xero Connected' : 'Connect to Xero'}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {activeConnection
                          ? `Syncing from ${activeConnection.tenant_name}`
                          : 'Sync transactions automatically from Xero'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {hasXeroConnection && (
                      <Badge
                        variant={activeConnection ? 'default' : 'secondary'}
                        className={
                          activeConnection
                            ? 'bg-green-600 hover:bg-green-600 text-[10px] md:text-xs px-2'
                            : 'text-[10px] md:text-xs px-2'
                        }
                      >
                        {activeConnection ? 'Active' : 'Disconnected'}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/*
            AI Configuration Section
            @description Configure AI model and parameters
          */}
          <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                AI Configuration
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Configure your AI model provider for the AI Accountant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Provider Select */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Provider</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a provider...
                  </option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="groq">Groq (Llama)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              {/* Model Select */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Model</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <option>Select a provider first</option>
                </select>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  disabled
                  className="h-10 md:h-11"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Temperature</label>
                <div className="space-y-1.5">
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                    disabled
                    className="h-2 cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

              {/* Test Button */}
              <Button
                disabled
                className="w-full md:w-auto mt-2"
                variant="outline"
              >
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/*
            Database Status Section
            @description Show Supabase connection status
          */}
          <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-md">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Database
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Supabase connection status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base">Connection Status</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      Add your Supabase credentials to .env.local
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] md:text-xs">
                  Not Connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/*
            Family Members Section
            @description Manage family member profiles
          */}
          <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base md:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Family Members
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Manage family member profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Family Member Row */}
                <FamilyMemberRow name="Grant Moyle" type="Adult" />
                <FamilyMemberRow name="Shannon Moyle" type="Adult" />
                <FamilyMemberRow name="3 Children" type="Dependents" isOutline />
              </div>
            </CardContent>
          </Card>

          {/*
            Additional Settings - Future
            @description Placeholder for additional settings sections
          */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* Notifications */}
            <Card className="overflow-hidden border-0 shadow-sm md:border">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <Bell className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="text-xs md:text-sm font-medium">Notifications</p>
                  <Badge variant="outline" className="text-[10px]">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="overflow-hidden border-0 shadow-sm md:border">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xs md:text-sm font-medium">Appearance</p>
                  <Badge variant="outline" className="text-[10px]">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * FamilyMemberRow Component
 *
 * @description Displays a family member with their role/type badge
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Family member name
 * @param {string} props.type - Member type (Adult, Dependents, etc.)
 * @param {boolean} [props.isOutline] - Use outline badge variant
 * @returns {JSX.Element} Family member row
 */
function FamilyMemberRow({
  name,
  type,
  isOutline = false,
}: {
  name: string;
  type: string;
  isOutline?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
          <User className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </div>
        <span className="text-sm md:text-base font-medium">{name}</span>
      </div>
      <Badge
        variant={isOutline ? 'outline' : 'default'}
        className={`text-[10px] md:text-xs ${
          isOutline ? '' : 'bg-amber-600 hover:bg-amber-600'
        }`}
      >
        {type}
      </Badge>
    </div>
  );
}
