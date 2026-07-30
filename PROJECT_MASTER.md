# PROJECT_MASTER.md
## HR Project — AI Recruitment SaaS Platform
### Single Source of Truth

> **Last updated:** 2026-05-14
> **Current phase:** Phase 12 — COMPLETE ✅
> **Status:** MVP COMPLETE — Ready for Supabase + Vercel deployment

---

## 1. PROJECT VISION

An AI-powered Recruitment SaaS that combines:
- **ATS** (Applicant Tracking System)
- **CRM** for recruiters
- **WhatsApp AI recruiter agent** — conducts interviews, evaluates candidates
- **AI scoring engine** — CV parsing, consistency detection, scoring
- **Assignment engine** — generation, submission, AI evaluation

**Goal:** Help recruiters save screening time, improve hiring accuracy, and automate repetitive tasks.

---

## 2. MVP DEFINITION

The minimum viable product includes:

| Feature | Status |
|---|---|
| Recruiter auth + organization | Phase 3 |
| Job creation with AI assistant | Phase 5 |
| Candidate form + CV upload | Phase 6 |
| WhatsApp AI screening interview | Phase 7 |
| AI scoring + summaries | Phase 8 |
| Recruiter CRM + conversation view | Phase 10 |

**Not in MVP:** Assignments, analytics dashboard, advanced anti-cheating, multi-org billing.

---

## 3. CURRENT ARCHITECTURE

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| AI | Anthropic Claude (default), OpenAI (fallback), multi-provider abstraction |
| Messaging | Twilio WhatsApp (default), Meta WhatsApp Business API (optional) |
| Deployment | Vercel |
| Version Control | Git |

### Architecture Principles
- **AI-provider agnostic** — all AI calls go through `src/lib/ai/providers/index.ts`
- **WhatsApp-provider agnostic** — all WA calls go through `src/lib/whatsapp/index.ts`
- **Server-first** — Next.js Server Components and Server Actions for data fetching
- **Supabase RLS** — Row Level Security enforces multi-org data isolation
- **Feature flags** — `NEXT_PUBLIC_FEATURE_*` env vars gate unfinished features

---

## 4. FOLDER STRUCTURE

```
hr-project/
├── PROJECT_MASTER.md           ← You are here
├── .env.example                ← All env vars documented
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Public auth routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # Protected recruiter dashboard
│   │   │   ├── dashboard/
│   │   │   ├── jobs/[jobId]/
│   │   │   ├── candidates/[candidateId]/
│   │   │   ├── conversations/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── candidate/[jobSlug]/  # Public candidate-facing flow
│   │   ├── api/
│   │   │   ├── webhooks/whatsapp/  # Twilio + Meta inbound webhooks
│   │   │   ├── webhooks/ai/
│   │   │   ├── ai/chat/
│   │   │   ├── ai/score/
│   │   │   ├── jobs/
│   │   │   ├── candidates/
│   │   │   └── assignments/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Redirects → /login
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                 # Generic: Button, Badge, Card, Input, Modal
│   │   ├── layout/             # Sidebar, Header, PageWrapper
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── jobs/               # JobCard, JobForm, JobWizard
│   │   ├── candidates/         # CandidateCard, CandidateTable, ScoreBar
│   │   ├── conversations/      # ChatThread, MessageBubble, TakeoverButton
│   │   └── forms/              # Reusable form components
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client (singleton)
│   │   │   ├── server.ts       # Server client + admin client
│   │   │   └── middleware.ts   # Session refresh middleware
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── index.ts    # Router: callAI()
│   │   │   ├── agents/         # Phase 7+: recruiter-agent, scoring-agent
│   │   │   └── prompts/
│   │   │       └── v1/index.ts  # Versioned prompt library
│   │   ├── whatsapp/
│   │   │   ├── providers/
│   │   │   │   ├── twilio.ts
│   │   │   │   └── meta.ts
│   │   │   └── index.ts        # Router: sendWhatsAppMessage()
│   │   ├── validators/         # Zod schemas (Phase 3+)
│   │   ├── utils/index.ts      # cn(), formatDate(), slugify(), apiSuccess()
│   │   └── constants.ts        # App-wide constants
│   │
│   ├── hooks/                  # React hooks (Phase 4+)
│   ├── types/
│   │   ├── index.ts            # Core domain types
│   │   └── database.ts         # Supabase generated types (placeholder)
│   └── middleware.ts           # Next.js middleware — session refresh + auth guard
│
├── supabase/
│   ├── migrations/             # SQL migrations (Phase 2)
│   └── functions/              # Edge Functions (Phase 7+)
│
└── docs/
    ├── architecture.md
    ├── api.md
    └── deployment.md
```

