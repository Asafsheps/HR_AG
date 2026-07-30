# HR AG - Project Memory Log & Knowledge Base

This file serves as the memory log (קובץ זיכרון) to maintain continuity across different AI sessions (e.g., Antigravity, Claude, Ollama) and track the system architecture, changes, and ongoing tasks.

---

## 1. Project Background & Context

The goal is to build an **End-to-End Autonomous Recruitment & Candidate Assessment System (HR AG)**.
- **Value Proposition**: Provide employers with a rich, AI-generated **Candidate Dossier** (תעודת זהות מועמד) rather than raw resumes.
- **Candidate Dossier Elements**:
  1. Profile summary and strength analysis extracted from the CV.
  2. Match score computed against position requirements.
  3. Results and transcripts of dynamic/interactive WhatsApp screening chats and technical code assessments.
- **Affiliate/Bounty Model**: Jobs are managed in a multi-tenant environment, allowing recruiter users to register candidates and submit profiles to employers for success fees.

---

## 2. Current Directory Structure (`HR_AG`)

The project is established under `C:\Users\asafs\OneDrive\שולחן העבודה\New folder\עבודה\עצמאי\HR_AG` containing:
- `server.ts`: Single-file Express backend implementing mock local SQLite mode and Supabase multi-tenant connection.
- `src/`:
  - `App.tsx`: Main frontend React SPA showing the dashboards, candidate detail views, chats, and simulator.
  - `types.ts`: TypeScript type definitions for `Position`, `Candidate`, `AgentSettings`, etc.
  - `data/mockData.ts`: Initial mock database seeds.
- `supabase_schema.sql`: Postgres schema with multi-tenant tables (`organizations`, `profiles`, `positions`, `candidates`, `agent_settings`, etc.) and Row-Level Security (RLS) configurations.

---

## 3. Database Schema

The database relies on Supabase. Major tables:
1. **`organizations`**: Holds company names, domains, and allowed emails for multi-tenancy.
2. **`profiles`**: Links users (recruiters/admins) to organizations and defines roles (`admin`, `recruiter`, `superadmin`).
3. **`positions`**: Job listings containing title, requirements (`JSONB` array), assessment questions (`JSONB` array), code test prompts, and contract templates.
4. **`candidates`**: Candidate records including contact details, application status, salary expectations, AI match scores, interview chat transcripts (`JSONB`), and contract statuses.
5. **`agent_settings`**: Prompt instructions and guidelines for the AI assistant ("Amy") for screening candidates.
6. **`whatsapp_config`**: Configuration settings for the WhatsApp Business API / Sandbox per organization.

---

## 4. Backend Endpoints (`server.ts`)

The Express server serves as a proxy, router, and gatekeeper:
- **Authentication**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`. Supports local mock token authentication (`mock-jwt-token-for-dev`) and Supabase auth.
- **Positions**: `GET /api/positions`, `POST /api/positions`, `DELETE /api/positions/:id`.
- **Candidates**: `GET /api/candidates`, `POST /api/candidates`, `PUT /api/candidates/:id`, `DELETE /api/candidates/:id`.
- **WhatsApp Simulation & Webhook**:
  - `POST /api/whatsapp/simulate-incoming`: Receives user input in the chat simulator.
  - Calls Gemini API to generate bot replies based on `agent_settings` and candidate state.
- **Contracts**: `POST /api/contracts/generate`, `POST /api/contracts/sign`.

---

## 5. Reuse & Alignment from `Saas-Factory`

The `Saas-Factory` directory (`C:\Users\asafs\OneDrive\שולחן העבודה\New folder\עבודה\עצמאי\Saas-Factory`) contains advanced modules that we can import to structure `HR_AG`:
1. **Shadcn UI Components**: Located in `src/components/ui/` (buttons, cards, dialogs, dropdowns, inputs, sheets, sidebars, charts).
2. **Supabase client integration**: Clean frontend/backend Supabase clients (`client.ts`, `client.server.ts`) and automatic auth attachers (`auth-attacher.ts`).
3. **App Shell**: Side navigation and user logout layout (`src/components/app-shell.tsx`) including trial period alerts.
4. **Best Practices (`_LESSONS_AI_PIPELINE.md`)**:
   - Save raw inputs instantly; enrich via asynchronous AI updates (no synchronous blockers).
   - Backfill routes for NULL fields.
   - Robust JSON parsing of LLM outputs (retry up to 3 times, parse strictly, fall back gracefully).
   - Use structured model selectors instead of free text inputs to avoid breaking changes.

---

## 6. Execution Status & Next Steps

### Completed Actions:
1. Created new workspace at `C:\Users\asafs\OneDrive\שולחן העבודה\New folder\עבודה\עצמאי\HR_AG`.
2. Copied `HR_Project` core logic (Vite frontend, Express backend, Supabase DB schema).
3. Cleaned up temporary files (`mvp_exercise_*.json`).
4. Explored `Saas-Factory` structure.

### Next Steps:
1. **Setup Git & GitHub**:
   - Re-target git remote to the new `HR_AG` GitHub repository.
2. **Refactor Single-File React App**:
   - Break down `src/App.tsx` into clean, modular React subcomponents (e.g., `CandidateDossier.tsx`, `WhatsAppConfig.tsx`, `Dashboard.tsx`, `PositionsList.tsx`) under `src/components/`.
3. **Incorporate Saas-Factory Frameworks**:
   - Bring in shadcn components from `Saas-Factory` for modern UI aesthetics.
   - Implement the `AppShell` with RTL navigation.
4. **Implement New Features**:
   - **Non-direct candidate confidence score**: Add AI calculation of candidate's perceived confidence based on conversational behavior in screening chats.
   - **Client Portal (Employer Side)**: Add a portal for hiring companies to view matched candidates and define their open job criteria.
   - **Candidate Outreach Bot**: Add a script/bot interface (e.g. for Facebook) that sends target job links to relevant candidate groups.
