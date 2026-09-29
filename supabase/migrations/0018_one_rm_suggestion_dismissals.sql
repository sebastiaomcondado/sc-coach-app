-- Lets a coach dismiss a flagged 1RM PR suggestion for an athlete+test without
-- logging it. The dismissed value is remembered so the flag only reappears if
-- a later estimate exceeds it (see specs/one-rm-pr-notifications.md).

create table one_rm_suggestion_dismissals (
  athlete_id uuid not null references profiles (id) on delete cascade,
  test_type_id uuid not null references test_types (id) on delete cascade,
  dismissed_value numeric not null,
  dismissed_at timestamptz not null default now(),
  primary key (athlete_id, test_type_id)
);

alter table one_rm_suggestion_dismissals enable row level security;

create policy "one_rm_suggestion_dismissals_select" on one_rm_suggestion_dismissals for select
  using (is_coach_of(athlete_id));

create policy "one_rm_suggestion_dismissals_insert" on one_rm_suggestion_dismissals for insert
  with check (is_coach_of(athlete_id));

create policy "one_rm_suggestion_dismissals_update" on one_rm_suggestion_dismissals for update
  using (is_coach_of(athlete_id));