---

## 5. COMPLETED FEATURES

### Phase 12 — Security & Production Hardening ✅ (2026-05-14)
- [x] `src/lib/security/rate-limiter.ts` — sliding-window rate limiter (Map-based, Upstash-ready); profiles: AUTH (10/min), APPLY (5/min), AI (20/min), WEBHOOK (120/min), GENERAL (60/min)
- [x] `src/lib/security/api-guard.ts` — `apiGuard()` helper: rate limit + auth check in one call; adds `Retry-After` + `X-RateLimit-*` headers on 429
- [x] `src/lib/security/api-error-handler.ts` — `withErrorHandler()` / `safeHandler()` wrappers: catch unhandled errors, structured server-side logging, no stack traces in production
- [x] `src/lib/security/audit-logger.ts` — `auditLog()` / `auditLogAsync()`: writes to `audit_logs` table; typed `AuditAction` enum; failures never break primary operation
- [x] `src/lib/security/env-validator.ts` — `validateEnv()` + `assertEnv()`: validates all env vars against schema at startup; throws in production if required vars missing
- [x] `src/instrumentation.ts` — Next.js startup hook: calls `assertEnv()` on Node.js runtime
- [x] `next.config.ts` — security headers: CSP, HSTS (prod), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] `src/middleware.ts` — rate limiting wired into middleware for auth/apply/webhook paths; auth guard preserved
- [x] `GET /api/health` — health check endpoint: DB ping, env validation status, latency, version
- [x] `src/lib/security/index.ts` — barrel export for entire security module

### Phase 11 — Analytics Dashboard ✅ (2026-05-14)
- [x] `GET /api/analytics/overview` — org KPIs: total/active candidates, hired, avg AI score, conversion rate, WhatsApp interviews, assignments
- [x] `GET /api/analytics/pipeline` — pipeline funnel per stage, score distribution (5 buckets), 30-day application timeline
- [x] `GET /api/analytics/jobs` — per-job stats: total/shortlisted/hired/rejected candidates, average AI score
- [x] `src/app/(dashboard)/analytics/page.tsx` — full analytics dashboard: 8 KPI cards, horizontal bar funnel chart, score distribution bar chart, SVG sparkline timeline, jobs performance table — all pure CSS/SVG (no external chart library)

### Phase 10 — CRM System ✅ (2026-05-14)
- [x] `supabase/migrations/000013_candidate_notes.sql` — `candidate_notes` table with RLS: recruiter_id, candidate_id, content, timestamps
- [x] `GET /api/candidates/list` — paginated, filtered candidate list (search by name/email/phone, filter by status, job_id, pagination)
- [x] `GET /api/candidates/[id]` — full candidate detail: profile + job + WhatsApp messages + notes
- [x] `PATCH /api/candidates/[id]` — update pipeline status
- [x] `GET /api/candidates/[id]/notes` — list notes with recruiter info
- [x] `POST /api/candidates/[id]/notes` — add recruiter note
- [x] `DELETE /api/candidates/[id]/notes?note_id=` — delete own note
- [x] `GET /api/conversations` — list candidates with WhatsApp activity, search + status filter
- [x] `GET /api/conversations/[candidateId]` — full WhatsApp thread for a candidate
- [x] `src/app/(dashboard)/candidates/[candidateId]/page.tsx` — full CRM profile page: contact info, AI score bar, pipeline status dropdown, tabs (overview / conversation / notes), CV parsed data, cover letter, screening answers
- [x] `src/app/(dashboard)/conversations/page.tsx` — conversation center: split-pane (list + thread), live search, status badges, read-only thread view with AI/recruiter labels
- [x] `src/app/(dashboard)/candidates/page.tsx` — updated to real Supabase data with search, status filters, pagination, click-to-profile
- [x] `src/types/database.ts` — added `candidate_notes` Row/Insert/Update types

