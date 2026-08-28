-- Physical tests (1RM, Bronco, jumps, etc): fixed + coach-defined custom test
-- types, and logged results per athlete over time.

create table test_types (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles (id) on delete cascade, -- null = fixed/built-in, shared by every coach
  name text not null,
  unit text not null,
  higher_is_better boolean not null,
  is_custom boolean not null default true,
  created_at timestamptz not null default now()
);

-- Fixed test names are globally unique; a coach's custom test names are unique
-- to that coach (two different coaches can each have their own "Beep Test").
create unique index test_types_fixed_name_unique on test_types (name) where coach_id is null;
create unique index test_types_custom_name_unique on test_types (coach_id, name) where coach_id is not null;

create table test_results (
  id uuid primary key default gen_random_uuid(),
  test_type_id uuid not null references test_types (id) on delete cascade,
  athlete_id uuid not null references profiles (id) on delete cascade,
  value numeric not null,
  logged_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index on test_results (athlete_id, test_type_id);
create index on test_results (test_type_id);

alter table exercises
  add column one_rm_category text check (one_rm_category in ('squat', 'deadlift', 'row', 'bench_press'));

-- Helper: is the current user an athlete of the given coach? (mirrors
-- is_coach_of, but from the athlete's side, needed for the test_types policy
-- below since test_types has no athlete_id column to check directly.)
create or replace function is_coach_of_by_coach(target_coach uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from coach_athletes
    where coach_id = target_coach and athlete_id = auth.uid()
  );
$$;

alter table test_types enable row level security;
alter table test_results enable row level security;

-- test_types: fixed rows visible to everyone; a coach's custom rows visible to
-- that coach and to athletes they coach (so an athlete can render the test's
-- name/unit on their own read-only history).
create policy "test_types_select" on test_types for select
  using (
    coach_id is null
    or coach_id = auth.uid()
    or is_coach_of_by_coach(coach_id)
  );

create policy "test_types_insert" on test_types for insert
  with check (coach_id = auth.uid());

create policy "test_types_delete" on test_types for delete
  using (coach_id = auth.uid());

-- test_results: coach logs/edits/deletes for athletes they coach; athlete can
-- only read their own.
create policy "test_results_select" on test_results for select
  using (athlete_id = auth.uid() or is_coach_of(athlete_id));

create policy "test_results_insert" on test_results for insert
  with check (is_coach_of(athlete_id));

create policy "test_results_update" on test_results for update
  using (is_coach_of(athlete_id));

create policy "test_results_delete" on test_results for delete
  using (is_coach_of(athlete_id));

insert into test_types (name, unit, higher_is_better, is_custom) values
  ('Squat 1RM', 'kg', true, false),
  ('Deadlift 1RM', 'kg', true, false),
  ('Bench Press 1RM', 'kg', true, false),
  ('Row 1RM', 'kg', true, false),
  ('Bronco Test', 'seconds', false, false),
  ('Max Speed', 'seconds', false, false),
  ('Horizontal Jump', 'cm', true, false),
  ('Vertical Jump', 'cm', true, false),
  ('Max Push-ups', 'reps', true, false),
  ('Max Pull-ups', 'reps', true, false),
  ('Max Plank Hold', 'seconds', true, false);
