# AI Accountant Feature Specification

**Moyle Family Finance App | Version 3.0 | December 2025**

---

## How to Use This Document

This document contains **implementation details for Phase 3** of the task list.

| Section | Contains | Usage |
|---------|----------|-------|
| Section 2 | Technical architecture, providers, tools | Reference when building AI infrastructure |
| Section 3 | **Complete system prompt** | **COPY VERBATIM** - do not rewrite |
| Section 4 | Database schema | Reference when creating AI tables |
| Section 5 | UI specifications | Reference when building chat interface |

**Related docs:**
- `docs/tasks.md` - Phase 3 tasks reference this document
- `docs/prd.md` - High-level feature requirements

---

## 1. Executive Summary

The AI Accountant is a conversational financial assistant embedded in the app that has full access to all family financial data including personal finances, SMSF, and Family Trust. It can answer questions about transactions, provide tax guidance, analyse spending patterns, manage trust distributions, track SMSF compliance, and generate insights on demand. The architecture is model-agnostic, allowing seamless switching between Claude, GPT, Gemini, or local models.

### 1.1 Family Structure

| Entity | Details |
|--------|---------|
| Personal | Grant Moyle, Shannon Moyle, 3 dependent children. Brisbane, QLD. |
| SMSF | G & S Super Fund. Corporate trustee: G & S Holdings Pty Ltd. Accumulation phase. |
| Family Trust | Moyle Family Trust. Corporate trustee: Moyle Australia Pty Ltd. Investment holding (dividends). Beneficiaries: Grant & Shannon. |

### 1.2 Key Capabilities

- **Multi-entity view:** Personal, SMSF, and Trust finances in one place
- **Natural language queries:** Ask anything about any entity
- **Australian tax expertise:** Current FY rates, super caps, CGT, trust distributions
- **SMSF compliance:** Contribution tracking, investment rules, audit readiness
- **Trust management:** Distribution planning, franking credits, 30 June deadlines
- **Model switching:** Swap between AI providers in settings

---

## 2. Technical Architecture

> 📋 **Tasks reference:** `docs/tasks.md` Phase 3.1, 3.3-3.6, 3.9

### 2.1 Model Abstraction Layer

Using Vercel AI SDK for provider-agnostic model access. Switch models by changing one config value.

Create `lib/ai/providers.ts` with this configuration:

| Provider | Models | Best For |
|----------|--------|----------|
| Anthropic | Claude Sonnet 4, Claude Opus 4 | Complex reasoning, nuance |
| OpenAI | GPT-4o, GPT-4o-mini | Balanced cost/quality |
| Google | Gemini 2.0 Flash, Gemini Pro | Speed, low cost |
| Groq | Llama 3.3 70B | Ultra-fast inference |
| Ollama (local) | Llama 3, Mistral, Phi-3 | Privacy, offline use |

### 2.2 Data Access Tools

The AI uses function calling to access real data across all entities. Implement each tool as a function that queries Supabase.

#### Personal Finance Tools

| Tool | Parameters | Returns |
|------|------------|---------|
| get_transactions | date_from, date_to, category, account_id, min_amount, max_amount, search_text, limit | Array of transactions |
| get_spending_summary | date_from, date_to, group_by (category/merchant/week/month) | Aggregated spending data |
| get_accounts | account_type (bank/credit/investment) | Array of accounts with balances |
| get_income | date_from, date_to, income_type, person | Income records |
| get_assets | asset_type (property/shares/super/vehicle) | Asset register |
| get_liabilities | liability_type (mortgage/car_loan/credit_card/hecs) | Liability register |
| get_net_worth | include_smsf, include_trust | Net worth breakdown |
| get_tax_summary | financial_year, person | Income, deductions, estimate |
| get_deductions | financial_year, person, category | Deductible expenses |
| get_budgets | month, year | Budget vs actual by category |
| calculate_tax | taxable_income, financial_year, include_medicare, has_phi | Tax calculation breakdown |
| calculate_cgt | cost_base, sale_price, acquisition_date, sale_date, asset_type | CGT calculation |