### Phase 9 — Assignment Engine ✅ (2026-05-14)
- [x] `supabase/migrations/000012` — adds `evaluation_criteria` (jsonb) + `submission_metadata` (jsonb) to assignments
- [x] `src/lib/ai/prompts/v1` — `ASSIGNMENT_GENERATOR` improved (candidate-specific, personalised); `ASSIGNMENT_EVALUATOR` added (anti-cheat detection, criteria_scores, Hebrew summary)
- [x] `src/lib/ai/agents/assignment-generator.ts` — `generateAssignment()`: loads candidate + job, calls AI, persists assignment row, updates candidate status to `assignment_sent`
- [x] `src/lib/ai/agents/assignment-evaluator.ts` — `evaluateAssignment()`: loads submission, calculates time taken, anti-cheat flags, calls AI evaluator, persists result, updates candidate to `shortlisted`/`rejected`
- [x] `POST /api/assignments` — recruiter creates AI-generated assignment for a candidate
- [x] `GET/PATCH /api/assignments/[id]` — public GET for candidate page; PATCH marks as sent
- [x] `POST /api/assignments/[id]/submit` — public candidate submission: text + URL + file upload to `assignment-submissions` bucket + anti-cheat metadata
- [x] `POST /api/assignments/[id]/evaluate` — recruiter triggers AI evaluation
- [x] `src/app/assignment/[assignmentId]/page.tsx` — public RTL submission page: assignment display, text area, URL input, file upload, live countdown timer

### Phase 8 — AI Scoring Engine ✅ (2026-05-14)
- [x] `src/lib/ai/agents/cv-parser.ts` — `parseCV(url)`: PDF → base64 to Claude document API; DOC/DOCX → text extraction fallback; returns `CVParsedData` (skills, experience_years, education, previous_roles, languages)
- [x] `src/lib/ai/prompts/v1/index.ts` — `CANDIDATE_SCORER` prompt updated: inconsistency detection, rejection rule enforcement, Hebrew summary, JSON response with `inconsistencies[]`
- [x] `src/lib/ai/agents/scorer.ts` — `scoreCandidate(candidateId)`: loads candidate + job + transcript, calls CV parser if needed, calls AI, persists `ai_score` + `ai_summary` on candidate, logs token usage
- [x] `POST /api/ai/score` — authenticated endpoint to trigger scoring manually; org-scoped guard
- [x] `src/lib/ai/agents/recruiter-agent.ts` — auto-scores candidate when interview completes (fire-and-forget), sends Telegram with real score

### Phase 7 — WhatsApp AI Recruiter ✅ (2026-05-14)
- [x] `src/lib/ai/agents/context.ts` — `loadContext()`, `saveContext()`, `appendMessage()`, `loadTranscript()` — DB helpers for per-candidate interview state
- [x] `src/lib/ai/prompts/v1/index.ts` — `WHATSAPP_RECRUITER` prompt updated: state injection (current question index, rejection rules), JSON response format (`message`, `action`, `rejection_reason`)
- [x] `src/lib/ai/agents/recruiter-agent.ts` — `processInboundMessage()`: find candidate by phone, dedup by provider ID, load job + org, build AI prompt with full state, parse JSON response, handle `continue` / `complete` / `reject` actions, persist inbound + outbound messages, update status, Telegram notification on completion
- [x] `POST /api/webhooks/whatsapp/twilio` — Twilio TwiML webhook with HMAC signature verification
- [x] `GET/POST /api/webhooks/whatsapp/meta` — Meta webhook: GET for hub verification, POST for inbound messages
- [x] `.env.example` — added `META_WEBHOOK_VERIFY_TOKEN`, `TWILIO_WEBHOOK_URL`

### Phase 6 — Candidate System ✅ (2026-05-14)
- [x] `src/lib/validators/candidate.ts` — Zod schema: `applyJobSchema` (full_name, email, phone, linkedin, portfolio, cover_letter, screening_answers, whatsapp_consent)
- [x] `GET /api/jobs/[id]/public` — public job data for active jobs (no auth, anon-safe)
- [x] `POST /api/candidates` — multipart form: insert candidate + CV upload to `cv-uploads` bucket
- [x] Duplicate detection: 409 on `(job_id, email)` unique constraint violation
- [x] `src/app/candidate/[jobSlug]/page.tsx` — public RTL application form with: personal details, CV upload (drag target), cover letter, dynamic screening questions (yes/no, numeric, open), WhatsApp consent checkbox, success screen
- [x] `supabase/migrations/20260514000011_candidate_application_fields.sql` — adds linkedin_url, portfolio_url, cover_letter, whatsapp_consent, screening_answers, source to candidates table
- [x] `src/types/database.ts` — candidates Row/Insert/Update updated with new fields

