-- Achievement badges (permanent milestones, checked when an athlete logs a
-- set) plus a pointer for which month's "last month's podium" notice an
-- athlete has already dismissed. The podium/leaderboards themselves are
-- computed live from existing tables — nothing else to store for those.

create table athlete_badges (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references profiles (id) on delete cascade,
  badge_key text not null check (
    badge_key in ('workouts_25', 'workouts_50', 'workouts_100', 'workouts_200', 'weight_100kg')
  ),
  earned_at timestamptz not null default now(),
  seen_at timestamptz
);

create unique index athlete_badges_unique on athlete_badges (athlete_id, badge_key);
create index on athlete_badges (athlete_id);

-- 'YYYY-MM' of the last month whose podium notice this athlete dismissed.
-- Same pattern as group_notice_seen_group_id, but there's no row to point at
-- since the podium is computed live rather than stored.
alter table profiles add column podium_notice_seen_month text;

alter table athlete_badges enable row level security;

create policy "athlete_badges_select" on athlete_badges for select
  using (athlete_id = auth.uid() or is_coach_of(athlete_id));

create policy "athlete_badges_insert" on athlete_badges for insert
  with check (athlete_id = auth.uid());

create policy "athlete_badges_update" on athlete_badges for update
  using (athlete_id = auth.uid());
