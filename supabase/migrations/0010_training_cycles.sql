create table training_cycles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table training_cycles enable row level security;

create policy "training_cycles_all" on training_cycles for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

alter table program_templates
  add column cycle_id uuid references training_cycles (id) on delete set null;

alter table workouts
  add column cycle_id uuid references training_cycles (id) on delete set null;
