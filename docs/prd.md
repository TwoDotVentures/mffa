# Moyle Family Finance App

**Product Requirements Document | Version 3.0 | December 2025**

---

## Document Hierarchy

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `docs/prd.md` (this file) | Feature requirements, data model | Understanding what to build |
| `docs/tasks.md` | Implementation checklist | Step-by-step build guide |
| `docs/ai-accountant-feature.md` | AI implementation spec | Building Phase 3 (AI Accountant) |

---

## 1. Executive Summary

A comprehensive personal finance application for the Moyle family (2 adults, 3 children) in Brisbane. Consolidates personal finances, SMSF, and Family Trust into a single view with an AI Accountant that can answer any question about any entity.

> **KILLER FEATURE: AI Accountant**
> 
> Ask anything in plain English across all entities. "How much super cap is left?" "How should we split the trust distribution?" "What's our consolidated net worth?" Switch AI models with one click. 24/7 personal financial advisor with complete data access.
>
> 📄 **Full specification:** See `docs/ai-accountant-feature.md`

---

## 2. Family Structure

| Entity | Details |
|--------|---------|
| **Personal** | Grant Moyle, Shannon Moyle, 3 dependent children. Brisbane, QLD. Australian financial year (1 July - 30 June). |
| **SMSF** | G & S Super Fund. Corporate trustee: G & S Holdings Pty Ltd. Members: Grant & Shannon. Phase: Accumulation only. |
| **Family Trust** | Moyle Family Trust. Corporate trustee: Moyle Australia Pty Ltd. Purpose: Investment holding (dividends). Beneficiaries: Grant & Shannon only. |

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, React, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI Layer | Vercel AI SDK (model-agnostic: Claude, GPT, Gemini, Groq, Ollama) |
| Hosting | Vercel |

---

## 4. Features

### 4.1 AI Accountant (Killer Feature)

> 📄 **Full implementation details:** See `docs/ai-accountant-feature.md`
>
> That document contains:
> - Complete system prompt with all Australian tax knowledge
> - Tool definitions and parameters
> - Model provider configuration
> - Database schema for AI tables
> - UI specifications

Conversational AI with full access to all family financial data across all entities.

#### Capabilities

- Natural language queries across personal, SMSF, and trust data
- Australian tax guidance with current 2024-25 FY rates built in
- SMSF contribution tracking and compliance monitoring
- Trust distribution planning with franking credit optimisation
- Consolidated net worth across all entities
- Proactive insights and deadline reminders
- Model switching between Claude, GPT, Gemini, Groq, or local models

#### Data Access Tools

The AI uses function calling to fetch real data:

- **Personal:** transactions, spending, accounts, income, assets, liabilities, net worth, tax, deductions, budgets, CGT calculator
- **SMSF:** fund summary, contributions (with caps), investments, transactions, compliance status, tax calculator
- **Trust:** summary, income, distributions, franking credits, investments, distribution modelling
- **Documents:** RAG search across all uploaded documents

### 4.2 Personal Finance

- **Accounts:** Bank accounts, credit cards, investment accounts with balances
- **Transactions:** CSV import, auto-categorisation, search and filter
- **Income:** Salary, dividends, trust distributions, rental income per person
- **Tax:** Deduction tracking, tax estimate calculator, FY summary
- **Super:** Personal super tracking (separate from SMSF)
- **Assets:** Property, vehicles, investments with valuations
- **Liabilities:** Mortgages, loans, credit cards, HECS
- **Budgets:** Category budgets with tracking

### 4.3 SMSF Module (G & S Super Fund)

- **Fund Dashboard:** Total balance, member balances, asset allocation
- **Contributions:** Track concessional and non-concessional by member with cap monitoring
- **Carry-Forward:** Unused cap tracking from last 5 years (if TSB <$500k)
- **Investments:** Holdings register with cost base, current value, returns
- **Transactions:** Contributions, earnings, expenses, fees
- **Compliance:** Audit due dates, annual return status, SIS checklist
- **Tax:** 15% contributions tax, investment earnings tax, CGT within fund

### 4.4 Family Trust Module (Moyle Family Trust)

- **Trust Dashboard:** Income YTD, expenses, distributable amount
- **Income Tracking:** Dividends received with franking credits attached
- **Franking Credits:** Running balance, streaming options
- **Distributions:** History by beneficiary, amounts, dates
- **Distribution Modelling:** Scenario planning between Grant & Shannon
- **Investments:** Trust-held assets and valuations
- **Deadlines:** 30 June distribution reminder
- **Section 100A:** Awareness prompts (N/A with only G & S as beneficiaries)

### 4.5 Documents & Storage

- Upload statements, receipts, trust deeds, SMSF investment strategy
- Categorise by entity (personal, SMSF, trust) and type
- Vector embeddings for AI search
- Link documents to transactions

### 4.6 Dashboards & Reporting

- **Personal Dashboard:** Net worth, cash flow, budget status
- **SMSF Dashboard:** Fund balance, contributions vs caps, compliance status
- **Trust Dashboard:** Income, franking credits, distribution status
- **Consolidated View:** Total net worth across all entities
- **Tax Prep:** FY summary ready for accountant

---

## 5. Data Model

### 5.1 Personal Finance Tables

- users, family_members, accounts, transactions, categories
- income, deductions, assets, liabilities, budgets
- super_contributions (personal super, separate from SMSF)

### 5.2 SMSF Tables

- smsf_funds, smsf_members, smsf_contributions
- smsf_investments, smsf_transactions, smsf_compliance
- smsf_contribution_caps (track carry-forward availability)

### 5.3 Family Trust Tables

- trusts, trust_beneficiaries, trust_income
- trust_distributions, trust_investments, trust_transactions
- franking_credits (running balance and streaming)

### 5.4 AI & Document Tables

> 📄 **Detailed schema:** See `docs/ai-accountant-feature.md` Section 4

- ai_conversations, ai_settings
- documents, document_embeddings
- notifications

---

## 6. Success Metrics

- AI Accountant accuracy >90% for data retrieval questions
- All transactions categorised within 24 hours of import
- Tax prep package generated within 5 minutes
- SMSF contribution caps tracked accurately with carry-forward
- Trust distribution reminder sent 30 days before 30 June
- Weekly engagement from at least one family member

---

*Generated: 31 December 2025*
