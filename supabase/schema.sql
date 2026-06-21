-- Run this once in Supabase Dashboard -> SQL Editor.
-- PinScope remains local-first; these tables hold only account settings and rounds.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_course_id text,
  active_round_id text,
  clubs jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  profile_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

create table if not exists public.user_rounds (
  user_id uuid not null references auth.users(id) on delete cascade,
  round_id text not null,
  round_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, round_id)
);

alter table public.user_settings enable row level security;
alter table public.user_rounds enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings"
on public.user_settings
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own rounds" on public.user_rounds;
create policy "Users manage their own rounds"
on public.user_rounds
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.user_rounds to authenticated;