### Phase 5 — Job Creation System ✅ (2026-05-13)
- [x] `src/lib/validators/job.ts` — Zod schemas: createJob, screeningQuestion, rejectionRule
- [x] `GET /api/jobs` — list with pagination + status filter
- [x] `POST /api/jobs` — create with org scoping + slug generation
- [x] `GET/PATCH/DELETE /api/jobs/[id]` — soft delete (archived)
- [x] `POST /api/ai/job-description` — AI JD generator + token logging
- [x] Job creation wizard — 4 steps: basic info → description → questions → rules
- [x] AI "כתוב עם AI" button in step 2
- [x] Screening questions builder — type, weight, required
- [x] Rejection rules builder — field, operator, value, reason
- [x] Job detail page — stats, description, questions, candidate link

### Phase 4 — Recruiter Dashboard UI ✅ (2026-05-13)
- [x] `src/components/ui/` — Button, Badge, Card, Input, Avatar, StatCard
- [x] `src/components/layout/Sidebar.tsx` — ניווט עם collapse, logout
- [x] `src/components/layout/Header.tsx` — חיפוש, notifications, פרופיל משתמש
- [x] `src/app/(dashboard)/layout.tsx` — layout wrapper עם sidebar
- [x] Dashboard home — 4 stat cards, טבלת מועמדים אחרונים, טבלת משרות פעילות
- [x] Jobs page — טבלה עם פילטרים, סטטוס, מיקום, מחלקה
- [x] Candidates page — טבלה עם ציון AI, שלב בצינור, פאגינציה
- [x] Placeholder pages: conversations, analytics, settings

