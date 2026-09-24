-- Fix for 20260924100000: private.guard_demo_people() is shared by profiles and employees,
-- but PL/pgSQL resolves `new.<column>` even behind a false `and`, so a profiles row hit
-- "record new has no field employment_status" (and employees rows would hit `role`). Every
-- update to a demo person's row failed, including an employee editing their own phone.
-- Branch on the table first so each column is only read on the table that has it.

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

  if tg_table_name = 'profiles' then
    if new.role is distinct from old.role or new.manager_id is distinct from old.manager_id then
      raise exception 'The demo accounts keep their role and manager, so every visitor can sign in as them.' using errcode = '42501';
    end if;
  elsif tg_table_name = 'employees' then
    if new.employment_status is distinct from old.employment_status then
      raise exception 'The demo accounts stay active, so every visitor can sign in as them.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_demo_people() from public, anon, authenticated;