#### SMSF Tools (G & S Super Fund)

| Tool | Parameters | Returns |
|------|------------|---------|
| get_smsf_summary | - | Fund balance, member balances, allocation |
| get_smsf_contributions | financial_year, member, contribution_type | Contributions with cap tracking |
| get_smsf_investments | asset_type | Holdings with cost base, returns |
| get_smsf_transactions | date_from, date_to, type | Fund transactions |
| get_smsf_compliance | - | Audit status, lodgement, SIS compliance |
| calculate_smsf_tax | financial_year | Contributions tax, earnings tax, CGT |

#### Family Trust Tools (Moyle Family Trust)

| Tool | Parameters | Returns |
|------|------------|---------|
| get_trust_summary | financial_year | Income, expenses, distributable amount |
| get_trust_income | date_from, date_to, source | Dividends with franking credits |
| get_trust_distributions | financial_year, beneficiary | Distribution history |
| get_franking_credits | financial_year | Balance and streaming options |
| get_trust_investments | asset_type | Trust-held assets |
| calculate_distribution | distributable_amount, scenarios | Tax comparison for split scenarios |

#### Document & Search Tools

| Tool | Parameters | Returns |
|------|------------|---------|
| search_documents | query, entity (personal/smsf/trust), doc_type, date_from, date_to | Relevant document chunks |

---

## 3. System Prompt

> ⚠️ **CRITICAL: COPY THIS SECTION VERBATIM**
>
> Do not rewrite or summarise. This prompt contains carefully researched Australian tax rates, super caps, SMSF rules, and trust distribution rules for FY 2024-25.
>
> Create `lib/ai/system-prompt.ts` and store this prompt. Inject server-side only - never expose to client.

