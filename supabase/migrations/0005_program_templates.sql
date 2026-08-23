create table program_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references program_templates (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  position int not null default 0,
  sets int,
  reps text,
  weight numeric,
  rpe numeric,
  notes text
);

create index on template_exercises (template_id);

alter table program_templates enable row level security;
alter table template_exercises enable row level security;

create policy "program_templates_all" on program_templates for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "template_exercises_select" on template_exercises for select
  using (
    exists (select 1 from program_templates t where t.id = template_id and t.coach_id = auth.uid())
  );

create policy "template_exercises_insert" on template_exercises for insert
  with check (
    exists (select 1 from program_templates t where t.id = template_id and t.coach_id = auth.uid())
  );

create policy "template_exercises_update" on template_exercises for update
  using (
    exists (select 1 from program_templates t where t.id = template_id and t.coach_id = auth.uid())
  );

create policy "template_exercises_delete" on template_exercises for delete
  using (
    exists (select 1 from program_templates t where t.id = template_id and t.coach_id = auth.uid())
  );
