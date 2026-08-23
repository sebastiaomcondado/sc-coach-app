-- Private bucket for athlete profile photos. Objects are stored at
-- "{athlete_id}/photo.<ext>" — policies key off the first path segment so
-- an athlete can manage their own photo and a coach can manage/view photos
-- of athletes they coach. The app never uses a public URL; it always
-- generates a short-lived signed URL server-side.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatar_select" on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or is_coach_of((storage.foldername(name))[1]::uuid)
    )
  );

create policy "avatar_insert" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or is_coach_of((storage.foldername(name))[1]::uuid)
    )
  );

create policy "avatar_update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or is_coach_of((storage.foldername(name))[1]::uuid)
    )
  );

create policy "avatar_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or is_coach_of((storage.foldername(name))[1]::uuid)
    )
  );
