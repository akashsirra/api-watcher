-- Verified uptime storage and scheduling now live in Supabase project api-watcher.
-- Tables, RLS, Edge Function and pg_cron job are provisioned in the connected project.
-- This migration documents the production schema used by the hosted monitor.

create table if not exists public.monitors (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  url text not null,
  method text not null default 'GET',
  expected_status integer not null default 200,
  timeout_ms integer not null default 10000,
  headers_json jsonb not null default '{}'::jsonb,
  body text,
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_status text,
  last_latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.uptime_checks (
  id bigint generated always as identity primary key,
  monitor_id bigint not null references public.monitors(id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  status_code integer,
  latency_ms integer,
  error text
);

create index if not exists uptime_checks_monitor_time_idx
  on public.uptime_checks(monitor_id, checked_at desc);

alter table public.monitors enable row level security;
alter table public.uptime_checks enable row level security;

-- Public status/badge reads only expose enabled monitors and their checks.
create policy "public can read enabled monitors"
  on public.monitors for select to anon, authenticated
  using (enabled = true);

create policy "public can read uptime checks"
  on public.uptime_checks for select to anon, authenticated
  using (exists (
    select 1 from public.monitors m
    where m.id = monitor_id and m.enabled = true
  ));
