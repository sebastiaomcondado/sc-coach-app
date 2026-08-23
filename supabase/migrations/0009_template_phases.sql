-- Adds structural grouping (section, superset) and rest time to assigned
-- workout exercises, the same to template exercises, plus multi-phase
-- (multi-week) progressions on templates — a template exercise can carry
-- more than one prescription (e.g. "Semana 1-3" vs "Semana 4-6"); an
-- assigned workout is a single concrete instance so it only needs one.

alter table workout_exercises
  add column section text,
  add column superset_group text,
  add column prescribed_rest text;

alter table template_exercises
  add column section text,
  add column superset_group text;

create table template_exercise_phases (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises (id) on delete cascade,
  label text,
  position int not null default 0,
  sets int,
  reps text,
  rpe numeric,
  rest text
);

create index on template_exercise_phases (template_exercise_id);

alter table template_exercise_phases enable row level security;

create policy "template_exercise_phases_select" on template_exercise_phases for select
  using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.coach_id = auth.uid()
    )
  );

create policy "template_exercise_phases_insert" on template_exercise_phases for insert
  with check (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.coach_id = auth.uid()
    )
  );

create policy "template_exercise_phases_update" on template_exercise_phases for update
  using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.coach_id = auth.uid()
    )
  );

create policy "template_exercise_phases_delete" on template_exercise_phases for delete
  using (
    exists (
      select 1 from template_exercises te
      join program_templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.coach_id = auth.uid()
    )
  );
