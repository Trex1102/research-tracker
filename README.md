# Research Tracker

A full-stack web app to track conference and journal submissions — deadlines, status, papers, and email reminders.

**Stack:** React + Vite + Tailwind CSS · Supabase (Auth + DB + Edge Functions) · GitHub Pages

---

## Features

- **Auth** — Email/password login & signup via Supabase Auth
- **Dashboard** — Grid of entries with live countdown timers, filters, search, stats
- **Entry CRUD** — Full details: name, type, ranking, status, deadlines, paper details, notes, tags
- **Timeline** — All deadlines on a chronological list, color-coded by urgency
- **Email Reminders** — Daily cron (GitHub Actions) calls a Supabase Edge Function to send reminders at 30/15/10/5/3/1 days before each deadline via Resend
- **CSV Export** — Download all entries as CSV
- **Dark/Light mode** — System-aware with manual toggle
- **Mobile responsive** — Works on all screen sizes
- **Status history** — Log of every status change with timestamp
- **Duplicate detection** — Warns if an entry with the same name already exists

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Resend](https://resend.com) account for emails (optional for local dev)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/research-tracker.git
cd research-tracker/frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Run database migrations

In the [Supabase SQL Editor](https://app.supabase.com), paste and run:
- `supabase/migrations/001_initial.sql`

### 4. Start dev server

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Deployment

### Frontend → GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings > Pages**, set source to **GitHub Actions**.
3. Add these secrets under **Settings > Secrets > Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` — the `deploy.yml` workflow will build and deploy automatically.
5. Your app will be at `https://yourusername.github.io/research-tracker/`

> **Important:** In Supabase Dashboard → Authentication → URL Configuration, add your GitHub Pages URL to **Site URL** and **Redirect URLs** (e.g. `https://yourusername.github.io/research-tracker/**`).

### Backend → Supabase (free tier)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial.sql` in the SQL Editor
3. Note your **Project URL** and **anon/public key** from Settings > API

### Edge Function (Email Reminders)

Deploy the edge function using the Supabase CLI:

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set FROM_EMAIL="Research Tracker <reminders@yourdomain.com>"
supabase secrets set APP_URL=https://yourusername.github.io/research-tracker
supabase secrets set CRON_SECRET=your-long-random-string

# Deploy
supabase functions deploy send-reminders
```

### Email Cron (GitHub Actions)

Add these secrets to your GitHub repo:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings > API (service_role key) |
| `CRON_SECRET` | Same value as the edge function `CRON_SECRET` secret |

The `send-reminders.yml` workflow runs at **08:00 UTC daily**. You can also trigger it manually from the Actions tab.

### Email Setup (Resend)

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your sending domain (or use their sandbox for testing)
3. Get your API key and set it as `RESEND_API_KEY` in the edge function secrets
4. Update `FROM_EMAIL` to use your verified domain

> **SendGrid alternative:** Replace the `sendEmail()` function in `supabase/functions/send-reminders/index.ts` with a SendGrid API call. The payload format is different but the logic is the same.

---

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `VITE_BASE_PATH` | Base path for GitHub Pages (e.g. `/research-tracker/`) |

### Edge Function (Supabase secrets)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for sending emails |
| `FROM_EMAIL` | Sender address (must be verified in Resend) |
| `APP_URL` | Your deployed app URL (used in email links) |
| `CRON_SECRET` | Secret to authenticate the daily cron call |
| `SUPABASE_URL` | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |

---

## Project Structure

```
research-tracker/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level page components
│   │   ├── hooks/             # TanStack Query hooks
│   │   ├── contexts/          # Auth + Theme React contexts
│   │   └── lib/               # Supabase client, constants, utils
│   ├── .env.example
│   └── vite.config.js
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql    # Tables, RLS policies, triggers
│   │   └── 002_seed.sql       # Sample data (dev only)
│   └── functions/
│       └── send-reminders/    # Edge Function for email reminders
│           └── index.ts
│
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Build & deploy to GitHub Pages
│       └── send-reminders.yml  # Daily cron → edge function
│
├── .env.example               # Root env reference
└── README.md
```

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users |
| email | text | |
| full_name | text | |
| created_at / updated_at | timestamptz | |

### `entries`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | |
| type | text | Conference / Journal / Workshop |
| url | text | |
| theme | text | |
| ranking | text | A* / A / B / C / Unranked |
| status | text | 14 possible values |
| abstract_deadline | date | |
| full_paper_deadline | date | |
| notification_date | date | |
| camera_ready_deadline | date | |
| conference_date | date | |
| location | text | |
| paper_title / authors / abstract / draft_link | text | Shown when status ≥ submitted |
| notes | text | Markdown |
| tags | text[] | |
| status_history | jsonb | Array of {status, timestamp} |
| reminders_sent | jsonb | Tracks sent emails per deadline |
| created_at / updated_at | timestamptz | Auto-managed |

All tables have **Row Level Security** — users can only access their own data.

---

## License

MIT
