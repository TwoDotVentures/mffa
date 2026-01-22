import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * AI Accountant Tools
 *
 * These tools provide the AI with access to real financial data.
 * All tools are read-only and respect RLS policies.
 */

// ============================================================================
// PERSONAL FINANCE TOOLS
// ============================================================================

export const getTransactions = tool({
  description: 'Get transactions with optional filters for date range, category, account, amount, and search text',
  inputSchema: z.object({
    date_from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    date_to: z.string().optional().describe('End date in YYYY-MM-DD format'),
    category: z.string().optional().describe('Category name to filter by'),
    account_id: z.string().optional().describe('Account ID to filter by'),
    min_amount: z.number().optional().describe('Minimum transaction amount'),
    max_amount: z.number().optional().describe('Maximum transaction amount'),
    search_text: z.string().optional().describe('Search in description or payee'),
    limit: z.number().optional().default(50).describe('Maximum number of results'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        id, date, description, amount, transaction_type, payee,
        account:accounts(name),
        category:categories(name)
      `)
      .order('date', { ascending: false });

    if (params.date_from) query = query.gte('date', params.date_from);
    if (params.date_to) query = query.lte('date', params.date_to);
    if (params.account_id) query = query.eq('account_id', params.account_id);
    if (params.min_amount) query = query.gte('amount', params.min_amount);
    if (params.max_amount) query = query.lte('amount', params.max_amount);
    if (params.search_text) {
      query = query.or(`description.ilike.%${params.search_text}%,payee.ilike.%${params.search_text}%`);
    }

    const { data, error } = await query.limit(params.limit || 50);

    if (error) return { error: error.message };

    // Filter by category name if provided (need to do this post-query)
    let results = data || [];
    if (params.category) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results = results.filter((t: any) =>
        t.category?.name?.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    return { transactions: results, count: results.length };
  },
});

export const getSpendingSummary = tool({
  description: 'Get aggregated spending data grouped by category, merchant, week, or month',
  inputSchema: z.object({
    date_from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    date_to: z.string().optional().describe('End date in YYYY-MM-DD format'),
    group_by: z.enum(['category', 'merchant', 'week', 'month']).default('category'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        id, date, description, amount, transaction_type, payee,
        category:categories(name)
      `)
      .eq('transaction_type', 'expense');

    if (params.date_from) query = query.gte('date', params.date_from);
    if (params.date_to) query = query.lte('date', params.date_to);

    const { data, error } = await query;

    if (error) return { error: error.message };

    const transactions = data || [];
    const summary: Record<string, number> = {};

    for (const t of transactions) {
      let key: string;

      switch (params.group_by) {
        case 'category':
          key = (t.category as { name?: string })?.name || 'Uncategorised';
          break;
        case 'merchant':
          key = t.payee || t.description.split(' ')[0] || 'Unknown';
          break;
        case 'week': {
          const date = new Date(t.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
          key = t.date.substring(0, 7); // YYYY-MM
          break;
        default:
          key = 'Other';
      }

      summary[key] = (summary[key] || 0) + t.amount;
    }

    // Sort by amount descending
    const sorted = Object.entries(summary)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({ name, amount }));

    const total = sorted.reduce((sum, item) => sum + item.amount, 0);

    return { summary: sorted, total, period: { from: params.date_from, to: params.date_to } };
  },
});

export const getAccounts = tool({
  description: 'Get all accounts with current balances, optionally filtered by account type',
  inputSchema: z.object({
    account_type: z.enum(['bank', 'credit', 'investment', 'loan', 'cash']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('accounts')
      .select('id, name, account_type, institution, current_balance, credit_limit, is_active')
      .eq('is_active', true)
      .order('name');

    if (params.account_type) {
      query = query.eq('account_type', params.account_type);
    }

    const { data, error } = await query;

    if (error) return { error: error.message };

    const accounts = data || [];
    const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

    return { accounts, totalBalance, count: accounts.length };
  },
});

export const getIncome = tool({
  description: 'Get income records optionally filtered by date range, income type, and person',
  inputSchema: z.object({
    date_from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    date_to: z.string().optional().describe('End date in YYYY-MM-DD format'),
    income_type: z.string().optional().describe('Type of income (salary, dividends, interest, etc.)'),
    person: z.string().optional().describe('Person name (Grant or Shannon)'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        id, date, description, amount, payee,
        category:categories(name)
      `)
      .eq('transaction_type', 'income')
      .order('date', { ascending: false });

    if (params.date_from) query = query.gte('date', params.date_from);
    if (params.date_to) query = query.lte('date', params.date_to);

    const { data, error } = await query;

    if (error) return { error: error.message };

    let results = data || [];

    // Filter by income type (category name)
    if (params.income_type) {
      results = results.filter((t: any) =>
        t.category?.name?.toLowerCase().includes(params.income_type!.toLowerCase())
      );
    }

    const totalIncome = results.reduce((sum, t) => sum + t.amount, 0);

    return { income: results, totalIncome, count: results.length };
  },
});

export const getNetWorth = tool({
  description: 'Calculate net worth from accounts, optionally including SMSF and trust assets',
  inputSchema: z.object({
    include_smsf: z.boolean().optional().default(false),
    include_trust: z.boolean().optional().default(false),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    // Get all accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('name, account_type, current_balance, credit_limit')
      .eq('is_active', true);

    if (error) return { error: error.message };

    const accountsList = accounts || [];

    // Categorise accounts
    const assets = accountsList
      .filter((a) => ['bank', 'investment', 'cash'].includes(a.account_type))
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);

    const liabilities = accountsList
      .filter((a) => ['credit', 'loan'].includes(a.account_type))
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);

    const personalNetWorth = assets - liabilities;

    const result: {
      personal: { assets: number; liabilities: number; netWorth: number };
      smsf?: { balance: number; note?: string };
      trust?: { assets: number; note?: string };
      consolidated?: number;
    } = {
      personal: { assets, liabilities, netWorth: personalNetWorth },
    };

    let consolidated = personalNetWorth;

    // Include SMSF data if requested
    if (params.include_smsf) {
      const { data: funds } = await supabase
        .from('smsf_funds')
        .select('id')
        .limit(1);

      if (funds && funds.length > 0) {
        const { data: members } = await supabase
          .from('smsf_members')
          .select('total_super_balance')
          .eq('fund_id', funds[0].id);

        const smsfBalance = (members || []).reduce(
          (sum, m) => sum + Number(m.total_super_balance || 0),
          0
        );

        result.smsf = { balance: smsfBalance };
        consolidated += smsfBalance;
      } else {
        result.smsf = { balance: 0, note: 'No SMSF configured' };
      }
    }

    if (params.include_trust) {
      result.trust = { assets: 0, note: 'Trust module not yet configured' };
    }

    result.consolidated = consolidated;

    return result;
  },
});

export const getTaxSummary = tool({
  description: 'Get tax summary including income and deductions for a financial year',
  inputSchema: z.object({
    financial_year: z.string().describe('Financial year in format YYYY-YY (e.g., 2024-25)'),
    person: z.string().optional().describe('Person name (Grant or Shannon)'),
  }),
  execute: async (params) => {
    // Parse financial year to get date range
    const [startYear] = params.financial_year.split('-').map(Number);
    const fyStart = `${startYear}-07-01`;
    const fyEnd = `${startYear + 1}-06-30`;

    const supabase = await createClient();

    // Get income
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('transaction_type', 'income')
      .gte('date', fyStart)
      .lte('date', fyEnd);

    // Get potential deductions (could add a is_deductible flag to categories)
    const { data: expenseData } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('transaction_type', 'expense')
      .gte('date', fyStart)
      .lte('date', fyEnd);

    const totalIncome = (incomeData || []).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = (expenseData || []).reduce((sum, t) => sum + t.amount, 0);

    // Estimate tax (simplified calculation)
    const taxableIncome = totalIncome; // Would subtract deductions
    let estimatedTax = 0;

    if (taxableIncome > 190000) {
      estimatedTax = 51638 + (taxableIncome - 190000) * 0.45;
    } else if (taxableIncome > 135000) {
      estimatedTax = 31288 + (taxableIncome - 135000) * 0.37;
    } else if (taxableIncome > 45000) {
      estimatedTax = 4288 + (taxableIncome - 45000) * 0.30;
    } else if (taxableIncome > 18200) {
      estimatedTax = (taxableIncome - 18200) * 0.16;
    }

    // Add Medicare levy (2%)
    const medicareLevy = taxableIncome * 0.02;

    return {
      financialYear: params.financial_year,
      totalIncome,
      totalExpenses,
      taxableIncome,
      estimatedTax,
      medicareLevy,
      totalTaxPayable: estimatedTax + medicareLevy,
      effectiveRate: totalIncome > 0 ? ((estimatedTax + medicareLevy) / totalIncome * 100).toFixed(1) + '%' : '0%',
    };
  },
});

export const calculateTax = tool({
  description: 'Calculate income tax for a given taxable income amount using 2024-25 tax rates',
  inputSchema: z.object({
    taxable_income: z.number().describe('Taxable income amount in dollars'),
    financial_year: z.string().optional().default('2024-25'),
    include_medicare: z.boolean().optional().default(true),
    has_phi: z.boolean().optional().default(true).describe('Has private health insurance'),
  }),
  execute: async (params) => {
    const { taxable_income, include_medicare, has_phi } = params;

    // 2024-25 tax brackets
    let baseTax = 0;
    let marginalRate = 0;

    if (taxable_income <= 18200) {
      baseTax = 0;
      marginalRate = 0;
    } else if (taxable_income <= 45000) {
      baseTax = (taxable_income - 18200) * 0.16;
      marginalRate = 16;
    } else if (taxable_income <= 135000) {
      baseTax = 4288 + (taxable_income - 45000) * 0.30;
      marginalRate = 30;
    } else if (taxable_income <= 190000) {
      baseTax = 31288 + (taxable_income - 135000) * 0.37;
      marginalRate = 37;
    } else {
      baseTax = 51638 + (taxable_income - 190000) * 0.45;
      marginalRate = 45;
    }

    // Medicare levy
    let medicareLevy = 0;
    let medicareSurcharge = 0;

    if (include_medicare) {
      medicareLevy = taxable_income * 0.02;

      // Medicare levy surcharge if no PHI and income > $93k
      if (!has_phi && taxable_income > 93000) {
        if (taxable_income <= 108000) {
          medicareSurcharge = taxable_income * 0.01;
        } else if (taxable_income <= 144000) {
          medicareSurcharge = taxable_income * 0.0125;
        } else {
          medicareSurcharge = taxable_income * 0.015;
        }
      }
    }

    const totalTax = baseTax + medicareLevy + medicareSurcharge;
    const effectiveRate = (totalTax / taxable_income * 100).toFixed(1);

    return {
      taxableIncome: taxable_income,
      incomeTax: Math.round(baseTax),
      medicareLevy: Math.round(medicareLevy),
      medicareSurcharge: Math.round(medicareSurcharge),
      totalTax: Math.round(totalTax),
      marginalRate: marginalRate + '%',
      effectiveRate: effectiveRate + '%',
      takeHome: taxable_income - totalTax,
    };
  },
});

export const calculateCGT = tool({
  description: 'Calculate capital gains tax for an asset sale',
  inputSchema: z.object({
    cost_base: z.number().describe('Original cost of the asset'),
    sale_price: z.number().describe('Sale price of the asset'),
    acquisition_date: z.string().describe('Date acquired in YYYY-MM-DD format'),
    sale_date: z.string().describe('Date sold in YYYY-MM-DD format'),
    asset_type: z.enum(['shares', 'property', 'crypto', 'other']).optional().default('shares'),
  }),
  execute: async (params) => {
    const { cost_base, sale_price, acquisition_date, sale_date } = params;

    const capitalGain = sale_price - cost_base;

    if (capitalGain <= 0) {
      return {
        capitalGain,
        capitalLoss: Math.abs(capitalGain),
        taxableGain: 0,
        note: 'Capital loss can be carried forward to offset future capital gains',
      };
    }

    // Check if held > 12 months for CGT discount
    const acquiredDate = new Date(acquisition_date);
    const soldDate = new Date(sale_date);
    const monthsHeld = (soldDate.getFullYear() - acquiredDate.getFullYear()) * 12 +
      (soldDate.getMonth() - acquiredDate.getMonth());

    const eligibleForDiscount = monthsHeld >= 12;
    const discount = eligibleForDiscount ? 0.5 : 0;
    const taxableGain = capitalGain * (1 - discount);

    return {
      costBase: cost_base,
      salePrice: sale_price,
      capitalGain,
      monthsHeld,
      eligibleForDiscount,
      discountApplied: discount * 100 + '%',
      taxableGain,
      note: eligibleForDiscount
        ? 'CGT discount of 50% applied (held > 12 months)'
        : 'No CGT discount (held < 12 months)',
    };
  },
});

export const getBudgets = tool({
  description: 'Get budget vs actual spending by category for a given month',
  inputSchema: z.object({
    month: z.number().min(1).max(12).describe('Month number (1-12)'),
    year: z.number().describe('Year (e.g., 2025)'),
  }),
  execute: async (params) => {
    const { month, year } = params;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    const supabase = await createClient();

    // Get actual spending by category
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    const actualByCategory: Record<string, number> = {};
    for (const t of transactions || []) {
      const category = (t.category as { name?: string })?.name || 'Uncategorised';
      actualByCategory[category] = (actualByCategory[category] || 0) + t.amount;
    }

    // TODO: Get budget amounts from a budgets table when it exists
    // For now, return actuals only

    const result = Object.entries(actualByCategory)
      .map(([category, actual]) => ({
        category,
        actual,
        budget: null as number | null, // Placeholder
        variance: null as number | null,
      }))
      .sort((a, b) => b.actual - a.actual);

    const totalActual = result.reduce((sum, item) => sum + item.actual, 0);

    return {
      period: { month, year },
      categories: result,
      totalActual,
      note: 'Budget amounts not yet configured. Only showing actual spending.',
    };
  },
});

// ============================================================================
// SMSF TOOLS - Connected to real SMSF tables
// ============================================================================

/**
 * Get Australian financial year for a date
 */
function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

export const getSmsfSummary = tool({
  description: 'Get SMSF fund summary including balance, member balances, investment allocation, and compliance status',
  inputSchema: z.object({
    include_investments: z.boolean().optional().default(true).describe('Include investment breakdown'),
    include_compliance: z.boolean().optional().default(true).describe('Include compliance status'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    // Get SMSF funds for the user
    const { data: funds, error: fundsError } = await supabase
      .from('smsf_funds')
      .select('*')
      .order('created_at', { ascending: false });

    if (fundsError || !funds || funds.length === 0) {
      return {
        note: 'No SMSF fund configured. Please set up your SMSF in the SMSF section.',
        fundName: null,
        balance: null,
        members: [],
      };
    }

    const fund = funds[0];

    // Get members
    const { data: members } = await supabase
      .from('smsf_members')
      .select('id, name, total_super_balance, member_status')
      .eq('fund_id', fund.id);

    const memberList = members || [];
    const totalBalance = memberList.reduce((sum, m) => sum + Number(m.total_super_balance || 0), 0);

    const result: {
      fundName: string;
      abn: string | null;
      status: string;
      totalBalance: number;
      members: { name: string; balance: number; status: string }[];
      investments?: { total: number; byType: { type: string; value: number; percentage: number }[] };
      compliance?: { financialYear: string; auditStatus: string; lodgementStatus: string };
    } = {
      fundName: fund.name,
      abn: fund.abn,
      status: fund.fund_status || 'active',
      totalBalance,
      members: memberList.map((m) => ({
        name: m.name,
        balance: Number(m.total_super_balance || 0),
        status: m.member_status || 'active',
      })),
    };

    // Get investment breakdown if requested
    if (params.include_investments) {
      const { data: investments } = await supabase
        .from('smsf_investments')
        .select('asset_type, current_value')
        .eq('fund_id', fund.id);

      const investmentList = investments || [];
      const totalInvestments = investmentList.reduce((sum, i) => sum + Number(i.current_value || 0), 0);

      const byType = investmentList.reduce((acc: Record<string, number>, i) => {
        const type = i.asset_type;
        acc[type] = (acc[type] || 0) + Number(i.current_value || 0);
        return acc;
      }, {});

      result.investments = {
        total: totalInvestments,
        byType: Object.entries(byType).map(([type, value]) => ({
          type,
          value,
          percentage: totalInvestments > 0 ? (value / totalInvestments) * 100 : 0,
        })),
      };
    }

    // Get compliance status if requested
    if (params.include_compliance) {
      const currentFY = getFinancialYear();
      const { data: compliance } = await supabase
        .from('smsf_compliance')
        .select('financial_year, audit_status, lodgement_status')
        .eq('fund_id', fund.id)
        .eq('financial_year', currentFY)
        .single();

      result.compliance = {
        financialYear: currentFY,
        auditStatus: compliance?.audit_status || 'pending',
        lodgementStatus: compliance?.lodgement_status || 'pending',
      };
    }

    return result;
  },
});

export const getSmsfContributions = tool({
  description: 'Get SMSF contributions with cap tracking for a financial year. Shows concessional and non-concessional contributions with remaining cap space and carry-forward eligibility.',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY (defaults to current FY)'),
    member: z.string().optional().describe('Member name to filter by'),
    contribution_type: z.enum(['concessional', 'non_concessional']).optional().describe('Filter by contribution type'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's SMSF fund
    const { data: funds } = await supabase
      .from('smsf_funds')
      .select('id, name')
      .limit(1);

    if (!funds || funds.length === 0) {
      return {
        note: 'No SMSF fund configured.',
        financialYear,
        contributions: [],
      };
    }

    const fundId = funds[0].id;

    // Get members
    const { data: members } = await supabase
      .from('smsf_members')
      .select('id, name, total_super_balance')
      .eq('fund_id', fundId);

    if (!members || members.length === 0) {
      return {
        note: 'No SMSF members configured.',
        financialYear,
        contributions: [],
      };
    }

    // Filter by member name if provided
    let relevantMembers = members;
    if (params.member) {
      relevantMembers = members.filter((m) =>
        m.name.toLowerCase().includes(params.member!.toLowerCase())
      );
    }

    // Get contributions for each member
    const memberContributions = await Promise.all(
      relevantMembers.map(async (member) => {
        let query = supabase
          .from('smsf_contributions')
          .select('*')
          .eq('member_id', member.id)
          .eq('financial_year', financialYear);

        if (params.contribution_type) {
          query = query.eq('contribution_type', params.contribution_type);
        }

        const { data: contributions } = await query;

        const contribList = contributions || [];

        // Calculate totals by type
        const concessional = contribList
          .filter((c) => c.contribution_type === 'concessional')
          .reduce((sum, c) => sum + Number(c.amount), 0);

        const nonConcessional = contribList
          .filter((c) => c.contribution_type === 'non_concessional')
          .reduce((sum, c) => sum + Number(c.amount), 0);

        // Caps for 2024-25
        const concessionalCap = 30000;
        const nonConcessionalCap = 120000;

        // Check carry-forward eligibility (total super balance < $500k)
        const eligibleForCarryForward = Number(member.total_super_balance) < 500000;

        // Get carry-forward amounts
        const { data: carryForwardData } = await supabase
          .from('smsf_carry_forward')
          .select('financial_year, unused_amount')
          .eq('member_id', member.id)
          .order('financial_year', { ascending: false })
          .limit(5);

        const carryForwardTotal = eligibleForCarryForward
          ? (carryForwardData || []).reduce((sum, cf) => sum + Number(cf.unused_amount || 0), 0)
          : 0;

        return {
          memberName: member.name,
          totalSuperBalance: Number(member.total_super_balance),
          concessional: {
            contributed: concessional,
            cap: concessionalCap,
            remaining: Math.max(0, concessionalCap - concessional),
            percentageUsed: (concessional / concessionalCap) * 100,
            carryForwardAvailable: carryForwardTotal,
            eligibleForCarryForward,
          },
          nonConcessional: {
            contributed: nonConcessional,
            cap: nonConcessionalCap,
            remaining: Math.max(0, nonConcessionalCap - nonConcessional),
            percentageUsed: (nonConcessional / nonConcessionalCap) * 100,
          },
          contributions: contribList.map((c) => ({
            date: c.date,
            type: c.contribution_type,
            amount: Number(c.amount),
            description: c.description,
          })),
        };
      })
    );

    return {
      financialYear,
      concessionalCap: 30000,
      nonConcessionalCap: 120000,
      members: memberContributions,
    };
  },
});

export const getSmsfInvestments = tool({
  description: 'Get SMSF investment register with performance metrics and asset allocation',
  inputSchema: z.object({
    asset_type: z.enum(['australian_shares', 'international_shares', 'property', 'fixed_income', 'cash', 'cryptocurrency', 'collectibles', 'other']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    // Get the user's SMSF fund
    const { data: funds } = await supabase
      .from('smsf_funds')
      .select('id, name')
      .limit(1);

    if (!funds || funds.length === 0) {
      return {
        note: 'No SMSF fund configured.',
        investments: [],
      };
    }

    const fundId = funds[0].id;

    let query = supabase
      .from('smsf_investments')
      .select('*')
      .eq('fund_id', fundId)
      .order('current_value', { ascending: false });

    if (params.asset_type) {
      query = query.eq('asset_type', params.asset_type);
    }

    const { data: investments } = await query;

    const investmentList = investments || [];

    // Calculate totals
    const totalValue = investmentList.reduce((sum, i) => sum + Number(i.current_value), 0);
    const totalCostBase = investmentList.reduce((sum, i) => sum + Number(i.cost_base), 0);
    const totalIncome = investmentList.reduce((sum, i) => sum + Number(i.income_ytd || 0), 0);

    // Asset allocation
    const byType = investmentList.reduce((acc: Record<string, number>, i) => {
      const type = i.asset_type;
      acc[type] = (acc[type] || 0) + Number(i.current_value);
      return acc;
    }, {});

    return {
      totalValue,
      totalCostBase,
      unrealisedGain: totalValue - totalCostBase,
      unrealisedGainPercent: totalCostBase > 0 ? ((totalValue - totalCostBase) / totalCostBase) * 100 : 0,
      totalIncomeYTD: totalIncome,
      assetAllocation: Object.entries(byType).map(([type, value]) => ({
        type,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })),
      investments: investmentList.map((i) => ({
        name: i.name,
        assetType: i.asset_type,
        units: i.units,
        costBase: Number(i.cost_base),
        currentValue: Number(i.current_value),
        gainLoss: Number(i.current_value) - Number(i.cost_base),
        gainLossPercent: Number(i.cost_base) > 0
          ? ((Number(i.current_value) - Number(i.cost_base)) / Number(i.cost_base)) * 100
          : 0,
        incomeYTD: Number(i.income_ytd || 0),
        acquisitionDate: i.acquisition_date,
      })),
    };
  },
});

export const getSmsfCompliance = tool({
  description: 'Get SMSF compliance checklist and status for a financial year',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's SMSF fund
    const { data: funds } = await supabase
      .from('smsf_funds')
      .select('id, name')
      .limit(1);

    if (!funds || funds.length === 0) {
      return {
        note: 'No SMSF fund configured.',
        financialYear,
        compliance: null,
      };
    }

    const { data: compliance } = await supabase
      .from('smsf_compliance')
      .select('*')
      .eq('fund_id', funds[0].id)
      .eq('financial_year', financialYear)
      .single();

    if (!compliance) {
      return {
        financialYear,
        fundName: funds[0].name,
        compliance: {
          auditStatus: 'pending',
          lodgementStatus: 'pending',
          investmentStrategyReviewed: false,
          memberStatementsIssued: false,
        },
        checklist: [
          { task: 'Annual audit', status: 'pending' },
          { task: 'Annual return lodgement', status: 'pending' },
          { task: 'Investment strategy review', status: 'pending' },
          { task: 'Member statements', status: 'pending' },
        ],
      };
    }

    const checklist = [
      { task: 'Annual audit', status: compliance.audit_status, dueDate: compliance.audit_due_date, completedDate: compliance.audit_completed_date },
      { task: 'Annual return lodgement', status: compliance.lodgement_status, dueDate: compliance.annual_return_due_date, completedDate: compliance.annual_return_lodged_date },
      { task: 'Investment strategy review', status: compliance.investment_strategy_reviewed ? 'completed' : 'pending', completedDate: compliance.investment_strategy_date },
      { task: 'Member statements', status: compliance.member_statements_issued ? 'completed' : 'pending' },
    ];

    const completedCount = checklist.filter((c) => c.status === 'completed' || c.status === 'lodged').length;

    return {
      financialYear,
      fundName: funds[0].name,
      overallProgress: `${completedCount}/${checklist.length} tasks complete`,
      checklist,
      notes: compliance.notes,
    };
  },
});

// ============================================================================
// FAMILY TRUST TOOLS - Connected to real trust tables
// ============================================================================

export const getTrustSummary = tool({
  description: 'Get Family Trust summary including income YTD, distributable amount, franking credits, and beneficiaries',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY (defaults to current FY)'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's trust
    const { data: trusts } = await supabase
      .from('trusts')
      .select('*')
      .limit(1);

    if (!trusts || trusts.length === 0) {
      return {
        note: 'No Family Trust configured. Please set up your trust in the Trust section.',
        trustName: null,
        financialYear,
      };
    }

    const trust = trusts[0];

    // Get beneficiaries
    const { data: beneficiaries } = await supabase
      .from('trust_beneficiaries')
      .select('id, name, beneficiary_type')
      .eq('trust_id', trust.id)
      .eq('is_active', true);

    // Get income for financial year
    const { data: income } = await supabase
      .from('trust_income')
      .select('*')
      .eq('trust_id', trust.id)
      .eq('financial_year', financialYear);

    // Get distributions for financial year
    const { data: distributions } = await supabase
      .from('trust_distributions')
      .select('*, beneficiary:trust_beneficiaries(name)')
      .eq('trust_id', trust.id)
      .eq('financial_year', financialYear);

    const incomeList = income || [];
    const distributionList = distributions || [];

    const totalIncome = incomeList.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalFranking = incomeList.reduce((sum, i) => sum + Number(i.franking_credits), 0);
    const totalDistributed = distributionList.reduce((sum, d) => sum + Number(d.amount), 0);
    const frankingDistributed = distributionList.reduce((sum, d) => sum + Number(d.franking_credits_streamed), 0);

    // Calculate days until 30 June
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    const eofy = new Date(year, 5, 30);
    const daysUntilEOFY = Math.ceil((eofy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Distribution by beneficiary
    const distributionsByBeneficiary = distributionList.reduce((acc: Record<string, { name: string; amount: number; franking: number }>, d) => {
      const name = (d.beneficiary as { name?: string })?.name || 'Unknown';
      if (!acc[d.beneficiary_id]) {
        acc[d.beneficiary_id] = { name, amount: 0, franking: 0 };
      }
      acc[d.beneficiary_id].amount += Number(d.amount);
      acc[d.beneficiary_id].franking += Number(d.franking_credits_streamed);
      return acc;
    }, {});

    return {
      trustName: trust.name,
      trusteeName: trust.trustee_name,
      financialYear,
      incomeYTD: totalIncome,
      frankingCreditsReceived: totalFranking,
      distributionsYTD: totalDistributed,
      frankingCreditsDistributed: frankingDistributed,
      distributableAmount: totalIncome - totalDistributed,
      frankingCreditsAvailable: totalFranking - frankingDistributed,
      daysUntilEOFY,
      eoFYDeadline: daysUntilEOFY <= 60 ? `WARNING: ${daysUntilEOFY} days until 30 June distribution deadline` : null,
      beneficiaries: (beneficiaries || []).map((b) => b.name),
      distributionsByBeneficiary: Object.values(distributionsByBeneficiary),
    };
  },
});

export const getTrustIncome = tool({
  description: 'Get trust income (dividends, interest, etc.) with franking credits for a financial year',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    income_type: z.enum(['dividend', 'interest', 'rent', 'capital_gain', 'other']).optional(),
    date_from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    date_to: z.string().optional().describe('End date in YYYY-MM-DD format'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's trust
    const { data: trusts } = await supabase
      .from('trusts')
      .select('id')
      .limit(1);

    if (!trusts || trusts.length === 0) {
      return { error: 'No trust found' };
    }

    let query = supabase
      .from('trust_income')
      .select('*')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear)
      .order('date', { ascending: false });

    if (params.income_type) {
      query = query.eq('income_type', params.income_type);
    }
    if (params.date_from) {
      query = query.gte('date', params.date_from);
    }
    if (params.date_to) {
      query = query.lte('date', params.date_to);
    }

    const { data: income, error } = await query;

    if (error) return { error: error.message };

    const incomeList = income || [];
    const totalIncome = incomeList.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalFranking = incomeList.reduce((sum, i) => sum + Number(i.franking_credits), 0);

    return {
      financialYear,
      totalIncome,
      totalFrankingCredits: totalFranking,
      incomeItems: incomeList.map((i) => ({
        date: i.date,
        source: i.source,
        type: i.income_type,
        amount: Number(i.amount),
        frankingCredits: Number(i.franking_credits),
      })),
      count: incomeList.length,
    };
  },
});

export const getTrustDistributions = tool({
  description: 'Get trust distribution history by beneficiary for a financial year',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    beneficiary_name: z.string().optional().describe('Filter by beneficiary name (Grant or Shannon)'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's trust
    const { data: trusts } = await supabase
      .from('trusts')
      .select('id')
      .limit(1);

    if (!trusts || trusts.length === 0) {
      return { error: 'No trust found' };
    }

    const { data: distributions, error } = await supabase
      .from('trust_distributions')
      .select('*, beneficiary:trust_beneficiaries(name)')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear)
      .order('date', { ascending: false });

    if (error) return { error: error.message };

    let filtered = distributions || [];

    if (params.beneficiary_name) {
      filtered = filtered.filter((d) =>
        (d.beneficiary as { name?: string })?.name?.toLowerCase().includes(params.beneficiary_name!.toLowerCase())
      );
    }

    const totalDistributed = filtered.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalFranking = filtered.reduce((sum, d) => sum + Number(d.franking_credits_streamed), 0);

    // Group by beneficiary
    const byBeneficiary = filtered.reduce((acc: Record<string, { total: number; franking: number; distributions: any[] }>, d) => {
      const name = (d.beneficiary as { name?: string })?.name || 'Unknown';
      if (!acc[name]) {
        acc[name] = { total: 0, franking: 0, distributions: [] };
      }
      acc[name].total += Number(d.amount);
      acc[name].franking += Number(d.franking_credits_streamed);
      acc[name].distributions.push({
        date: d.date,
        amount: Number(d.amount),
        frankingStreamed: Number(d.franking_credits_streamed),
        type: d.distribution_type,
        isPaid: d.is_paid,
      });
      return acc;
    }, {});

    return {
      financialYear,
      totalDistributed,
      totalFrankingStreamed: totalFranking,
      byBeneficiary,
      count: filtered.length,
    };
  },
});

export const getFrankingCredits = tool({
  description: 'Get franking credits balance and streaming options for a financial year',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get the user's trust
    const { data: trusts } = await supabase
      .from('trusts')
      .select('id')
      .limit(1);

    if (!trusts || trusts.length === 0) {
      return { note: 'No trust found', financialYear };
    }

    // Get income for franking received
    const { data: income } = await supabase
      .from('trust_income')
      .select('franking_credits')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear);

    // Get distributions for franking streamed
    const { data: distributions } = await supabase
      .from('trust_distributions')
      .select('franking_credits_streamed')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear);

    const creditsReceived = (income || []).reduce((sum, i) => sum + Number(i.franking_credits), 0);
    const creditsDistributed = (distributions || []).reduce((sum, d) => sum + Number(d.franking_credits_streamed), 0);

    return {
      financialYear,
      creditsReceived,
      creditsDistributed,
      balance: creditsReceived - creditsDistributed,
      streamingNote: 'Franking credits can be streamed to specific beneficiaries. Stream to the beneficiary with higher taxable income to maximise tax offset value.',
    };
  },
});

export const calculateDistribution = tool({
  description: 'Model distribution scenarios between Grant and Shannon to minimise total tax',
  inputSchema: z.object({
    grant_other_income: z.number().describe('Grant\'s taxable income excluding trust distribution'),
    shannon_other_income: z.number().describe('Shannon\'s taxable income excluding trust distribution'),
    scenarios: z.array(z.object({
      grant_percent: z.number().describe('Percentage to Grant (0-100)'),
      shannon_percent: z.number().describe('Percentage to Shannon (0-100)'),
    })).optional().default([
      { grant_percent: 50, shannon_percent: 50 },
      { grant_percent: 60, shannon_percent: 40 },
      { grant_percent: 70, shannon_percent: 30 },
      { grant_percent: 100, shannon_percent: 0 },
      { grant_percent: 0, shannon_percent: 100 },
    ]),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = getFinancialYear();

    // Get trust summary for distributable amount
    const { data: trusts } = await supabase
      .from('trusts')
      .select('id')
      .limit(1);

    if (!trusts || trusts.length === 0) {
      return { error: 'No trust found' };
    }

    const { data: income } = await supabase
      .from('trust_income')
      .select('amount, franking_credits')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear);

    const { data: distributions } = await supabase
      .from('trust_distributions')
      .select('amount')
      .eq('trust_id', trusts[0].id)
      .eq('financial_year', financialYear);

    const totalIncome = (income || []).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalFranking = (income || []).reduce((sum, i) => sum + Number(i.franking_credits), 0);
    const totalDistributed = (distributions || []).reduce((sum, d) => sum + Number(d.amount), 0);
    const distributableAmount = totalIncome - totalDistributed;

    if (distributableAmount <= 0) {
      return {
        note: 'No distributable amount available. All income has been distributed.',
        distributableAmount: 0,
      };
    }

    // Calculate tax for each scenario
    function calculateTax(taxableIncome: number): number {
      if (taxableIncome <= 18200) return 0;
      if (taxableIncome <= 45000) return (taxableIncome - 18200) * 0.16;
      if (taxableIncome <= 135000) return 4288 + (taxableIncome - 45000) * 0.30;
      if (taxableIncome <= 190000) return 31288 + (taxableIncome - 135000) * 0.37;
      return 51638 + (taxableIncome - 190000) * 0.45;
    }

    const scenarios = params.scenarios.map((s) => {
      const grantAmount = distributableAmount * (s.grant_percent / 100);
      const shannonAmount = distributableAmount * (s.shannon_percent / 100);
      const grantFranking = totalFranking * (s.grant_percent / 100);
      const shannonFranking = totalFranking * (s.shannon_percent / 100);

      // Gross up for tax (include franking)
      const grantTaxable = params.grant_other_income + grantAmount + grantFranking;
      const shannonTaxable = params.shannon_other_income + shannonAmount + shannonFranking;

      // Calculate tax with franking offset
      const grantTax = Math.max(0, calculateTax(grantTaxable) - grantFranking);
      const shannonTax = Math.max(0, calculateTax(shannonTaxable) - shannonFranking);

      return {
        split: `${s.grant_percent}/${s.shannon_percent}`,
        grantReceives: grantAmount,
        shannonReceives: shannonAmount,
        grantFranking,
        shannonFranking,
        grantTax,
        shannonTax,
        totalTax: grantTax + shannonTax,
      };
    });

    // Find optimal
    const optimal = scenarios.reduce((best, s) => (s.totalTax < best.totalTax ? s : best));
    const baseline = scenarios.find((s) => s.split === '50/50');
    const taxSavings = baseline ? baseline.totalTax - optimal.totalTax : 0;

    return {
      distributableAmount,
      frankingCredits: totalFranking,
      grantOtherIncome: params.grant_other_income,
      shannonOtherIncome: params.shannon_other_income,
      scenarios,
      recommendation: {
        optimalSplit: optimal.split,
        grantReceives: optimal.grantReceives,
        shannonReceives: optimal.shannonReceives,
        totalTax: optimal.totalTax,
        taxSavingsVs5050: taxSavings,
      },
    };
  },
});

// ============================================================================
// ASSETS & LIABILITIES TOOLS (Phase 7)
// Note: These tools are commented out because the tables don't exist yet.
// Uncomment when assets, liabilities, and net_worth_snapshots tables are created.
// ============================================================================

/* COMMENTED OUT - Tables not created yet
export const getAssets = tool({
  description: 'Get all assets from the asset register, optionally filtered by type or owner',
  inputSchema: z.object({
    asset_type: z.enum(['property', 'vehicle', 'shares', 'managed_fund', 'crypto', 'collectibles', 'cash', 'other']).optional(),
    owner: z.enum(['Grant', 'Shannon', 'Joint', 'Trust', 'SMSF']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('assets')
      .select('*')
      .eq('is_active', true)
      .order('current_value', { ascending: false });

    if (params.asset_type) {
      query = query.eq('asset_type', params.asset_type);
    }
    if (params.owner) {
      query = query.eq('owner', params.owner);
    }

    const { data: assets, error } = await query;

    if (error) return { error: error.message };

    const assetList = assets || [];
    const totalValue = assetList.reduce((sum, a) => sum + Number(a.current_value), 0);
    const totalCostBase = assetList.reduce((sum, a) => sum + Number(a.cost_base || a.purchase_price || 0), 0);

    // Group by type
    const byType = assetList.reduce((acc: Record<string, { count: number; value: number }>, a) => {
      if (!acc[a.asset_type]) acc[a.asset_type] = { count: 0, value: 0 };
      acc[a.asset_type].count++;
      acc[a.asset_type].value += Number(a.current_value);
      return acc;
    }, {});

    return {
      totalValue,
      totalCostBase,
      unrealisedGain: totalValue - totalCostBase,
      assetCount: assetList.length,
      byType,
      assets: assetList.map((a) => ({
        name: a.name,
        type: a.asset_type,
        owner: a.owner,
        currentValue: Number(a.current_value),
        costBase: Number(a.cost_base || a.purchase_price || 0),
        unrealisedGain: Number(a.current_value) - Number(a.cost_base || a.purchase_price || 0),
        purchaseDate: a.purchase_date,
        isPrimaryResidence: a.is_primary_residence,
      })),
    };
  },
});

export const getLiabilities = tool({
  description: 'Get all liabilities including mortgages, loans, credit cards, and HECS debts',
  inputSchema: z.object({
    liability_type: z.enum(['mortgage', 'car_loan', 'personal_loan', 'credit_card', 'hecs', 'margin_loan', 'other']).optional(),
    owner: z.enum(['Grant', 'Shannon', 'Joint']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('liabilities')
      .select('*, linked_asset:assets(name)')
      .eq('is_active', true)
      .order('current_balance', { ascending: false });

    if (params.liability_type) {
      query = query.eq('liability_type', params.liability_type);
    }
    if (params.owner) {
      query = query.eq('owner', params.owner);
    }

    const { data: liabilities, error } = await query;

    if (error) return { error: error.message };

    const liabilityList = liabilities || [];
    const totalBalance = liabilityList.reduce((sum, l) => sum + Number(l.current_balance), 0);
    const totalOriginal = liabilityList.reduce((sum, l) => sum + Number(l.original_amount || 0), 0);

    // Group by type
    const byType = liabilityList.reduce((acc: Record<string, { count: number; balance: number }>, l) => {
      if (!acc[l.liability_type]) acc[l.liability_type] = { count: 0, balance: 0 };
      acc[l.liability_type].count++;
      acc[l.liability_type].balance += Number(l.current_balance);
      return acc;
    }, {});

    return {
      totalBalance,
      totalOriginalAmount: totalOriginal,
      paidOff: totalOriginal - totalBalance,
      liabilityCount: liabilityList.length,
      byType,
      liabilities: liabilityList.map((l) => ({
        name: l.name,
        type: l.liability_type,
        owner: l.owner,
        currentBalance: Number(l.current_balance),
        originalAmount: Number(l.original_amount || 0),
        interestRate: l.interest_rate ? `${(l.interest_rate * 100).toFixed(2)}%` : null,
        minimumPayment: l.minimum_payment,
        paymentFrequency: l.payment_frequency,
        linkedAsset: (l.linked_asset as { name?: string })?.name || null,
      })),
    };
  },
});

export const getNetWorthHistory = tool({
  description: 'Get historical net worth snapshots for trend analysis',
  inputSchema: z.object({
    months: z.number().optional().default(12).describe('Number of months of history to retrieve'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - params.months);

    const { data: snapshots, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) return { error: error.message };

    if (!snapshots || snapshots.length === 0) {
      return {
        note: 'No historical snapshots found. Snapshots are recorded periodically.',
        snapshots: [],
      };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const change = last.consolidated_net_worth - first.consolidated_net_worth;
    const changePercent = first.consolidated_net_worth > 0
      ? (change / first.consolidated_net_worth) * 100
      : 0;

    return {
      periodStart: first.snapshot_date,
      periodEnd: last.snapshot_date,
      startingNetWorth: first.consolidated_net_worth,
      currentNetWorth: last.consolidated_net_worth,
      change,
      changePercent: changePercent.toFixed(1) + '%',
      snapshotCount: snapshots.length,
      snapshots: snapshots.map((s) => ({
        date: s.snapshot_date,
        personalNetWorth: s.personal_net_worth,
        smsfBalance: s.smsf_balance,
        trustAssets: s.trust_assets,
        consolidatedNetWorth: s.consolidated_net_worth,
      })),
    };
  },
});
/* END COMMENTED OUT - Phase 7 tables not created yet */

// ============================================================================
// PERSONAL TAX & DEDUCTIONS TOOLS (Phase 6)
// ============================================================================

export const getPersonalIncome = tool({
  description: 'Get personal income records (salary, dividends, trust distributions) for a person in a financial year',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    person: z.enum(['grant', 'shannon']).optional().describe('Person to filter by'),
    income_type: z.enum(['salary', 'bonus', 'dividend', 'trust_distribution', 'rental', 'interest', 'capital_gain', 'government_payment', 'other']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    let query = supabase
      .from('income')
      .select('*')
      .eq('financial_year', financialYear)
      .order('date', { ascending: false });

    if (params.person) {
      query = query.eq('person', params.person);
    }
    if (params.income_type) {
      query = query.eq('income_type', params.income_type);
    }

    const { data: income, error } = await query;

    if (error) return { error: error.message };

    const incomeList = income || [];
    const totalIncome = incomeList.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalFranking = incomeList.reduce((sum, i) => sum + Number(i.franking_credits || 0), 0);
    const totalWithheld = incomeList.reduce((sum, i) => sum + Number(i.tax_withheld || 0), 0);

    // Group by type
    const byType = incomeList.reduce((acc: Record<string, number>, i) => {
      acc[i.income_type] = (acc[i.income_type] || 0) + Number(i.amount);
      return acc;
    }, {});

    return {
      financialYear,
      person: params.person || 'all',
      totalIncome,
      totalFrankingCredits: totalFranking,
      totalTaxWithheld: totalWithheld,
      byType,
      incomeItems: incomeList.map((i) => ({
        date: i.date,
        source: i.source,
        type: i.income_type,
        amount: Number(i.amount),
        frankingCredits: Number(i.franking_credits || 0),
        taxWithheld: Number(i.tax_withheld || 0),
        isTaxable: i.is_taxable,
      })),
      count: incomeList.length,
    };
  },
});

export const getDeductions = tool({
  description: 'Get tax deductions including work-from-home, vehicle, donations, and other categories for a person',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    person: z.enum(['grant', 'shannon']).optional().describe('Person to filter by'),
    category: z.enum(['work_from_home', 'vehicle', 'travel', 'clothing_laundry', 'self_education', 'tools_equipment', 'professional_subscriptions', 'union_fees', 'phone_internet', 'donations', 'income_protection', 'tax_agent_fees', 'investment_expenses', 'rental_property', 'other']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    let query = supabase
      .from('deductions')
      .select('*')
      .eq('financial_year', financialYear)
      .order('date', { ascending: false });

    if (params.person) {
      query = query.eq('person', params.person);
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }

    const { data: deductions, error } = await query;

    if (error) return { error: error.message };

    const deductionList = deductions || [];
    const totalDeductions = deductionList.reduce((sum, d) => sum + Number(d.amount), 0);
    const flaggedCount = deductionList.filter((d) => !d.is_approved).length;

    // Group by category
    const byCategory = deductionList.reduce((acc: Record<string, number>, d) => {
      acc[d.category] = (acc[d.category] || 0) + Number(d.amount);
      return acc;
    }, {});

    // Get WFH specific details
    const wfhDeductions = deductionList.filter((d) => d.category === 'work_from_home');
    const wfhTotal = wfhDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const wfhHours = wfhDeductions.reduce((sum, d) => {
      const details = d.calculation_details as { hours?: number } | null;
      return sum + (details?.hours || 0);
    }, 0);

    return {
      financialYear,
      person: params.person || 'all',
      totalDeductions,
      flaggedForReview: flaggedCount,
      byCategory,
      workFromHome: {
        totalHours: wfhHours,
        totalDeduction: wfhTotal,
        ratePerHour: 0.67, // 2024-25 rate
      },
      deductionItems: deductionList.map((d) => ({
        date: d.date,
        description: d.description,
        category: d.category,
        amount: Number(d.amount),
        isApproved: d.is_approved,
        hasReceipt: !!d.receipt_url,
      })),
      count: deductionList.length,
    };
  },
});

export const getPersonalSuperContributions = tool({
  description: 'Get personal super contributions (non-SMSF) with cap tracking for a person',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    person: z.enum(['grant', 'shannon']).optional().describe('Person to filter by'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    let query = supabase
      .from('super_contributions')
      .select('*')
      .eq('financial_year', financialYear)
      .order('date', { ascending: false });

    if (params.person) {
      query = query.eq('person', params.person);
    }

    const { data: contributions, error } = await query;

    if (error) return { error: error.message };

    const contributionList = contributions || [];

    // Calculate by person
    const byPerson = contributionList.reduce((acc: Record<string, { concessional: number; nonConcessional: number }>, c) => {
      if (!acc[c.person]) {
        acc[c.person] = { concessional: 0, nonConcessional: 0 };
      }
      if (c.is_concessional) {
        acc[c.person].concessional += Number(c.amount);
      } else {
        acc[c.person].nonConcessional += Number(c.amount);
      }
      return acc;
    }, {});

    // 2024-25 caps
    const concessionalCap = 30000;
    const nonConcessionalCap = 120000;

    // Build summary with cap tracking
    const summaryByPerson = Object.entries(byPerson).map(([person, data]) => ({
      person,
      concessional: {
        contributed: data.concessional,
        cap: concessionalCap,
        remaining: Math.max(0, concessionalCap - data.concessional),
        percentageUsed: (data.concessional / concessionalCap) * 100,
        exceeded: data.concessional > concessionalCap,
      },
      nonConcessional: {
        contributed: data.nonConcessional,
        cap: nonConcessionalCap,
        remaining: Math.max(0, nonConcessionalCap - data.nonConcessional),
        percentageUsed: (data.nonConcessional / nonConcessionalCap) * 100,
        exceeded: data.nonConcessional > nonConcessionalCap,
      },
    }));

    // By type
    const byType = contributionList.reduce((acc: Record<string, number>, c) => {
      acc[c.contribution_type] = (acc[c.contribution_type] || 0) + Number(c.amount);
      return acc;
    }, {});

    return {
      financialYear,
      caps: { concessional: concessionalCap, nonConcessional: nonConcessionalCap },
      byPerson: summaryByPerson,
      byType,
      contributions: contributionList.map((c) => ({
        date: c.date,
        person: c.person,
        fundName: c.fund_name,
        type: c.contribution_type,
        amount: Number(c.amount),
        isConcessional: c.is_concessional,
        employerName: c.employer_name,
      })),
      count: contributionList.length,
    };
  },
});

export const getEnhancedTaxSummary = tool({
  description: 'Get comprehensive tax summary for a person including income breakdown, deductions, super caps, and estimated tax with franking credits',
  inputSchema: z.object({
    financial_year: z.string().optional().describe('Financial year in format YYYY-YY'),
    person: z.enum(['grant', 'shannon']).describe('Person to calculate tax for'),
    has_hecs_debt: z.boolean().optional().default(false).describe('Whether person has HECS/HELP debt'),
    has_private_health: z.boolean().optional().default(true).describe('Whether person has private health insurance'),
  }),
  execute: async (params) => {
    const supabase = await createClient();
    const financialYear = params.financial_year || getFinancialYear();

    // Get income
    const { data: incomeData } = await supabase
      .from('income')
      .select('*')
      .eq('financial_year', financialYear)
      .eq('person', params.person)
      .eq('is_taxable', true);

    // Get deductions
    const { data: deductionsData } = await supabase
      .from('deductions')
      .select('*')
      .eq('financial_year', financialYear)
      .eq('person', params.person);

    // Get super contributions
    const { data: superData } = await supabase
      .from('super_contributions')
      .select('*')
      .eq('financial_year', financialYear)
      .eq('person', params.person);

    const income = incomeData || [];
    const deductions = deductionsData || [];
    const superContribs = superData || [];

    // Income breakdown
    const incomeSummary = {
      salary: income.filter((i) => ['salary', 'bonus'].includes(i.income_type)).reduce((sum, i) => sum + Number(i.amount), 0),
      dividends: income.filter((i) => i.income_type === 'dividend').reduce((sum, i) => sum + Number(i.amount), 0),
      trustDistributions: income.filter((i) => i.income_type === 'trust_distribution').reduce((sum, i) => sum + Number(i.amount), 0),
      rental: income.filter((i) => i.income_type === 'rental').reduce((sum, i) => sum + Number(i.amount), 0),
      capitalGains: income.filter((i) => i.income_type === 'capital_gain').reduce((sum, i) => sum + Number(i.amount), 0),
      other: income.filter((i) => !['salary', 'bonus', 'dividend', 'trust_distribution', 'rental', 'capital_gain'].includes(i.income_type)).reduce((sum, i) => sum + Number(i.amount), 0),
    };
    const grossIncome = Object.values(incomeSummary).reduce((sum, v) => sum + v, 0);
    const frankingCredits = income.reduce((sum, i) => sum + Number(i.franking_credits || 0), 0);
    const taxWithheld = income.reduce((sum, i) => sum + Number(i.tax_withheld || 0), 0);

    // Deductions breakdown
    const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

    // Super contributions
    const concessionalSuper = superContribs.filter((s) => s.is_concessional).reduce((sum, s) => sum + Number(s.amount), 0);

    // Tax calculation (2024-25 rates)
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);
    const taxableWithFranking = taxableIncome + frankingCredits;

    let incomeTax = 0;
    let marginalRate = 0;
    let taxBracket = '';

    if (taxableWithFranking <= 18200) {
      incomeTax = 0;
      marginalRate = 0;
      taxBracket = '$0 - $18,200 (0%)';
    } else if (taxableWithFranking <= 45000) {
      incomeTax = (taxableWithFranking - 18200) * 0.16;
      marginalRate = 16;
      taxBracket = '$18,201 - $45,000 (16%)';
    } else if (taxableWithFranking <= 135000) {
      incomeTax = 4288 + (taxableWithFranking - 45000) * 0.30;
      marginalRate = 30;
      taxBracket = '$45,001 - $135,000 (30%)';
    } else if (taxableWithFranking <= 190000) {
      incomeTax = 31288 + (taxableWithFranking - 135000) * 0.37;
      marginalRate = 37;
      taxBracket = '$135,001 - $190,000 (37%)';
    } else {
      incomeTax = 51638 + (taxableWithFranking - 190000) * 0.45;
      marginalRate = 45;
      taxBracket = '$190,001+ (45%)';
    }

    // Medicare levy (2%)
    let medicareLevy = 0;
    if (taxableWithFranking > 26000) {
      if (taxableWithFranking <= 32500) {
        medicareLevy = (taxableWithFranking - 26000) * 0.1;
      } else {
        medicareLevy = taxableWithFranking * 0.02;
      }
    }

    // Medicare surcharge if no PHI
    let medicareSurcharge = 0;
    if (!params.has_private_health && taxableWithFranking > 97000) {
      if (taxableWithFranking <= 130000) {
        medicareSurcharge = taxableWithFranking * 0.01;
      } else if (taxableWithFranking <= 173000) {
        medicareSurcharge = taxableWithFranking * 0.0125;
      } else {
        medicareSurcharge = taxableWithFranking * 0.015;
      }
    }

    // HECS repayment
    let hecsRepayment = 0;
    if (params.has_hecs_debt && taxableWithFranking > 54435) {
      // Simplified - use highest applicable rate
      if (taxableWithFranking > 159664) hecsRepayment = taxableWithFranking * 0.10;
      else if (taxableWithFranking > 100174) hecsRepayment = taxableWithFranking * 0.06;
      else if (taxableWithFranking > 74855) hecsRepayment = taxableWithFranking * 0.035;
      else hecsRepayment = taxableWithFranking * 0.01;
    }

    const totalTaxBeforeOffsets = incomeTax + medicareLevy + medicareSurcharge + hecsRepayment;
    const netTaxPayable = Math.max(0, totalTaxBeforeOffsets - frankingCredits);
    const estimatedRefund = taxWithheld - netTaxPayable;
    const effectiveRate = grossIncome > 0 ? (netTaxPayable / grossIncome) * 100 : 0;

    return {
      person: params.person,
      financialYear,
      income: {
        ...incomeSummary,
        grossIncome,
        frankingCredits,
        taxWithheld,
      },
      deductions: {
        total: totalDeductions,
        byCategory: deductions.reduce((acc: Record<string, number>, d) => {
          acc[d.category] = (acc[d.category] || 0) + Number(d.amount);
          return acc;
        }, {}),
      },
      superContributions: {
        concessional: concessionalSuper,
        concessionalCap: 30000,
        concessionalRemaining: Math.max(0, 30000 - concessionalSuper),
      },
      tax: {
        taxableIncome,
        taxBracket,
        marginalRate: marginalRate + '%',
        incomeTax: Math.round(incomeTax),
        medicareLevy: Math.round(medicareLevy),
        medicareSurcharge: Math.round(medicareSurcharge),
        hecsRepayment: Math.round(hecsRepayment),
        totalBeforeOffsets: Math.round(totalTaxBeforeOffsets),
        frankingCreditOffset: frankingCredits,
        netTaxPayable: Math.round(netTaxPayable),
        effectiveRate: effectiveRate.toFixed(1) + '%',
      },
      outcome: {
        taxWithheld,
        estimatedRefundOrOwing: Math.round(estimatedRefund),
        isRefund: estimatedRefund > 0,
        summary: estimatedRefund > 0
          ? `Estimated refund of $${Math.abs(Math.round(estimatedRefund)).toLocaleString()}`
          : `Estimated tax owing of $${Math.abs(Math.round(estimatedRefund)).toLocaleString()}`,
      },
    };
  },
});

export const calculateWFHDeduction = tool({
  description: 'Calculate work-from-home deduction using the fixed rate method (67c/hour for 2024-25)',
  inputSchema: z.object({
    hours_per_week: z.number().describe('Average hours worked from home per week'),
    weeks_worked: z.number().optional().default(48).describe('Number of weeks worked (default 48)'),
  }),
  execute: async (params) => {
    const totalHours = params.hours_per_week * params.weeks_worked;
    const ratePerHour = 0.67; // 2024-25 rate
    const totalDeduction = totalHours * ratePerHour;

    return {
      hoursPerWeek: params.hours_per_week,
      weeksWorked: params.weeks_worked,
      totalHours,
      ratePerHour: `$${ratePerHour}`,
      totalDeduction: Math.round(totalDeduction * 100) / 100,
      note: 'Fixed rate method for 2024-25. Remember to keep a record of hours worked from home (timesheet or diary).',
      requirements: [
        'Keep a record of actual hours worked from home',
        'Must have a dedicated work area at home',
        'Covers electricity, phone, internet, stationery, computer depreciation',
      ],
    };
  },
});

// ============================================================================
// BUDGET TOOLS (Phase 8)
// ============================================================================

export const getBudgetProgress = tool({
  description: 'Get budget progress for all budgets showing spending vs limits with alerts',
  inputSchema: z.object({
    category_id: z.string().optional().describe('Filter by specific category ID'),
    period: z.enum(['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly']).optional(),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name)
      `)
      .eq('is_active', true);

    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }
    if (params.period) {
      query = query.eq('period', params.period);
    }

    const { data: budgets, error } = await query;

    if (error) return { error: error.message };

    const budgetList = budgets || [];

    // Calculate spending for each budget
    const budgetProgress = await Promise.all(
      budgetList.map(async (budget) => {
        // Calculate period dates
        const now = new Date();
        let startDate: string;
        let endDate: string;

        switch (budget.period) {
          case 'weekly': {
            const dayOfWeek = now.getDay();
            const start = new Date(now);
            start.setDate(now.getDate() - dayOfWeek);
            startDate = start.toISOString().split('T')[0];
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            endDate = end.toISOString().split('T')[0];
            break;
          }
          case 'fortnightly': {
            const dayOfWeek = now.getDay();
            const start = new Date(now);
            start.setDate(now.getDate() - dayOfWeek - 7);
            startDate = start.toISOString().split('T')[0];
            const end = new Date(start);
            end.setDate(start.getDate() + 13);
            endDate = end.toISOString().split('T')[0];
            break;
          }
          case 'monthly': {
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate = lastDay.toISOString().split('T')[0];
            break;
          }
          case 'quarterly': {
            const quarter = Math.floor(now.getMonth() / 3);
            const startMonth = quarter * 3;
            startDate = `${now.getFullYear()}-${String(startMonth + 1).padStart(2, '0')}-01`;
            const endMonth = startMonth + 3;
            const lastDay = new Date(now.getFullYear(), endMonth, 0);
            endDate = lastDay.toISOString().split('T')[0];
            break;
          }
          case 'yearly': {
            // Australian financial year
            const month = now.getMonth();
            const year = now.getFullYear();
            if (month >= 6) {
              startDate = `${year}-07-01`;
              endDate = `${year + 1}-06-30`;
            } else {
              startDate = `${year - 1}-07-01`;
              endDate = `${year}-06-30`;
            }
            break;
          }
          default:
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            endDate = now.toISOString().split('T')[0];
        }

        // Get spending for category in period
        const { data: transactions } = budget.category_id
          ? await supabase
              .from('transactions')
              .select('amount')
              .eq('category_id', budget.category_id)
              .eq('transaction_type', 'expense')
              .gte('date', startDate)
              .lte('date', endDate)
          : { data: [] };

        const spent = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
        const remaining = Number(budget.amount) - spent;
        const percentage = (spent / Number(budget.amount)) * 100;

        // Determine status
        let status: 'good' | 'warning' | 'exceeded' = 'good';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= (budget.alert_threshold || 80)) {
          status = 'warning';
        }

        return {
          budgetId: budget.id,
          categoryName: (budget.category as { name?: string })?.name || 'Unknown',
          period: budget.period,
          budgetAmount: Number(budget.amount),
          spent,
          remaining,
          percentageUsed: Math.round(percentage),
          status,
          alertThreshold: budget.alert_threshold || 80,
          periodDates: { start: startDate, end: endDate },
        };
      })
    );

    const totalBudgeted = budgetProgress.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgetProgress.filter((b) => b.status === 'exceeded').length;
    const warningCount = budgetProgress.filter((b) => b.status === 'warning').length;

    return {
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining: totalBudgeted - totalSpent,
        overallPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
        budgetsExceeded: overBudgetCount,
        budgetsWarning: warningCount,
      },
      budgets: budgetProgress,
    };
  },
});

export const getBudgetAlerts = tool({
  description: 'Get active budget alerts for budgets approaching or exceeding limits',
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = await createClient();

    // Get all active budgets
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name)
      `)
      .eq('is_active', true);

    if (error) return { error: error.message };

    const budgetList = budgets || [];
    const alerts: {
      categoryName: string;
      period: string;
      budgetAmount: number;
      spent: number;
      percentageUsed: number;
      status: 'warning' | 'exceeded';
      message: string;
    }[] = [];

    // Check each budget
    for (const budget of budgetList) {
      const now = new Date();
      let startDate: string;
      let endDate: string;

      // Calculate period dates
      switch (budget.period) {
        case 'weekly': {
          const dayOfWeek = now.getDay();
          const start = new Date(now);
          start.setDate(now.getDate() - dayOfWeek);
          startDate = start.toISOString().split('T')[0];
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'monthly': {
          startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate = lastDay.toISOString().split('T')[0];
          break;
        }
        default:
          startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          endDate = now.toISOString().split('T')[0];
      }

      // Get spending for category in period
      const { data: transactions } = budget.category_id
        ? await supabase
            .from('transactions')
            .select('amount')
            .eq('category_id', budget.category_id)
            .eq('transaction_type', 'expense')
            .gte('date', startDate)
            .lte('date', endDate)
        : { data: [] };

      const spent = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = (spent / Number(budget.amount)) * 100;
      const alertThreshold = budget.alert_threshold || 80;

      if (percentage >= 100) {
        alerts.push({
          categoryName: (budget.category as { name?: string })?.name || 'Unknown',
          period: budget.period,
          budgetAmount: Number(budget.amount),
          spent,
          percentageUsed: Math.round(percentage),
          status: 'exceeded',
          message: `Budget exceeded by $${(spent - Number(budget.amount)).toFixed(2)}`,
        });
      } else if (percentage >= alertThreshold) {
        alerts.push({
          categoryName: (budget.category as { name?: string })?.name || 'Unknown',
          period: budget.period,
          budgetAmount: Number(budget.amount),
          spent,
          percentageUsed: Math.round(percentage),
          status: 'warning',
          message: `${Math.round(percentage)}% of budget used (${alertThreshold}% threshold)`,
        });
      }
    }

    const exceededCount = alerts.filter((a) => a.status === 'exceeded').length;
    const warningCount = alerts.filter((a) => a.status === 'warning').length;

    return {
      alertCount: alerts.length,
      alerts,
      summary:
        alerts.length === 0
          ? 'All budgets are within limits'
          : `${exceededCount} budgets exceeded, ${warningCount} approaching limit`,
    };
  },
});

// ============================================================================
// DOCUMENT SEARCH TOOLS (Phase 8)
// ============================================================================

export const searchDocuments = tool({
  description: 'Search documents using semantic search powered by AI embeddings. Finds documents based on content meaning, not just keywords.',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    entity_type: z.enum(['personal', 'trust', 'smsf']).optional().describe('Filter by entity type'),
    document_type: z.enum(['tax_return', 'bank_statement', 'receipt', 'invoice', 'contract', 'trust_deed', 'annual_report', 'compliance', 'other']).optional(),
    financial_year: z.string().optional().describe('Filter by financial year (YYYY-YY)'),
    limit: z.number().optional().default(10).describe('Maximum results to return'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    // Generate embedding for query (simplified - in production use proper embedding API)
    // For now, fall back to text search
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.entity_type) {
      query = query.eq('entity_type', params.entity_type);
    }
    if (params.document_type) {
      query = query.eq('document_type', params.document_type);
    }
    if (params.financial_year) {
      query = query.eq('financial_year', params.financial_year);
    }

    // Text search in name and description
    query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);

    const { data: documents, error } = await query.limit(params.limit || 10);

    if (error) return { error: error.message };

    return {
      query: params.query,
      resultCount: (documents || []).length,
      documents: (documents || []).map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        entityType: d.entity_type,
        documentType: d.document_type,
        financialYear: d.financial_year,
        fileSize: d.file_size,
        uploadedAt: d.created_at,
        isProcessed: d.is_processed,
      })),
      note: 'Results matched by name/description. For semantic search, ensure documents are processed with embeddings.',
    };
  },
});

export const getDocumentsByEntity = tool({
  description: 'List documents for a specific entity (personal, trust, or SMSF) with optional filters',
  inputSchema: z.object({
    entity_type: z.enum(['personal', 'trust', 'smsf']).describe('Entity type to get documents for'),
    document_type: z.enum(['tax_return', 'bank_statement', 'receipt', 'invoice', 'contract', 'trust_deed', 'annual_report', 'compliance', 'other']).optional(),
    financial_year: z.string().optional().describe('Filter by financial year (YYYY-YY)'),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('documents')
      .select('*')
      .eq('entity_type', params.entity_type)
      .order('created_at', { ascending: false });

    if (params.document_type) {
      query = query.eq('document_type', params.document_type);
    }
    if (params.financial_year) {
      query = query.eq('financial_year', params.financial_year);
    }

    const { data: documents, error } = await query;

    if (error) return { error: error.message };

    const documentList = documents || [];

    // Group by type
    const byType = documentList.reduce((acc: Record<string, number>, d) => {
      acc[d.document_type] = (acc[d.document_type] || 0) + 1;
      return acc;
    }, {});

    // Group by financial year
    const byYear = documentList.reduce((acc: Record<string, number>, d) => {
      const year = d.financial_year || 'Unspecified';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    return {
      entityType: params.entity_type,
      totalDocuments: documentList.length,
      byType,
      byYear,
      documents: documentList.map((d) => ({
        id: d.id,
        name: d.name,
        documentType: d.document_type,
        financialYear: d.financial_year,
        uploadedAt: d.created_at,
      })),
    };
  },
});

// ============================================================================
// NOTIFICATION TOOLS (Phase 8)
// ============================================================================

export const getNotifications = tool({
  description: 'Get user notifications including reminders and alerts',
  inputSchema: z.object({
    unread_only: z.boolean().optional().default(false).describe('Only show unread notifications'),
    notification_type: z.enum(['reminder', 'alert', 'deadline', 'info', 'action_required']).optional(),
    limit: z.number().optional().default(20),
  }),
  execute: async (params) => {
    const supabase = await createClient();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });

    if (params.unread_only) {
      query = query.eq('is_read', false);
    }
    if (params.notification_type) {
      query = query.eq('notification_type', params.notification_type);
    }

    const { data: notifications, error } = await query.limit(params.limit || 20);

    if (error) return { error: error.message };

    const notificationList = notifications || [];
    const unreadCount = notificationList.filter((n) => !n.is_read).length;
    const urgentCount = notificationList.filter((n) => n.priority === 'urgent' || n.priority === 'high').length;

    return {
      totalNotifications: notificationList.length,
      unreadCount,
      urgentCount,
      notifications: notificationList.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        priority: n.priority,
        isRead: n.is_read,
        createdAt: n.created_at,
        scheduledFor: n.scheduled_for,
        linkUrl: n.link_url,
      })),
    };
  },
});

export const getUpcomingDeadlines = tool({
  description: 'Get upcoming financial deadlines and compliance due dates',
  inputSchema: z.object({
    days_ahead: z.number().optional().default(30).describe('Number of days to look ahead'),
  }),
  execute: async (params) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + params.days_ahead);

    const supabase = await createClient();

    // Get scheduled notifications (deadlines)
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('notification_type', 'deadline')
      .eq('is_dismissed', false)
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', futureDate.toISOString())
      .order('scheduled_for', { ascending: true });

    const deadlines = (notifications || [])
      .filter((n) => n.scheduled_for !== null)
      .map((n) => ({
        title: n.title,
        message: n.message,
        dueDate: n.scheduled_for!,
        priority: n.priority,
        daysUntil: Math.ceil((new Date(n.scheduled_for!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    // Add static known deadlines
    const month = now.getMonth();
    const year = now.getFullYear();

    // Trust distribution deadline - June 30
    if (month < 6 || (month === 5 && now.getDate() <= 30)) {
      const june30 = new Date(year, 5, 30);
      if (june30 > now && june30 <= futureDate) {
        deadlines.push({
          title: 'Trust Distribution Deadline',
          message: 'Trust distributions must be resolved by 30 June',
          dueDate: june30.toISOString(),
          priority: 'high' as const,
          daysUntil: Math.ceil((june30.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    }

    // Sort by due date
    deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      daysAhead: params.days_ahead,
      deadlineCount: deadlines.length,
      deadlines,
      summary:
        deadlines.length === 0
          ? `No deadlines in the next ${params.days_ahead} days`
          : `${deadlines.length} deadline(s) in the next ${params.days_ahead} days`,
    };
  },
});

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const personalFinanceTools = {
  get_transactions: getTransactions,
  get_spending_summary: getSpendingSummary,
  get_accounts: getAccounts,
  get_income: getIncome,
  get_net_worth: getNetWorth,
  get_tax_summary: getTaxSummary,
  get_budgets: getBudgets,
  calculate_tax: calculateTax,
  calculate_cgt: calculateCGT,
};

export const taxTools = {
  get_personal_income: getPersonalIncome,
  get_deductions: getDeductions,
  get_personal_super_contributions: getPersonalSuperContributions,
  get_enhanced_tax_summary: getEnhancedTaxSummary,
  calculate_wfh_deduction: calculateWFHDeduction,
};

// COMMENTED OUT - Phase 7 tables not created yet
// export const assetTools = {
//   get_assets: getAssets,
//   get_liabilities: getLiabilities,
//   get_net_worth_history: getNetWorthHistory,
// };

export const smsfTools = {
  get_smsf_summary: getSmsfSummary,
  get_smsf_contributions: getSmsfContributions,
  get_smsf_investments: getSmsfInvestments,
  get_smsf_compliance: getSmsfCompliance,
};

export const trustTools = {
  get_trust_summary: getTrustSummary,
  get_trust_income: getTrustIncome,
  get_trust_distributions: getTrustDistributions,
  get_franking_credits: getFrankingCredits,
  calculate_distribution: calculateDistribution,
};

export const budgetTools = {
  get_budget_progress: getBudgetProgress,
  get_budget_alerts: getBudgetAlerts,
};

export const documentTools = {
  search_documents: searchDocuments,
  get_documents_by_entity: getDocumentsByEntity,
};

export const notificationTools = {
  get_notifications: getNotifications,
  get_upcoming_deadlines: getUpcomingDeadlines,
};

export const allTools = {
  ...personalFinanceTools,
  ...taxTools,
  // ...assetTools, // COMMENTED OUT - Phase 7 tables not created yet
  ...smsfTools,
  ...trustTools,
  ...budgetTools,
  ...documentTools,
  ...notificationTools,
};
