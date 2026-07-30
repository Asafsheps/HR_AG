# Deployment Guide

## Prerequisites

| Tool | Install |
|---|---|
| Node.js 20+ | https://nodejs.org |
| Supabase CLI | `npm i -g supabase` |
| Vercel CLI | `npm i -g vercel` |

---

## Step 1 — Supabase Project

1. Go to https://supabase.com → New project
2. Copy your credentials into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. Link and push migrations:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

4. Verify in Supabase Dashboard → Table Editor that all tables exist:
   - organizations, recruiter_profiles, jobs, candidates
   - whatsapp_messages, conversation_contexts, assignments
   - ai_usage_logs, audit_logs, candidate_notes

5. Enable Storage buckets (Dashboard → Storage):
   - `cv-uploads` (already created by migration)
   - `assignment-submissions` (already created by migration)

---

## Step 2 — Environment Variables

Copy `.env.example` to `.env.local` and fill in all `[REQUIRED]` fields:

```bash
cp .env.example .env.local
```

Minimum required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

---

## Step 3 — Pre-Deploy Check

```powershell
.\scripts\deploy-check.ps1
```

All checks must pass before proceeding.

---

## Step 4 — Vercel Deployment

### Option A: CLI (recommended for first deploy)

```bash
# Login and link project
vercel login
vercel link

# Set environment variables (one-time)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
# ... add all required vars

# Deploy to production
vercel --prod
```

### Option B: GitHub Integration (recommended for CI/CD)

1. Push branch to GitHub
2. Connect repo in Vercel Dashboard → New Project
3. Add all env vars in Vercel Dashboard → Settings → Environment Variables
4. Every push to `main` auto-deploys via GitHub Actions

---

## Step 5 — Post-Deploy

After deploying, update:

```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
TWILIO_WEBHOOK_URL=https://your-project.vercel.app/api/webhooks/whatsapp/twilio
```

Re-deploy after updating.

### Verify health check:
```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "db": { "status": "ok", "latency_ms": 45 },
  "env": "ok"
}
```

---

## Step 6 — Twilio Webhook (if using WhatsApp)

1. Go to Twilio Console → Messaging → Senders → WhatsApp
2. Set webhook URL: `https://your-project.vercel.app/api/webhooks/whatsapp/twilio`
3. Method: HTTP POST

---

## GitHub Actions Secrets Required

Set these in GitHub → Settings → Secrets → Actions:

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `VERCEL_TOKEN` | Vercel personal token |
| `VERCEL_ORG_ID` | Vercel org/team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Rollback

```bash
# List recent deployments
vercel ls

# Roll back to previous
vercel rollback [deployment-url]
```