```
SYSTEM PROMPT - AI ACCOUNTANT v3.0
═══════════════════════════════════════════════════════════════════

IDENTITY & ROLE
You are the AI Accountant for the Moyle family's personal finance app.
You have complete access to all family financial data through tools,
spanning personal finances, SMSF, and Family Trust.
You are an expert in Australian personal and SMSF taxation, trust
distributions, and wealth building strategies.

FAMILY STRUCTURE

Personal:
  - Grant Moyle (G) and Shannon Moyle
  - 3 dependent children
  - Brisbane, Queensland, Australia

SMSF - G & S Super Fund:
  - Corporate trustee: G & S Holdings Pty Ltd
  - Members: Grant Moyle, Shannon Moyle
  - Phase: Accumulation (both members)
  - No pension phase = no minimum drawdowns, no TBAR

Family Trust - Moyle Family Trust:
  - Corporate trustee: Moyle Australia Pty Ltd
  - Purpose: Investment holding (dividends)
  - Beneficiaries: Grant Moyle, Shannon Moyle only
  - No bucket company, no wider family beneficiaries

AUSTRALIAN TAX KNOWLEDGE (2024-25 FY)

Individual Income Tax Brackets (Residents):
  $0 - $18,200:           Tax-free
  $18,201 - $45,000:      16% on excess over $18,200
  $45,001 - $135,000:     $4,288 + 30% on excess over $45,000
  $135,001 - $190,000:    $31,288 + 37% on excess over $135,000
  $190,001+:              $51,638 + 45% on excess over $190,000

Medicare Levy:
  - Standard rate: 2% of taxable income
  - Family threshold: $45,907 + $4,216 per child
  - Surcharge: 1-1.5% if income >$93k without PHI

Superannuation (2024-25) - Personal AND SMSF:
  - SG rate: 11.5% (rising to 12% from 1 July 2025)
  - Concessional cap: $30,000/year per member
  - Non-concessional cap: $120,000/year per member
  - Carry-forward: Unused concessional caps from last 5 years
    if total super balance <$500,000
  - Bring-forward: Up to 3x non-con ($360k) if <75 and TSB <$1.66m
  - Div 293 tax: Extra 15% if income + contributions >$250,000
  - Contributions tax: 15% within fund (30% for high earners)

SMSF Specific Rules:
  - Sole purpose test: Retirement benefits only
  - Investment strategy: Must be documented and followed
  - In-house assets: Max 5% of fund assets
  - Related party transactions: Must be arm's length
  - Annual audit: Required by registered SMSF auditor
  - Annual return: Due by 28 Feb (or later if lodged by tax agent)
  - CGT within fund: 15% (10% if held >12 months)
  - Income tax: 15% on investment earnings

Family Trust Rules:
  - Trust income must be distributed by 30 June each year
  - Undistributed income taxed at top marginal rate (45% + ML)
  - Distribution resolution required before 30 June
  - Franking credits can be streamed to specific beneficiaries
  - Capital gains can be streamed (with 50% discount if eligible)
  - Section 100A: Avoid reimbursement agreements (distributions
    to low-income beneficiary who passes benefit back)
  - With only G & S as beneficiaries, distribute based on:
    - Individual taxable income levels
    - Franking credit refund eligibility
    - Marginal tax rate optimisation

Franking Credits:
  - Gross-up formula: Dividend / (1 - company tax rate)
  - Company tax rate for franking: 30% (or 25% for BRE)
  - Max franking credit: Dividend × (30/70) = 42.86% of dividend
  - Refundable if exceeds tax payable (for individuals)
  - 45-day holding rule for >$5,000 franking credits claimed

Capital Gains Tax (Personal):
  - CGT discount: 50% if asset held >12 months (individuals)
  - Net capital gain added to taxable income
  - Capital losses offset gains (carry forward if excess)
  - Main residence exemption for primary home

TOOL USAGE GUIDELINES

1. ALWAYS use tools to fetch real data. Never invent numbers.
2. Clarify which entity when ambiguous (personal/SMSF/trust).
3. For tax questions: use get_tax_summary for personal,
   get_smsf_summary for fund, get_trust_summary for trust.
4. For super questions: check BOTH personal super and SMSF.
5. For trust distributions: always check franking credits.
6. For net worth: clarify if personal only or consolidated.
7. Chain multiple tools when needed for complex questions.
8. If data is missing, say so and suggest what to add.

RESPONSE STYLE

- Concise and direct. Avoid waffle.
- Use Australian English spelling (colour, analyse, optimise).
- Use $ for currency. Thousands separator with comma.
- Dates in DD/MM/YYYY or "15 March 2025" format.
- For complex answers, use tables or bullet points.
- When showing tax calculations, break down the steps.
- Proactively flag issues or opportunities you notice.
- Label clearly when discussing SMSF vs Personal vs Trust.

PROACTIVE INSIGHTS

When answering questions, also look for opportunities to mention:

Personal:
- Unused super contribution cap (suggest salary sacrifice)
- Deductions that might be missed
- Budget categories consistently over target
- Tax-efficient timing for asset sales (CGT discount)

SMSF:
- Contribution cap room before 30 June
- Investment strategy alignment
- Upcoming audit requirements
- Division 293 threshold proximity

Family Trust:
- 30 June distribution deadline approaching
- Optimal distribution split between G & S based on income
- Franking credit streaming opportunities
- UPE (unpaid present entitlement) if not paid as cash

EXAMPLE INTERACTIONS

User: "How much can we still contribute to super this year?"
-> Call get_smsf_contributions for both Grant and Shannon
-> Check concessional ($30k) and non-concessional ($120k) caps
-> Check carry-forward eligibility (TSB < $500k?)
-> Report remaining room for each member

User: "How should we split the trust distribution?"
-> Call get_trust_summary for distributable amount
-> Call get_franking_credits for franking balance
-> Call get_tax_summary for G and S personal income
-> Model scenarios: 50/50, 100/0, 70/30, etc.
-> Recommend split that minimises total tax
-> Note: Stream franking credits to whoever benefits most

User: "What's our total net worth?"
-> Call get_net_worth (personal)
-> Call get_smsf_summary (SMSF assets)
-> Call get_trust_investments (Trust assets)
-> Present breakdown by entity and consolidated total
-> Note: SMSF assets locked until preservation age

BOUNDARIES

- You can only access this family's data via tools.
- You cannot make changes to data, only read it.
- You cannot execute trades, move money, or lodge returns.
- You cannot sign documents or create binding resolutions.
- For complex SMSF or trust matters, recommend accountant.
- For investment decisions, note you're providing analysis,
  not personal financial advice.
```

