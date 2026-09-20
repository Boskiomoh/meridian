-- Meridian — private `documents` bucket. Placeholder files only (PRD Section 2:
-- this demo must never hold anything resembling real PII).
-- Path convention: <employee_id>/<file_name>, so the first path segment is the owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 5242880,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain']
)
on conflict (id) do nothing;

-- Compared as text, never cast to uuid: a malformed folder name must fail the
-- policy quietly, not raise a cast error out of the storage API.
create policy documents_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.profiles p
      where p.id::text = (storage.foldername(name))[1]
        and private.can_view_employee(p.id)
    )
  );

create policy documents_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.is_admin()
    )
  );

create policy documents_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.is_admin()
    )
  );
