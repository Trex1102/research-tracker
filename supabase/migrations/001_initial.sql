-- ============================================================
-- Research Tracker — Initial Schema
-- Apply via: supabase db push  OR  paste in Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ENTRIES
-- ============================================================
create table if not exists public.entries (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,

  -- Basic info
  name                  text not null,
  type                  text not null check (type in ('Conference', 'Journal', 'Workshop')),
  url                   text,
  theme                 text,
  ranking               text not null default 'Unranked'
                          check (ranking in ('A*', 'A', 'B', 'C', 'Unranked')),
  status                text not null default 'idea'
                          check (status in (
                            'idea', 'topic-decided', 'literature-review',
                            'experiment-ongoing', 'paper-writing', 'submitted',
                            'under-review', 'revision-requested', 'revision-submitted',
                            'accepted', 'camera-ready', 'presented-published',
                            'rejected', 'dropped'
                          )),

  -- Key dates
  abstract_deadline     date,
  full_paper_deadline   date,
  notification_date     date,
  camera_ready_deadline date,
  conference_date       date,

  -- Location
  location              text,

  -- Paper details (shown when status >= submitted)
  paper_title           text,
  paper_authors         text,
  paper_abstract        text,
  paper_draft_link      text,

  -- Meta
  notes                 text,
  tags                  text[] default '{}',

  -- Status change history: [{status: string, timestamp: ISO string}]
  status_history        jsonb default '[]'::jsonb,

  -- Reminder tracking: {deadline_key: {days_before: sent_at}}
  -- e.g. {"full_paper_deadline": {"30": "2026-01-01T00:00:00Z", "7": "..."}}
  reminders_sent        jsonb default '{}'::jsonb,

  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- Indexes
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_status_idx on public.entries(status);
create index if not exists entries_full_paper_deadline_idx on public.entries(full_paper_deadline);
create index if not exists entries_abstract_deadline_idx on public.entries(abstract_deadline);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at
  before update on public.entries
  for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "profiles: owner can select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id);

-- Entries: full CRUD for owner only
alter table public.entries enable row level security;

create policy "entries: owner can select"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "entries: owner can insert"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "entries: owner can update"
  on public.entries for update
  using (auth.uid() = user_id);

create policy "entries: owner can delete"
  on public.entries for delete
  using (auth.uid() = user_id);

-- Service role bypass (needed for edge function / cron to read all entries)
-- The edge function uses the service_role key, so RLS is bypassed automatically.
-- No extra policy needed.

-- ============================================================
-- DONE
-- ============================================================
