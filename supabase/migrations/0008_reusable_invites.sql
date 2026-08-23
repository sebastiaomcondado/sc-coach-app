-- Adds a "team link" option: one reusable invite per coach that anyone can
-- open to join (e.g. pasted into a squad WhatsApp group), as opposed to the
-- existing single-use per-athlete invites.

alter table athlete_invites add column is_reusable boolean not null default false;

-- Coaches can view their own invites (needed to show their current active
-- team link). Creating/accepting invites still goes through server routes
-- using the service role key — this is read-only for the coach's own rows.
create policy "athlete_invites_select_own" on athlete_invites for select
  using (coach_id = auth.uid());
