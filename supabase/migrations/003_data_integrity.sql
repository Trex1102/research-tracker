-- ============================================================
-- Research Tracker — Data Integrity Hardening
-- ============================================================

-- Normalize existing URL data before adding constraints
update public.entries
set
  url = nullif(btrim(url), ''),
  paper_draft_link = nullif(btrim(paper_draft_link), '');

-- Backfill profile emails from auth.users before adding sync trigger
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;

alter table public.entries
  add constraint entries_status_history_type_check
    check (jsonb_typeof(status_history) = 'array'),
  add constraint entries_reminders_sent_type_check
    check (jsonb_typeof(reminders_sent) = 'object'),
  add constraint entries_url_format_check
    check (url is null or url ~* '^https?://'),
  add constraint entries_paper_draft_link_format_check
    check (paper_draft_link is null or paper_draft_link ~* '^https?://');

create index if not exists entries_user_created_at_idx
  on public.entries(user_id, created_at desc);

create index if not exists entries_user_status_idx
  on public.entries(user_id, status);

create index if not exists entries_user_full_paper_deadline_idx
  on public.entries(user_id, full_paper_deadline);

create or replace function public.sync_profile_email_from_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id
    and email is distinct from new.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email_from_auth_user();

create or replace function public.record_entry_status_history()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status_history is null or jsonb_array_length(new.status_history) = 0 then
      new.status_history = jsonb_build_array(
        jsonb_build_object('status', new.status, 'timestamp', now())
      );
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     and new.status_history is not distinct from old.status_history then
    new.status_history = coalesce(old.status_history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('status', new.status, 'timestamp', now())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists entries_status_history on public.entries;
create trigger entries_status_history
  before insert or update on public.entries
  for each row execute procedure public.record_entry_status_history();
