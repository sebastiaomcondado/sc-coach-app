-- Invite links so a coach can send an athlete a link instead of a
-- pre-generated password. All access to this table goes through server
-- routes using the service role key (see /api/invites), never the client
-- directly — no RLS policies are defined, so it's deny-all by default for
-- the anon/authenticated roles.

create table athlete_invites (
  token text primary key default encode(gen_random_bytes(16), 'hex'),
  coach_id uuid not null references profiles (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz
);

alter table athlete_invites enable row level security;
