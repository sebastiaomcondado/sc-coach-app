create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references profiles (id) on delete cascade,
  logged_date date not null default current_date,
  bodyweight_kg numeric,
  sleep_hours numeric,
  readiness int check (readiness between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  unique (athlete_id, logged_date)
);

create index on body_metrics (athlete_id, logged_date);

alter table body_metrics enable row level security;

create policy "body_metrics_select" on body_metrics for select
  using (athlete_id = auth.uid() or is_coach_of(athlete_id));

create policy "body_metrics_insert" on body_metrics for insert
  with check (athlete_id = auth.uid());

create policy "body_metrics_update" on body_metrics for update
  using (athlete_id = auth.uid());

create policy "body_metrics_delete" on body_metrics for delete
  using (athlete_id = auth.uid());
