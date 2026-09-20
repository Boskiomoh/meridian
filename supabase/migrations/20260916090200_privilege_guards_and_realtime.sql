-- Meridian — guards that RLS alone cannot express, plus Realtime for leave status.
--
-- Why: profiles_update / employees_update let a user write their OWN row. Without these
-- triggers an employee could set role = 'admin' or re-point manager_id and read the org.
-- The policy says "which rows"; the trigger says "which columns".

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
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

create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.guard_profile_self_update();

-- Phase 3: "self-edit limited to an employee's own contact info".
create or replace function public.guard_employee_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;
  if new.department_id     is distinct from old.department_id
     or new.title             is distinct from old.title
     or new.employment_status is distinct from old.employment_status
     or new.start_date        is distinct from old.start_date
     or new.leave_allowance_days is distinct from old.leave_allowance_days then
    raise exception 'You can only edit your own contact details.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger employees_guard_self_update
  before update on public.employees
  for each row execute function public.guard_employee_self_update();

-- Stamp the decision server-side so decided_by can never be spoofed by the client,
-- and satisfy leave_requests_decision_complete automatically.
create or replace function public.stamp_leave_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

  -- the requester's own fields are fixed once filed
  if new.employee_id is distinct from old.employee_id
     or new.type       is distinct from old.type
     or new.start_date is distinct from old.start_date
     or new.end_date   is distinct from old.end_date then
    raise exception 'A filed request cannot be rewritten.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger leave_requests_stamp_decision
  before update on public.leave_requests
  for each row execute function public.stamp_leave_decision();

-- Phase 4: the employee's view updates live when a manager decides.
alter publication supabase_realtime add table public.leave_requests;
