-- Meridian — security hardening (secure-build review, 2026-09-24).
--
-- 1. The three public demo accounts can't change their password, email, phone or enrol MFA
--    (the logins are published; one visitor could otherwise lock every hirer out), and even
--    the demo HR admin can't delete them, re-role them, re-point their manager or deactivate
--    them, so the next visitor always finds all three roles working.
-- 2. Profiles are edited by HR admins only. The app never edits a profile from the browser,
--    and self-edit let an employee rename themselves or change their listed email.
-- 3. A leave request's reason belongs to the requester: a deciding manager can set status
--    and comment, not rewrite why the employee asked.
-- 4. Storage uploads need a real employee record, so a stranger with a fresh signup can't
--    fill the bucket.
-- 5. A document row can only point at a file in its own employee's folder, once. Otherwise a
--    planted row could make an admin's "delete" remove someone else's file.

-- 1. Demo accounts -------------------------------------------------------------------------

create table if not exists private.demo_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade
);
revoke all on private.demo_accounts from public, anon, authenticated;

insert into private.demo_accounts (user_id)
select u.id from auth.users u
where u.email in (
  'priya.raghunathan@northlane.studio',
  'tobias.lind@northlane.studio',
  'maya.okonkwo@northlane.studio'
)
on conflict do nothing;

-- Silently keep the old values rather than raising, so Auth's own housekeeping (a password
-- hash upgrade at sign-in, for example) can never break a demo sign-in.
-- To change a demo password on purpose: delete its row from private.demo_accounts, change it,
-- then re-insert the row.
create or replace function private.lock_demo_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from private.demo_accounts d where d.user_id = old.id) then
    new.encrypted_password         := old.encrypted_password;
    new.email                      := old.email;
    new.email_change               := old.email_change;
    new.email_change_token_new     := old.email_change_token_new;
    new.email_change_token_current := old.email_change_token_current;
    new.phone                      := old.phone;
    new.phone_change               := old.phone_change;
    new.phone_change_token         := old.phone_change_token;
    new.recovery_token             := old.recovery_token;
  end if;
  return new;
end;
$$;

create trigger lock_demo_identity
  before update on auth.users
  for each row execute function private.lock_demo_identity();

create or replace function private.block_demo_mfa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from private.demo_accounts d where d.user_id = new.user_id) then
    raise exception 'Demo accounts cannot enrol MFA.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger block_demo_mfa
  before insert on auth.mfa_factors
  for each row execute function private.block_demo_mfa();

-- Signed-in users only (auth.uid() not null): the seed and the SQL editor still can.
create or replace function private.guard_demo_people()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not exists (select 1 from private.demo_accounts d where d.user_id = old.id) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'The demo accounts can''t be removed, so every visitor can sign in as them.' using errcode = '42501';
  end if;

  if tg_table_name = 'profiles'
     and (new.role is distinct from old.role or new.manager_id is distinct from old.manager_id) then
    raise exception 'The demo accounts keep their role and manager, so every visitor can sign in as them.' using errcode = '42501';
  end if;

  if tg_table_name = 'employees' and new.employment_status is distinct from old.employment_status then
    raise exception 'The demo accounts stay active, so every visitor can sign in as them.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_demo
  before update or delete on public.profiles
  for each row execute function private.guard_demo_people();

create trigger employees_guard_demo
  before update or delete on public.employees
  for each row execute function private.guard_demo_people();

revoke all on function private.lock_demo_identity(), private.block_demo_mfa(), private.guard_demo_people()
  from public, anon, authenticated;

-- 2. Profiles: admin-only edits -------------------------------------------------------------
-- The self-update policy stays so a forbidden attempt is refused loudly (403) by the guard
-- rather than silently matching no rows; the guard now covers every column.

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Only an HR admin can change a role.' using errcode = '42501';
  end if;
  if new.manager_id is distinct from old.manager_id then
    raise exception 'Only an HR admin can change reporting lines.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id
     or new.full_name  is distinct from old.full_name
     or new.email      is distinct from old.email
     or new.avatar_url is distinct from old.avatar_url
     or new.created_at is distinct from old.created_at then
    raise exception 'Only an HR admin can change a profile.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 3. Leave: the requester's reason is theirs ------------------------------------------------

create or replace function public.stamp_leave_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'This request has already been decided.' using errcode = '42501';
    end if;
    if new.status = 'pending' then
      raise exception 'A request cannot be moved back to pending.' using errcode = '42501';
    end if;
    new.decided_by := (select auth.uid());
    new.decided_at := now();
  elsif new.decided_by is distinct from old.decided_by or new.decided_at is distinct from old.decided_at then
    raise exception 'Decision stamps are set by the system.' using errcode = '42501';
  end if;

  if new.employee_id is distinct from old.employee_id
     or new.type       is distinct from old.type
     or new.start_date is distinct from old.start_date
     or new.end_date   is distinct from old.end_date
     or new.reason     is distinct from old.reason
     or new.created_at is distinct from old.created_at then
    raise exception 'A filed request cannot be rewritten.' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 4. Storage: uploads need an employee record ---------------------------------------------

drop policy if exists documents_objects_insert on storage.objects;
create policy documents_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and exists (select 1 from public.employees e where e.id = (select auth.uid()))
      )
      or private.is_admin()
    )
  );

-- 5. Document rows point only into their own employee's folder -----------------------------
-- NOT VALID: enforced for every new row without failing on anything already stored.

alter table public.documents
  add constraint documents_path_in_owner_folder
    check (split_part(storage_path, '/', 1) = employee_id::text and storage_path !~ '(^|/)\.\.(/|$)') not valid;

create unique index if not exists documents_storage_path_key on public.documents (storage_path);
