-- Dot Video: RLS policies
alter table public.videos enable row level security;

drop policy if exists "Public can read published videos" on public.videos;
create policy "Public can read published videos" on public.videos
for select to anon, authenticated using (published = true);

drop policy if exists "Authenticated admins can insert videos" on public.videos;
create policy "Authenticated admins can insert videos" on public.videos
for insert to authenticated with check (true);

drop policy if exists "Authenticated admins can update videos" on public.videos;
create policy "Authenticated admins can update videos" on public.videos
for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins can delete videos" on public.videos;
create policy "Authenticated admins can delete videos" on public.videos
for delete to authenticated using (true);

-- Storage policies for the public videos and posters buckets.
drop policy if exists "Authenticated admins can upload videos" on storage.objects;
create policy "Authenticated admins can upload videos" on storage.objects
for insert to authenticated with check (bucket_id = 'videos');

drop policy if exists "Authenticated admins can delete videos storage" on storage.objects;
create policy "Authenticated admins can delete videos storage" on storage.objects
for delete to authenticated using (bucket_id = 'videos');

drop policy if exists "Authenticated admins can upload posters" on storage.objects;
create policy "Authenticated admins can upload posters" on storage.objects
for insert to authenticated with check (bucket_id = 'posters');

drop policy if exists "Authenticated admins can delete posters storage" on storage.objects;
create policy "Authenticated admins can delete posters storage" on storage.objects
for delete to authenticated using (bucket_id = 'posters');
