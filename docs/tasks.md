# Moyle Family Finance App

**Implementation Task List | Version 3.0 | December 2025**

---

## How to Use This Document

This is the **primary implementation guide**. Work through phases in order.

**Cross-references:**
- `docs/prd.md` - Feature requirements and data model (consult for "what to build")
- `docs/ai-accountant-feature.md` - AI implementation details (consult for Phase 3)

**Checkboxes:** Mark tasks complete as you go. Each phase ends with a checkpoint.

---

## Phase 1: Foundation

### 1.1 Project Setup

- [ ] Create Next.js 14+ project with App Router
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Set up ESLint and Prettier
- [ ] Create GitHub repository
- [ ] Deploy to Vercel

### 1.2 Supabase Configuration

- [ ] Connect to fresh Supabase project
- [ ] Configure environment variables
- [ ] Set up Supabase client (server and client components)
- [ ] Enable Row Level Security

### 1.3 Authentication

- [ ] Implement Supabase Auth
- [ ] Create login page (Google OAuth only)
- [ ] Add auth middleware
- [ ] Create users and family_members tables

> **CHECKPOINT:** Authenticated app deployed with database connected

---

## Phase 2: Core Financial Features

> 📄 **Reference:** See `docs/prd.md` Section 4.2 (Personal Finance) for feature requirements

### 2.1 Accounts

- [ ] Create accounts table (bank, credit, investment)
- [ ] Build account list page
- [ ] Add/edit account forms
- [ ] Display balances

### 2.2 Transactions

- [ ] Create transactions and categories tables
- [ ] Build transaction list with filters
- [ ] Implement CSV import
- [ ] Add manual transaction entry
- [ ] Build auto-categorisation rules

> **CHECKPOINT:** Can import bank statements and view categorised transactions

---

## Phase 3: AI Accountant (Killer Feature) ⭐

> 📄 **CRITICAL:** This entire phase references `docs/ai-accountant-feature.md`
> 
> That document contains:
> - Complete system prompt (Section 3) - **copy verbatim, do not rewrite**
> - Tool definitions and parameters (Section 2.2)
> - Model provider configuration (Section 2.1)
> - Database schema for AI tables (Section 4)
> - UI specifications (Section 5)

### 3.1 AI Infrastructure

- [ ] Install Vercel AI SDK (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google)
- [ ] Create model abstraction layer (`lib/ai/providers.ts`) - see `ai-accountant-feature.md` Section 2.1 for provider list
- [ ] Create ai_settings table (provider, model, api_key_encrypted, temperature)
- [ ] Create ai_conversations table (messages, timestamps)
- [ ] Implement encrypted API key storage

### 3.2 System Prompt

> ⚠️ **DO NOT write a new system prompt.** Copy the complete prompt from `docs/ai-accountant-feature.md` Section 3.

- [ ] Create `lib/ai/system-prompt.ts`
- [ ] Copy system prompt verbatim from `docs/ai-accountant-feature.md` Section 3
- [ ] Store server-side only (never expose to client)
- [ ] Verify all tax rates, super caps, and rules match the spec

### 3.3 Personal Finance Tools

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 2.2 (Personal Finance Tools) for parameters

- [ ] get_transactions - Query with date, category, amount filters
- [ ] get_spending_summary - Aggregate by category/merchant/period
- [ ] get_accounts - All accounts with balances
- [ ] get_income - By person and type
- [ ] get_assets / get_liabilities - Asset register
- [ ] get_net_worth - Calculated position
- [ ] get_tax_summary - FY income and deductions
- [ ] get_deductions - Deductible expenses
- [ ] get_budgets - Budget vs actual
- [ ] calculate_tax - Tax calculator with current rates
- [ ] calculate_cgt - CGT with 12-month discount

### 3.4 SMSF Tools

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 2.2 (SMSF Tools) for parameters

- [ ] get_smsf_summary - Fund balance, member balances, allocation
- [ ] get_smsf_contributions - By member with cap tracking and carry-forward
- [ ] get_smsf_investments - Holdings with cost base and returns
- [ ] get_smsf_transactions - Fund transactions
- [ ] get_smsf_compliance - Audit status, lodgement, SIS compliance
- [ ] calculate_smsf_tax - 15% contributions tax, CGT within fund

### 3.5 Family Trust Tools

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 2.2 (Family Trust Tools) for parameters

- [ ] get_trust_summary - Income, expenses, distributable amount
- [ ] get_trust_income - Dividends with franking credits
- [ ] get_trust_distributions - History by beneficiary
- [ ] get_franking_credits - Balance and streaming options
- [ ] get_trust_investments - Trust-held assets
- [ ] calculate_distribution - Model scenarios between Grant & Shannon

### 3.6 Document Search Tool

- [ ] search_documents - RAG search across all uploaded docs
- [ ] Filter by entity (personal, SMSF, trust) and doc type

### 3.7 Chat API Route

- [ ] Create /api/chat POST route
- [ ] Implement streamText with tool calling
- [ ] Set maxSteps: 10 for multi-tool chains
- [ ] Inject system prompt from `lib/ai/system-prompt.ts` (server-side only)
- [ ] Persist conversations to database
- [ ] Add error handling and rate limiting

### 3.8 Chat UI

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 5 for UI specifications

- [ ] Build chat component with useChat hook
- [ ] Add floating chat button (all pages)
- [ ] Implement streaming with typing indicator
- [ ] Render markdown responses
- [ ] Add conversation history sidebar
- [ ] Show current model indicator
- [ ] Add quick action chips for common queries

### 3.9 Model Settings

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 2.1 for provider/model list

