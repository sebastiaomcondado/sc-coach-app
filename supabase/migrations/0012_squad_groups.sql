-- Coach-managed groups, replacing the free-text profiles.squad field.

create table squad_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (coach_id, name)
);

alter table profiles
  add column squad_group_id uuid references squad_groups (id) on delete set null,
  add column group_notice_seen_group_id uuid references squad_groups (id) on delete set null;

alter table squad_groups enable row level security;

create policy "squad_groups_all" on squad_groups for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- An athlete can read the group they're currently assigned to (needed to show
-- its name in the group-change notice banner) without exposing the coach's
-- whole group list.
create policy "squad_groups_select_athlete_own" on squad_groups for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.squad_group_id = squad_groups.id
    )
  );

-- Backfill: turn each coach's distinct existing free-text squad values into real
-- groups, and point each athlete at the right one.
insert into squad_groups (coach_id, name)
select distinct ca.coach_id, p.squad
from coach_athletes ca
join profiles p on p.id = ca.athlete_id
where p.squad is not null and trim(p.squad) <> ''
on conflict (coach_id, name) do nothing;

update profiles p
set squad_group_id = sg.id
from coach_athletes ca, squad_groups sg
where ca.athlete_id = p.id
  and sg.coach_id = ca.coach_id
  and sg.name = p.squad
  and p.squad is not null and trim(p.squad) <> '';

-- Nobody should see a spurious "your group changed" notice from this migration.
update profiles set group_notice_seen_group_id = squad_group_id;

alter table profiles drop column squad;
