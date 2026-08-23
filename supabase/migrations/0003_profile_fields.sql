-- Adds richer athlete profile fields. photo_path stores a Storage object
-- path (see 0006), not a public URL — photos are served via signed URLs.

alter table profiles
  add column photo_path text,
  add column date_of_birth date,
  add column position text,
  add column height_cm numeric,
  add column weight_kg numeric,
  add column jersey_number int,
  add column squad text;

-- Coaches can now also edit the profile fields of athletes they coach
-- (previously profiles_update_own only allowed editing your own row).
create policy "profiles_update_coached_athlete" on profiles for update
  using (is_coach_of(id));