### Phase 3 — Authentication & Organizations ✅ (2026-05-13)
- [x] `src/lib/validators/auth.ts` — Zod schemas: login, register, organization
- [x] `src/lib/auth/actions.ts` — Server Actions: login, register+org, logout, invite
- [x] Login page — Hebrew UI, error handling, redirect
- [x] Register page — 2-step wizard (account → organization), auto-slug
- [x] `src/hooks/useAuth.ts` — client-side auth state hook
- [x] `src/middleware.ts` — updated: protected routes + redirect from auth pages when logged in
- [x] `src/lib/notifications/telegram.ts` — Telegram Bot utility + notification templates
- [x] `.env.example` — added `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- [x] `handle_new_user` trigger wired: first user becomes `super_admin`

### Phase 2 — Database Architecture ✅ (2026-05-13)
- [x] 10 migration files covering all tables, RLS, storage
- [x] 9 PostgreSQL enum types
- [x] Multi-tenant RLS with `get_current_org_id()` helper
- [x] `handle_new_user` trigger for auto-profile creation
- [x] `cv-uploads` and `assignment-submissions` storage buckets
- [x] `src/types/database.ts` updated with full typed schema
- [x] Append-only `ai_usage_logs` and `audit_logs`

### Phase 1 — Project Initialization ✅ (2026-05-13)
- [x] Git initialized
- [x] Full folder structure created
- [x] `package.json` with all dependencies
- [x] `tsconfig.json` with path aliases (`@/*`)
- [x] `next.config.ts`
- [x] `tailwind.config.ts` — light/professional theme, primary blue, status colors
- [x] `.env.example` — all env vars documented with comments
- [x] `.gitignore`
- [x] `src/types/index.ts` — full domain type system
- [x] `src/types/database.ts` — Supabase types placeholder
- [x] `src/lib/supabase/client.ts` — browser client singleton
- [x] `src/lib/supabase/server.ts` — server + admin clients
- [x] `src/lib/supabase/middleware.ts` — session refresh + auth guard
- [x] `src/lib/ai/providers/anthropic.ts` — Claude integration
- [x] `src/lib/ai/providers/openai.ts` — GPT fallback
- [x] `src/lib/ai/providers/index.ts` — provider router `callAI()`
- [x] `src/lib/ai/prompts/v1/index.ts` — versioned prompt library
- [x] `src/lib/whatsapp/providers/twilio.ts`
- [x] `src/lib/whatsapp/providers/meta.ts`
- [x] `src/lib/whatsapp/index.ts` — provider router `sendWhatsAppMessage()`
- [x] `src/lib/utils/index.ts` — `cn()`, `formatDate()`, `slugify()`, API helpers
- [x] `src/lib/constants.ts`
- [x] `src/app/layout.tsx` + `globals.css`
- [x] `src/app/page.tsx` — redirects to `/login`
- [x] `src/middleware.ts` — Next.js middleware
- [x] Placeholder login + dashboard pages

---

## 6. PENDING FEATURES (ROADMAP)

| Phase | Description | Status |
|---|---|---|
| Phase 2 | Database schema + migrations + Supabase policies | ✅ Complete |
| Phase 3 | Recruiter auth + organization + roles + sessions | ✅ Complete |
| Phase 4 | Recruiter dashboard UI — sidebar, widgets, tables | ✅ Complete |
| Phase 5 | Job creation — AI assistant, wizard, questions, assignments | ✅ Complete |
| Phase 6 | Candidate system — form, CV upload, WhatsApp transition | ✅ Complete |
| Phase 7 | WhatsApp AI recruiter — Twilio/Meta, dynamic interviewing, rejection | ✅ Complete |
| Phase 8 | AI scoring engine — CV parsing, inconsistency detection, summaries | ✅ Complete |
| Phase 9 | Assignment engine — generation, submission, evaluation, anti-cheat | ✅ Complete |
| Phase 10 | CRM — candidate cards, notes, conversation center, filters | ✅ Complete |
| Phase 11 | Analytics dashboard | ✅ Complete |
| Phase 12 | Security audit, rate limiting, logging, production hardening | ✅ Complete |

---

## 7. DATABASE SCHEMA PROGRESS

**Status:** Complete ✅ — Phase 2

### Migrations (supabase/migrations/)

| File | Contents |
|---|---|
| `000001_extensions_and_enums.sql` | `uuid-ossp`, `pg_trgm`, all 9 enum types |
| `000002_organizations.sql` | `organizations` table, `set_updated_at()` trigger fn |
| `000003_recruiter_profiles.sql` | `recruiter_profiles`, `get_current_org_id()`, `get_current_user_role()`, `handle_new_user` trigger |
| `000004_jobs.sql` | `jobs` table, FTS index |
| `000005_candidates.sql` | `candidates` table, trigram index on name |
| `000006_whatsapp.sql` | `whatsapp_messages`, `conversation_contexts` |
| `000007_assignments.sql` | `assignments` table |
| `000008_logs.sql` | `ai_usage_logs`, `audit_logs` |
| `000009_rls_policies.sql` | All RLS policies for every table |
| `000010_storage.sql` | `cv-uploads` and `assignment-submissions` buckets + policies |
| `000011_candidate_application_fields.sql` | linkedin_url, portfolio_url, cover_letter, whatsapp_consent, screening_answers, source added to candidates |

### Tables

| Table | Description |
|---|---|
| `organizations` | Multi-tenant root — every row belongs to an org |
| `recruiter_profiles` | Extends `auth.users`, one per recruiter |
| `jobs` | Job postings with embedded screening questions + rejection rules (JSONB) |
| `candidates` | Applicants, CV data, AI score, pipeline status |
| `whatsapp_messages` | Full message history (inbound + outbound), immutable |
| `conversation_contexts` | AI agent state per candidate interview |
| `assignments` | Home assignments sent to candidates |
| `ai_usage_logs` | Token usage per AI call, append-only |
| `audit_logs` | All recruiter actions, append-only |

### RLS Design

- `get_current_org_id()` — helper returning the org of the logged-in user
- `get_current_user_role()` — helper returning the role
- All tables locked by org isolation
- `anon` role can: read active jobs, insert candidates, upload CVs
- `viewer` role is read-only across all tables
- Webhook handlers use service role (bypasses RLS)

### Storage Buckets

| Bucket | Max size | Allowed types |
|---|---|---|
| `cv-uploads` | 10 MB | PDF, DOC, DOCX |
| `assignment-submissions` | 50 MB | PDF, ZIP, TXT, XLSX, DOCX, PNG, JPG |

---

## 8. API INTEGRATIONS

| Integration | Status | Notes |
|---|---|---|
| Supabase | Configured (no credentials yet) | Fill `.env.local` to activate |
| Anthropic Claude | Configured | `ANTHROPIC_API_KEY` required |
| OpenAI | Configured (fallback) | `OPENAI_API_KEY` required |
| Twilio WhatsApp | Configured | Credentials required — Phase 7 |
| Meta WhatsApp | Configured | Credentials required — Phase 7 |
| Vercel | Not configured | Deployment — Phase 12 |

---

## 9. AI ARCHITECTURE

### Provider System
- All AI calls go through `callAI(messages, options)` in `src/lib/ai/providers/index.ts`
- Provider selected via `options.provider` or `AI_DEFAULT_PROVIDER` env var
- Default: Anthropic Claude (`claude-sonnet-4-6`)

### Prompt Versioning
- All prompts live in `src/lib/ai/prompts/v[N]/index.ts`
- Use `fillPrompt(key, variables)` to render prompts
- Never edit a versioned prompt in place — create a new version
- **Active version:** v1

### Prompts in v1
| Key | Purpose |
|---|---|
| `WHATSAPP_RECRUITER` | AI interviewer for WhatsApp screening |
| `CV_PARSER` | Extract structured data from CV text |
| `CANDIDATE_SCORER` | Score candidate 0–100 post-interview |
| `JOB_DESCRIPTION_GENERATOR` | AI-assisted JD writing |
| `ASSIGNMENT_GENERATOR` | Generate home assignments |

### AI Agents (Phase 7+)
- `recruiter-agent.ts` — conducts WhatsApp interviews, manages conversation state
- `scoring-agent.ts` — evaluates candidates, generates summaries

### Cost Optimization (Phase 7+)
- Use `haiku` model for simple classification tasks
- Use `sonnet` for complex reasoning (scoring, summarization)
- Cache Supabase-fetched context to avoid redundant DB reads per message
- Log token usage in `ai_usage_logs` table for cost tracking

---

## 10. WHATSAPP ARCHITECTURE

### Provider Abstraction
- All sends go through `sendWhatsAppMessage()` in `src/lib/whatsapp/index.ts`
- Provider selected via `WHATSAPP_PROVIDER` env var (`twilio` | `meta`)

### Inbound Flow (Phase 7)
1. Webhook hits `/api/webhooks/whatsapp`
2. Payload normalized (Twilio or Meta format → internal format)
3. Candidate looked up by phone number
4. Conversation context loaded from DB
5. AI agent generates next message
6. Response sent via `sendWhatsAppMessage()`
7. Message saved to DB

### Human Takeover
- `is_ai_active = false` on candidate record disables AI responses
- Recruiter can toggle AI/manual mode from CRM
- Manual messages sent via `/api/candidates/[id]/message`

---

## 11. SECURITY CONSIDERATIONS

- `.env.local` is gitignored — credentials never committed
- Supabase RLS will enforce org-level data isolation (Phase 2)
- Webhook endpoints will validate signatures (Twilio HMAC, Meta verify token)
- Admin client (service role) only used in trusted server-side paths
- Rate limiting on public endpoints (Phase 12)
- Candidate data must not be sent to third-party AI without consent consideration
- Audit log table planned for all recruiter actions (Phase 12)

---

## 12. DEPLOYMENT STRATEGY

| Environment | Platform | Status |
|---|---|---|
| Local dev | `npm run dev` | Ready after `npm install` |
| Preview | Vercel preview deployments | Phase 12 |
| Production | Vercel + Supabase hosted | Phase 12 |

**Before deploying:** Complete security checklist in Phase 12.

---

## 13. ENVIRONMENT VARIABLES

See `.env.example` for full documentation. Required before running:

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Any DB operation |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Any DB operation |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin server operations |
| `ANTHROPIC_API_KEY` | AI features |
| `TWILIO_*` | WhatsApp (Phase 7) |

---

## 14. TECHNICAL DECISIONS

| Decision | Choice | Rationale |
|---|---|---|
| App Router vs Pages | App Router | Server Components, better DX, streaming |
| Supabase vs custom backend | Supabase | Built-in auth, RLS, storage, real-time |
| AI abstraction layer | Custom thin wrapper | Avoid vendor lock-in, easy provider swap |
| WhatsApp provider abstraction | Custom thin wrapper | Support Twilio sandbox now, Meta later |
| Prompt versioning | Folder-based (`v1/`, `v2/`) | Simple, readable, no DB dependency |
| UI direction | Light/professional | Enterprise SaaS feel (Greenhouse/Lever style) |
| Styling | Tailwind + `cn()` | Consistent, composable, no CSS-in-JS overhead |
| TypeScript | Strict mode | Catch errors early, self-documenting types |

---

## 15. KNOWN ISSUES

_None at this stage. Phase 1 is scaffolding only._

---

## 16. QA CHECKLIST (per phase)

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No console errors in browser
- [ ] Environment variables validated at startup
- [ ] API routes return correct status codes
- [ ] RLS policies tested with different org users
- [ ] WhatsApp webhook signature validation active
- [ ] AI calls log token usage

---

## 17. SECURITY CHECKLIST (Phase 12)

- [ ] All secrets in env vars, not code
- [ ] Webhook signature verification on all inbound webhooks
- [ ] Rate limiting on `/api/webhooks/*` and public candidate routes
- [ ] Supabase RLS enforced for every table
- [ ] Input validation with Zod on all API routes
- [ ] No sensitive data in client-side code or logs
- [ ] Audit log for recruiter actions
- [ ] CORS configured for production domain only

---

## 18. GIT WORKFLOW

```
main          ← stable, deployable
  └── dev     ← integration branch
        └── phase/2-database
        └── phase/3-auth
        └── feature/job-wizard
        └── fix/webhook-signature
```

**Naming conventions:**
- `phase/N-description` for phase work
- `feature/name` for feature additions
- `fix/description` for bug fixes

---

## 19. AGENT ARCHITECTURE (Phase 7)

### WhatsApp Recruiter Agent
- Stateless function — conversation state stored in Supabase
- Receives: message + conversation history + job context
- Returns: next message to send
- Handles: dynamic questioning, CV consistency checks, rejection triggers

### Scoring Agent
- Runs after interview completion
- Inputs: CV data + transcript + job requirements
- Outputs: score (0–100), summary, recommendation

### Human Takeover Flow
1. Recruiter clicks "Take over" in CRM
2. `is_ai_active` set to `false` on candidate
3. Inbound messages no longer trigger AI
4. Recruiter sends messages manually from CRM
5. Recruiter clicks "Resume AI" to re-activate agent

---

## 20. PROMPT ENGINEERING STRATEGY

- Use `system` prompt for role + context, `user` messages for instructions
- Keep prompts in `src/lib/ai/prompts/v[N]/` — versioned, never edited in place
- Use `fillPrompt()` template system — no string concatenation in agent code
- For structured output: always request JSON and parse with Zod
- For long context (CVs, transcripts): pass as part of system prompt to leverage caching

---

## PHASE TRANSITION CHECKLIST

### Phase 1 → Phase 2 ✅

- [x] Folder structure complete
- [x] All config files present
- [x] TypeScript path aliases configured
- [x] Supabase clients wired (pending credentials)
- [x] AI provider abstraction in place
- [x] WhatsApp provider abstraction in place
- [x] All environment variables documented
- [x] PROJECT_MASTER.md written
- [x] Git initialized

**Ready to proceed to Phase 2.**

### Phase 2 → Phase 3 ✅

- [x] All tables created with correct relationships
- [x] RLS enabled on every table
- [x] Helper functions `get_current_org_id()` + `get_current_user_role()` defined
- [x] `handle_new_user` trigger ready for auth integration
- [x] Storage buckets defined
- [x] TypeScript types match DB schema
- [x] No orphaned foreign keys
- [x] `ai_usage_logs` and `audit_logs` are append-only (no Update type)
- [x] PROJECT_MASTER.md updated

**Ready to proceed to Phase 3 — Authentication & Organizations.**

### Phase 3 → Phase 4 ✅

- [x] Login + Register pages complete
- [x] Server Actions for auth (no client secrets exposed)
- [x] `handle_new_user` trigger creates profile automatically
- [x] `useAuth` hook available for client components
- [x] Middleware guards all dashboard routes
- [x] Telegram notification utility ready (needs credentials)
- [x] PROJECT_MASTER.md updated

**Ready to proceed to Phase 4 — Recruiter Dashboard UI.**
