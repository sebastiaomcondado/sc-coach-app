-- Co-coaches: let a coach invite an assistant who shares the exact same
-- roster/workouts/templates. team_owner_id is null for a solo coach or the
-- owner themselves; non-null means "I am an assistant on this owner's team."
-- Every coach-owned row's coach_id column keeps storing the TEAM OWNER's id
-- (never the literal creator's id) so all existing coach_id = X queries keep
-- working for the whole team once X is resolved via getTeamOwnerId().

alter table profiles
  add column team_owner_id uuid references profiles(id) on delete cascade;

create index if not exists profiles_team_owner_id_idx on profiles (team_owner_id) where team_owner_id is not null;

create table coach_invites (
  token text primary key default encode(gen_random_bytes(16), 'hex'),
  team_owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz
);

alter table coach_invites enable row level security;
-- No policies: all access to this table goes through server routes using the
-- service-role key, matching athlete_invites' original convention.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function is_team_member(target_coach uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_coach = auth.uid()
    or target_coach = (select team_owner_id from profiles where id = auth.uid());
$$;

create or replace function same_coach_team(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select team_owner_id from profiles where id = auth.uid()),
    auth.uid()
  ) = coalesce(
    (select team_owner_id from profiles where id = target_profile_id),
    target_profile_id
  );
$$;

-- Redefine the existing is_coach_of() to route through is_team_member(), so
-- every policy already built on top of it becomes team-aware for free.
create or replace function is_coach_of(target_athlete uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from coach_athletes ca
    where ca.athlete_id = target_athlete
      and is_team_member(ca.coach_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: let team members see each other (for the Coaches page)
-- ---------------------------------------------------------------------------

create policy profiles_select_team on profiles
  for select
  using (same_coach_team(id));

-- ---------------------------------------------------------------------------
-- Tables with raw coach_id = auth.uid() checks outside of is_coach_of()
-- ---------------------------------------------------------------------------

drop policy if exists workouts_select on workouts;
drop policy if exists workouts_insert on workouts;
drop policy if exists workouts_update on workouts;
drop policy if exists workouts_delete on workouts;

create policy workouts_select on workouts
  for select using (is_team_member(coach_id) or athlete_id = auth.uid());
create policy workouts_insert on workouts
  for insert with check (is_team_member(coach_id) and is_coach_of(athlete_id));
create policy workouts_update on workouts
  for update using (is_team_member(coach_id));
create policy workouts_delete on workouts
  for delete using (is_team_member(coach_id));

drop policy if exists workout_exercises_select on workout_exercises;
drop policy if exists workout_exercises_insert on workout_exercises;
drop policy if exists workout_exercises_update on workout_exercises;
drop policy if exists workout_exercises_delete on workout_exercises;

create policy workout_exercises_select on workout_exercises
  for select using (
    exists (
      select 1 from workouts w
      where w.id = workout_exercises.workout_id
        and (is_team_member(w.coach_id) or w.athlete_id = auth.uid())
    )
  );
create policy workout_exercises_insert on workout_exercises
  for insert with check (
    exists (select 1 from workouts w where w.id = workout_id and is_team_member(w.coach_id))
  );
create policy workout_exercises_update on workout_exercises
  for update using (
    exists (select 1 from workouts w where w.id = workout_id and is_team_member(w.coach_id))
  );
create policy workout_exercises_delete on workout_exercises
  for delete using (
    exists (select 1 from workouts w where w.id = workout_id and is_team_member(w.coach_id))
  );

drop policy if exists program_templates_all on program_templates;
create policy program_templates_all on program_templates
  for all using (is_team_member(coach_id)) with check (is_team_member(coach_id));

drop policy if exists template_exercises_select on template_exercises;
drop policy if exists template_exercises_insert on template_exercises;
drop policy if exists template_exercises_update on template_exercises;
drop policy if exists template_exercises_delete on template_exercises;

create policy template_exercises_select on template_exercises
  for select using (
    exists (select 1 from program_templates t where t.id = template_id and is_team_member(t.coach_id))
  );
create policy template_exercises_insert on template_exercises
  for insert with check (
    exists (select 1 from program_templates t where t.id = template_id and is_team_member(t.coach_id))
  );
create policy template_exercises_update on template_exercises
  for update using (
    exists (select 1 from program_templates t where t.id = template_id and is_team_member(t.coach_id))
  );
create policy template_exercises_delete on template_exercises
  for delete using (
    exists (select 1 from program_templates t where t.id = template_id and is_team_member(t.coach_id))
  );

drop policy if exists template_exercise_phases_select on template_exercise_phases;
drop policy if exists template_exercise_phases_insert on template_exercise_phases;
drop policy if exists template_exercise_phases_update on template_exercise_phases;
drop policy if exists template_exercise_phases_delete on template_exercise_phases;

create policy template_exercise_phases_select on template_exercise_phases
  for select using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and is_team_member(t.coach_id)
    )
  );
create policy template_exercise_phases_insert on template_exercise_phases
  for insert with check (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and is_team_member(t.coach_id)
    )
  );
create policy template_exercise_phases_update on template_exercise_phases
  for update using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and is_team_member(t.coach_id)
    )
  );
create policy template_exercise_phases_delete on template_exercise_phases
  for delete using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and is_team_member(t.coach_id)
    )
  );

drop policy if exists training_cycles_all on training_cycles;
create policy training_cycles_all on training_cycles
  for all using (is_team_member(coach_id)) with check (is_team_member(coach_id));

drop policy if exists test_types_select on test_types;
drop policy if exists test_types_insert on test_types;
drop policy if exists test_types_delete on test_types;

create policy test_types_select on test_types
  for select using (
    coach_id is null
    or is_team_member(coach_id)
    or is_coach_of_by_coach(coach_id)
  );
create policy test_types_insert on test_types
  for insert with check (is_team_member(coach_id));
create policy test_types_delete on test_types
  for delete using (is_team_member(coach_id));

drop policy if exists athlete_invites_select_own on athlete_invites;
create policy athlete_invites_select_own on athlete_invites
  for select using (is_team_member(coach_id));

-- coach_athletes: select must be team-aware since the roster, reports,
-- leaderboards, tests, groups, and workout builder all read this table
-- through the RLS-scoped client filtering by the team owner's id. Insert and
-- delete stay untouched (raw coach_id = auth.uid()) — every write path goes
-- through the admin client already, and athletes/delete/route.ts relies on
-- this exact raw check (querying with the caller's own literal id, not the
-- team owner's) to keep athlete deletion owner-only per spec.
drop policy if exists coach_athletes_select on coach_athletes;
create policy coach_athletes_select on coach_athletes
  for select using (is_team_member(coach_id) or athlete_id = auth.uid());

-- ---------------------------------------------------------------------------
-- squad_groups: select is team-aware, writes stay strictly owner-only
-- ---------------------------------------------------------------------------

drop policy if exists squad_groups_all on squad_groups;

create policy squad_groups_select on squad_groups
  for select using (is_team_member(coach_id));
create policy squad_groups_insert on squad_groups
  for insert with check (coach_id = auth.uid());
create policy squad_groups_update on squad_groups
  for update using (coach_id = auth.uid());
create policy squad_groups_delete on squad_groups
  for delete using (coach_id = auth.uid());
