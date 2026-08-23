-- S&C Coaching App — initial schema, run once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('coach', 'athlete')),
  created_at timestamptz not null default now()
);

create table coach_athletes (
  coach_id uuid not null references profiles (id) on delete cascade,
  athlete_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  video_url text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  athlete_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  notes text,
  scheduled_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  position int not null default 0,
  prescribed_sets int,
  prescribed_reps text,
  prescribed_weight numeric,
  prescribed_rpe numeric,
  notes text
);

create table logged_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  athlete_id uuid not null references profiles (id) on delete cascade,
  set_number int not null,
  reps int,
  weight numeric,
  rpe numeric,
  notes text,
  logged_at timestamptz not null default now()
);

create unique index logged_sets_unique_set on logged_sets (workout_exercise_id, athlete_id, set_number);

create index on coach_athletes (athlete_id);
create index on workouts (athlete_id, scheduled_date);
create index on workout_exercises (workout_id);
create index on logged_sets (workout_exercise_id);
create index on logged_sets (athlete_id);

-- ---------- Helper functions (security definer avoids RLS recursion) ----------

create or replace function is_coach_of(target_athlete uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from coach_athletes
    where coach_id = auth.uid() and athlete_id = target_athlete
  );
$$;

create or replace function current_role_is_coach()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'coach'
  );
$$;

-- ---------- Row Level Security ----------

alter table profiles enable row level security;
alter table coach_athletes enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table logged_sets enable row level security;

-- profiles: see your own row, or a row of someone you coach / who coaches you
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or is_coach_of(id)
    or exists (select 1 from coach_athletes where athlete_id = auth.uid() and coach_id = profiles.id)
  );

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());

-- coach_athletes: coaches manage their own links; athletes can read their own links
create policy "coach_athletes_select" on coach_athletes for select
  using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy "coach_athletes_insert" on coach_athletes for insert
  with check (coach_id = auth.uid() and current_role_is_coach());

create policy "coach_athletes_delete" on coach_athletes for delete
  using (coach_id = auth.uid());

-- exercises: shared read library, coaches can manage
create policy "exercises_select" on exercises for select
  using (auth.uid() is not null);

create policy "exercises_insert" on exercises for insert
  with check (current_role_is_coach());

create policy "exercises_update" on exercises for update
  using (current_role_is_coach());

create policy "exercises_delete" on exercises for delete
  using (current_role_is_coach());

-- workouts: coach owns and manages; athlete can read their own
create policy "workouts_select" on workouts for select
  using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy "workouts_insert" on workouts for insert
  with check (coach_id = auth.uid() and is_coach_of(athlete_id));

create policy "workouts_update" on workouts for update
  using (coach_id = auth.uid());

create policy "workouts_delete" on workouts for delete
  using (coach_id = auth.uid());

-- workout_exercises: visible/manageable through the parent workout
create policy "workout_exercises_select" on workout_exercises for select
  using (
    exists (
      select 1 from workouts w
      where w.id = workout_exercises.workout_id
        and (w.coach_id = auth.uid() or w.athlete_id = auth.uid())
    )
  );

create policy "workout_exercises_insert" on workout_exercises for insert
  with check (
    exists (select 1 from workouts w where w.id = workout_id and w.coach_id = auth.uid())
  );

create policy "workout_exercises_update" on workout_exercises for update
  using (
    exists (select 1 from workouts w where w.id = workout_id and w.coach_id = auth.uid())
  );

create policy "workout_exercises_delete" on workout_exercises for delete
  using (
    exists (select 1 from workouts w where w.id = workout_id and w.coach_id = auth.uid())
  );

-- logged_sets: athlete logs their own sets; coach can read sets of athletes they coach
create policy "logged_sets_select" on logged_sets for select
  using (athlete_id = auth.uid() or is_coach_of(athlete_id));

create policy "logged_sets_insert" on logged_sets for insert
  with check (
    athlete_id = auth.uid()
    and exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.athlete_id = auth.uid()
    )
  );

create policy "logged_sets_update" on logged_sets for update
  using (athlete_id = auth.uid());

create policy "logged_sets_delete" on logged_sets for delete
  using (athlete_id = auth.uid());