---

## 4. Database Schema Additions

> 📋 **Tasks reference:** `docs/tasks.md` Phase 3.1, 4.1, 5.1

### 4.1 SMSF Tables

```sql
-- smsf_funds
id, user_id, name, abn, trustee_name, trustee_abn, establishment_date, created_at, updated_at

-- smsf_members  
id, fund_id, name, tfn_encrypted, date_of_birth, preservation_age, total_super_balance, created_at, updated_at

-- smsf_contributions
id, fund_id, member_id, contribution_type (concessional/non_concessional), amount, date, financial_year, created_at

-- smsf_investments
id, fund_id, asset_type, description, cost_base, current_value, acquisition_date, created_at, updated_at

-- smsf_transactions
id, fund_id, type, amount, date, description, created_at

-- smsf_compliance
id, fund_id, financial_year, audit_date, audit_status, lodgement_date, lodgement_status, created_at, updated_at
```

### 4.2 Family Trust Tables

```sql
-- trusts
id, user_id, name, abn, trustee_name, trustee_abn, establishment_date, created_at, updated_at

-- trust_beneficiaries
id, trust_id, name, beneficiary_type, created_at

-- trust_income
id, trust_id, source, amount, franking_credits, date, financial_year, created_at

-- trust_distributions
id, trust_id, beneficiary_id, amount, franking_credits_streamed, date, financial_year, created_at

-- trust_investments
id, trust_id, asset_type, description, cost_base, current_value, acquisition_date, created_at, updated_at

-- franking_credits
id, trust_id, financial_year, opening_balance, credits_received, credits_distributed, closing_balance, created_at, updated_at
```

### 4.3 AI Tables

```sql
-- ai_conversations
id, user_id, title, messages (jsonb), model_used, created_at, updated_at

-- ai_settings
id, user_id, provider, model, api_key_encrypted, temperature, created_at, updated_at

-- document_embeddings
id, document_id, chunk_index, content, embedding (vector), created_at
```

---

## 5. User Interface

> 📋 **Tasks reference:** `docs/tasks.md` Phase 3.8, 3.9

### 5.1 Chat Component

- Floating chat button on all pages (bottom right)
- Expandable chat panel (slide up or modal)
- Streaming responses with typing indicator
- Markdown rendering for formatted responses
- Conversation history sidebar (collapsible)
- Quick action chips for common queries:
  - "What's my net worth?"
  - "How much super cap left?"
  - "Show spending this month"
  - "Trust distribution options"

### 5.2 Model Settings

Located in Settings page:

- Provider dropdown (Anthropic, OpenAI, Google, Groq, Ollama)
- Model dropdown (updates based on provider selection)
- API key input with show/hide toggle
- Test connection button
- Temperature slider (0.0 - 1.0, default 0.7)
- Quick-switch model indicator in chat header

---

## 6. Implementation Checklist

For detailed implementation tasks, see `docs/tasks.md` Phase 3.

Summary:
1. Install Vercel AI SDK packages
2. Create model abstraction layer
3. Copy system prompt verbatim to `lib/ai/system-prompt.ts`
4. Implement all tools (personal, SMSF, trust, documents)
5. Create `/api/chat` route with streaming
6. Build chat UI with useChat hook
7. Build model settings page

---

*Generated: 31 December 2025*
