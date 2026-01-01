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
      status: fund.fund_status,
      totalBalance,
      members: memberList.map((m) => ({
        name: m.name,
        balance: Number(m.total_super_balance || 0),
        status: m.member_status,
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

export const allTools = {
  ...personalFinanceTools,
  ...smsfTools,
  ...trustTools,
};
