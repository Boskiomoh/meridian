-- The column guards are about what a signed-in CLIENT may rewrite. When auth.uid()
-- is null there is no end user -- it is the service role, a migration, or the SQL
-- editor, all of which already bypass RLS -- so the guard must stand down instead of
-- blocking seeding and admin backfills.

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
  if new.id is distinct from old.id then
    raise exception 'Profile id is immutable.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.guard_employee_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;
  if new.department_id        is distinct from old.department_id
     or new.title             is distinct from old.title
     or new.employment_status is distinct from old.employment_status
     or new.start_date        is distinct from old.start_date
     or new.leave_allowance_days is distinct from old.leave_allowance_days then
    raise exception 'You can only edit your own contact details.' using errcode = '42501';
  end if;
  return new;
end;
$$;

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
  end if;

  if new.employee_id is distinct from old.employee_id
     or new.type       is distinct from old.type
     or new.start_date is distinct from old.start_date
     or new.end_date   is distinct from old.end_date then
    raise exception 'A filed request cannot be rewritten.' using errcode = '42501';
  end if;

  return new;
end;
$$;
