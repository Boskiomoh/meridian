-- Meridian — RLS. Employee sees self; manager sees self + direct reports; admin sees all.
-- Helpers live in `private` (never exposed via PostgREST) and are SECURITY DEFINER so
-- that reading public.profiles inside a public.profiles policy cannot recurse.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function private.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('manager', 'admin')
  );
$$;

-- The single visibility rule the whole app scopes on.
create or replace function private.can_view_employee(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target = (select auth.uid())
    or private.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = target and p.manager_id = (select auth.uid())
    );
$$;

-- Can the caller decide on this employee's leave? Their manager, or any admin.
create or replace function private.can_decide_for_employee(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = target and p.manager_id = (select auth.uid())
    );
$$;

revoke all on function private.current_role(), private.is_admin(), private.is_manager_or_admin(),
                      private.can_view_employee(uuid), private.can_decide_for_employee(uuid)
  from public, anon;
grant execute on function private.current_role(), private.is_admin(), private.is_manager_or_admin(),
                         private.can_view_employee(uuid), private.can_decide_for_employee(uuid)
  to authenticated;

alter table public.profiles           enable row level security;
alter table public.departments        enable row level security;
alter table public.employees          enable row level security;
alter table public.leave_requests     enable row level security;
alter table public.attendance_records enable row level security;
alter table public.documents          enable row level security;

-- profiles ----------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or manager_id = (select auth.uid())
    or private.is_admin()
  );
create policy profiles_insert_admin on public.profiles for insert to authenticated
  with check (private.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (private.is_admin());

-- departments: every signed-in user needs the lookup; only admin writes ----
create policy departments_select on public.departments for select to authenticated
  using (true);
create policy departments_write_admin on public.departments for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- employees ---------------------------------------------------------------
create policy employees_select on public.employees for select to authenticated
  using (private.can_view_employee(id));
create policy employees_insert_admin on public.employees for insert to authenticated
  with check (private.is_admin());
create policy employees_update on public.employees for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
create policy employees_delete_admin on public.employees for delete to authenticated
  using (private.is_admin());

-- leave_requests ----------------------------------------------------------
create policy leave_requests_select on public.leave_requests for select to authenticated
  using (private.can_view_employee(employee_id));
-- an employee files only their own, and only as 'pending'
create policy leave_requests_insert_self on public.leave_requests for insert to authenticated
  with check (employee_id = (select auth.uid()) and status = 'pending');
-- PRD 6: only a manager (of that employee) or an admin may move the status
create policy leave_requests_update_decider on public.leave_requests for update to authenticated
  using (private.can_decide_for_employee(employee_id))
  with check (private.can_decide_for_employee(employee_id));
create policy leave_requests_delete on public.leave_requests for delete to authenticated
  using (private.is_admin() or (employee_id = (select auth.uid()) and status = 'pending'));

-- attendance_records: read follows the same scope, writes are admin-only ---
create policy attendance_select on public.attendance_records for select to authenticated
  using (private.can_view_employee(employee_id));
create policy attendance_write_admin on public.attendance_records for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- documents ---------------------------------------------------------------
create policy documents_select on public.documents for select to authenticated
  using (private.can_view_employee(employee_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (employee_id = (select auth.uid()) or private.is_admin());
create policy documents_delete on public.documents for delete to authenticated
  using (employee_id = (select auth.uid()) or private.is_admin());
