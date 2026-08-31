-- Luoga SaaS v1: Neon/Postgres schema
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  plan text not null default 'free' check (plan in ('free','creator','pro','agency')),
  created_at timestamptz not null default now()
);

create table if not exists tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  open_id text not null unique,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_expires_at timestamptz,
  refresh_expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_usage (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  units integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  input_text text,
  output_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  event_id text primary key,
  event_type text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx on ai_usage(user_id, created_at desc);
create index if not exists generated_content_user_created_idx on generated_content(user_id, created_at desc);