- [ ] Build settings page for AI configuration
- [ ] Provider dropdown (Anthropic, OpenAI, Google, Groq, Ollama)
- [ ] Model dropdown per provider
- [ ] API key input with show/hide toggle
- [ ] Test connection button
- [ ] Temperature slider
- [ ] Quick-switch model from chat interface

> **CHECKPOINT:** AI Accountant functional - can ask questions about personal finances, switch models, get data-backed answers

---

## Phase 4: SMSF Module

> 📄 **Reference:** See `docs/prd.md` Section 4.3 (SMSF Module) for feature requirements

### 4.1 SMSF Database

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 4.1 for table structure

- [ ] Create smsf_funds table (name, ABN, trustee, establishment_date)
- [ ] Create smsf_members table (member_id, name, TFN, preservation_age, TSB)
- [ ] Create smsf_contributions table (member, type, amount, date, FY)
- [ ] Create smsf_investments table (asset_type, description, cost_base, current_value)
- [ ] Create smsf_transactions table (type, amount, date, description)
- [ ] Create smsf_compliance table (audit_date, lodgement_date, status)

### 4.2 SMSF UI

- [ ] SMSF dashboard with fund balance and member breakdown
- [ ] Contribution tracker with cap visualisation
- [ ] Carry-forward cap calculator
- [ ] Investment register with performance
- [ ] Transaction history
- [ ] Compliance checklist and reminders

> **CHECKPOINT:** SMSF dashboard live, contributions tracked with cap monitoring

---

## Phase 5: Family Trust Module

> 📄 **Reference:** See `docs/prd.md` Section 4.4 (Family Trust Module) for feature requirements

### 5.1 Trust Database

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 4.2 for table structure

- [ ] Create trusts table (name, ABN, trustee, establishment_date)
- [ ] Create trust_beneficiaries table (trust_id, name, type)
- [ ] Create trust_income table (source, amount, franking_credits, date)
- [ ] Create trust_distributions table (beneficiary, amount, franking_streamed, date)
- [ ] Create trust_investments table (asset_type, description, cost_base, current_value)
- [ ] Create franking_credits table (running balance, streaming history)

### 5.2 Trust UI

- [ ] Trust dashboard with income YTD and distributable amount
- [ ] Dividend income log with franking credit tracking
- [ ] Distribution modeller (scenario: 50/50, 70/30, etc.)
- [ ] Distribution history by beneficiary
- [ ] 30 June deadline reminder
- [ ] Franking credit streaming helper

> **CHECKPOINT:** Trust dashboard live, can model distributions and track franking credits

---

## Phase 6: Tax & Personal Super

> 📄 **Reference:** See `docs/prd.md` Section 4.2 for feature requirements

### 6.1 Income Tracking

- [ ] Create income table (type, amount, person, date, FY)
- [ ] Track salary, dividends, trust distributions, rental
- [ ] Link trust distributions to personal income

### 6.2 Deductions

- [ ] Create deductions table (category, amount, description, FY)
- [ ] Auto-flag potential deductions from transactions
- [ ] WFH calculator (67c/hour)

### 6.3 Tax Estimation

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 3 (System Prompt) for 2024-25 tax rates

- [ ] Build tax calculator with 2024-25 rates (copy from system prompt)
- [ ] Include Medicare levy and surcharge
- [ ] Factor in franking credit refunds
- [ ] HECS repayment calculator

### 6.4 Personal Super (Non-SMSF)

- [ ] Create super_contributions table for personal super accounts
- [ ] Track employer SG and salary sacrifice
- [ ] Cap monitoring (same limits as SMSF)

> **CHECKPOINT:** Can track income, deductions, estimate tax, and monitor super caps

---

## Phase 7: Assets & Net Worth

> 📄 **Reference:** See `docs/prd.md` Section 4.2 for feature requirements

### 7.1 Asset Register

- [ ] Create assets table (type, description, value, cost_base, owner)
- [ ] Track property, vehicles, investments, collectibles
- [ ] Manual valuation updates
- [ ] CGT cost base tracking

### 7.2 Liabilities

- [ ] Create liabilities table (type, balance, interest_rate, owner)
- [ ] Track mortgages, car loans, credit cards, HECS
- [ ] Link to accounts where applicable

### 7.3 Net Worth Dashboard

- [ ] Personal net worth calculator
- [ ] Consolidated net worth (personal + SMSF share + trust share)
- [ ] Historical tracking and charts
- [ ] Note: SMSF assets locked until preservation

> **CHECKPOINT:** Full net worth view across all entities

---

## Phase 8: Budgeting & Documents

> 📄 **Reference:** See `docs/prd.md` Sections 4.5 and 4.6 for feature requirements

### 8.1 Budgets

- [ ] Create budgets table (category, amount, period)
- [ ] Budget vs actual tracking
- [ ] Alerts when approaching limit

### 8.2 Document Storage

> 📄 **Reference:** See `docs/ai-accountant-feature.md` Section 4.3 for AI tables including document_embeddings

- [ ] Create documents table with Supabase Storage
- [ ] Upload statements, receipts, trust deeds, SMSF docs
- [ ] Categorise by entity (personal, SMSF, trust)
- [ ] Create document_embeddings table for vector storage
- [ ] Implement embedding generation on upload
- [ ] Link documents to transactions

### 8.3 Notifications

- [ ] Create notifications table
- [ ] 30 June trust distribution reminder
- [ ] Super cap approaching warnings
- [ ] SMSF audit due reminder
- [ ] Budget alerts

> **CHECKPOINT:** Full app complete - all entities tracked, AI functional, documents searchable

---

*Generated: 31 December 2025*
