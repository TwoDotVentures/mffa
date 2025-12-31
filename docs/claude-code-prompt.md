# Moyle Family Finance App - Initial Setup

## Project Documentation

**Read these docs before starting. They work together:**

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| `docs/prd.md` | Feature requirements, data model | Understanding what each feature should do |
| `docs/tasks.md` | Implementation checklist | **Primary guide** - work through phases in order |
| `docs/ai-accountant-feature.md` | AI implementation spec | Phase 3 only - contains system prompt to copy verbatim |

### Critical Instructions

1. **Follow `docs/tasks.md` as your primary guide** - it has checkboxes for each task
2. **Tasks reference other docs** - when you see "📄 Reference: See...", read that section
3. **Phase 3 (AI Accountant)** - the system prompt in `docs/ai-accountant-feature.md` Section 3 must be copied exactly, not rewritten
4. **Australian context** - tax rates, super caps, trust rules are all AU-specific and already documented

---

## Context

Building a personal finance app for my family (2 adults, 3 kids, Brisbane). Includes:
- Personal finances
- SMSF (G & S Super Fund) 
- Family Trust (Moyle Family Trust)

Killer feature is an AI Accountant with full data access across all entities.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (fresh project - will provide credentials)
- Local development with `npm run dev`

---

## Task: Start Phase 1

Reference: `docs/tasks.md` Phase 1

### 1. Project Setup

- Initialise Next.js 14+ with App Router and TypeScript
- Configure Tailwind CSS
- Install and configure shadcn/ui
- Set up ESLint and Prettier
- Create folder structure:
  ```
  /app
    /api
    /(auth)
    /(dashboard)
  /components
    /ui
  /lib
    /supabase
    /ai
  /docs (already exists with specs)
  ```

### 2. Supabase Setup

- Install @supabase/supabase-js and @supabase/ssr
- Create `lib/supabase/client.ts` (browser client)
- Create `lib/supabase/server.ts` (server client)
- Create `.env.local` with placeholders:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ```
- I'll add my Supabase credentials after

### 3. Basic Layout

- Create app layout with sidebar navigation
- Placeholder pages for:
  - Dashboard
  - Accounts
  - Transactions
  - SMSF
  - Trust
  - AI Chat
  - Settings
- Dark mode toggle using next-themes

**Don't build auth yet** - I'll add Supabase credentials first, then we'll continue with Phase 1.3.

---

## Standards

- AU English spelling throughout (colour, analyse, optimise)
- No hype language
- TypeScript strict mode
- Prefer server components where possible
- When you reach Phase 3, copy the system prompt from `docs/ai-accountant-feature.md` - do not write a new one
