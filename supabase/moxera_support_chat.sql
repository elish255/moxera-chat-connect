create table if not exists public.moxera_support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.moxera_users(id) on delete cascade,
  username text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null default '',
  attachment_path text,
  attachment_type text,
  attachment_name text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint moxera_support_content_present check (length(trim(body)) > 0 or attachment_path is not null),
  constraint moxera_support_attachment_metadata check (
    (attachment_path is null and attachment_type is null and attachment_name is null)
    or (attachment_path is not null and attachment_type is not null and attachment_name is not null)
  )
);

create index if not exists moxera_support_user_messages_idx
  on public.moxera_support_messages(user_id, created_at desc);
create index if not exists moxera_support_unread_idx
  on public.moxera_support_messages(sender_role, read_at)
  where read_at is null;

alter table public.moxera_support_messages enable row level security;
drop policy if exists moxera_support_messages_select on public.moxera_support_messages;
create policy moxera_support_messages_select on public.moxera_support_messages
  for select to authenticated
  using (user_id = (select auth.uid()) or public.moxera_is_admin());
drop policy if exists moxera_support_messages_insert on public.moxera_support_messages;
create policy moxera_support_messages_insert on public.moxera_support_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      (sender_role = 'user' and user_id = (select auth.uid()))
      or (sender_role = 'admin' and public.moxera_is_admin())
    )
  );
drop policy if exists moxera_support_messages_read_own_incoming on public.moxera_support_messages;
create policy moxera_support_messages_read_own_incoming on public.moxera_support_messages
  for update to authenticated
  using (
    (user_id = (select auth.uid()) and sender_role = 'admin')
    or (public.moxera_is_admin() and sender_role = 'user')
  )
  with check (
    (user_id = (select auth.uid()) and sender_role = 'admin')
    or (public.moxera_is_admin() and sender_role = 'user')
  );
revoke update on public.moxera_support_messages from authenticated;
grant update (read_at) on public.moxera_support_messages to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'moxera_support_messages'
  ) then
    alter publication supabase_realtime add table public.moxera_support_messages;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'moxera-support',
  'moxera-support',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists moxera_support_storage_read on storage.objects;
create policy moxera_support_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'moxera-support'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.moxera_is_admin()
    )
  );
drop policy if exists moxera_support_storage_insert on storage.objects;
create policy moxera_support_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'moxera-support'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.moxera_is_admin()
    )
  );
