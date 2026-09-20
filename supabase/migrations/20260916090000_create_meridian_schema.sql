-- Meridian — core schema for Northlane Studio people-ops
-- All identifiers lowercase; all timestamps timestamptz.

create type public.user_role as enum ('employee', 'manager', 'admin');
create type public.employment_status as enum ('active', 'on_leave', 'deactivated');
create type public.leave_type as enum ('vacation', 'sick', 'personal', 'other');
create type public.leave_status as enum ('pending', 'approved', 'denied');

-- profiles: identity + org hierarchy. id mirrors auth.users.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) between 1 and 120),
  email       text not null,
  role        public.user_role not null default 'employee',
  manager_id  uuid references public.profiles (id) on delete set null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  constraint profiles_not_own_manager check (manager_id is null or manager_id <> id)
);

create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.employees (
  id                uuid primary key references public.profiles (id) on delete cascade,
  department_id     uuid references public.departments (id) on delete set null,
  title             text not null check (length(trim(title)) between 1 and 120),
  employment_status public.employment_status not null default 'active',
  start_date        date not null,
  phone             text,
  location          text,
  leave_allowance_days smallint not null default 25 check (leave_allowance_days between 0 and 365),
  updated_at        timestamptz not null default now()
);

create table public.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type        public.leave_type not null,
  start_date  date not null,
  end_date    date not null,
  reason      text not null check (length(trim(reason)) between 1 and 1000),
  status      public.leave_status not null default 'pending',
  decided_by  uuid references public.profiles (id) on delete set null,
  decided_at  timestamptz,
  comment     text check (comment is null or length(comment) <= 1000),
  created_at  timestamptz not null default now(),
  constraint leave_requests_date_order check (end_date >= start_date),
  constraint leave_requests_decision_complete check (
    (status = 'pending' and decided_by is null and decided_at is null)
    or (status <> 'pending' and decided_by is not null and decided_at is not null)
  )
);

create table public.attendance_records (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  date        date not null,
  check_in    timestamptz,
  check_out   timestamptz,
  created_at  timestamptz not null default now(),
  constraint attendance_records_unique_day unique (employee_id, date),
  constraint attendance_records_time_order check (check_out is null or check_in is null or check_out >= check_in)
);

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  storage_path text not null,
  file_name   text not null check (length(trim(file_name)) between 1 and 255),
  uploaded_at timestamptz not null default now()
);

-- Indexes: every FK, plus the columns RLS policies and list views filter on.
create index profiles_manager_id_idx        on public.profiles (manager_id);
create index employees_department_id_idx    on public.employees (department_id);
create index employees_status_idx           on public.employees (employment_status);
create index leave_requests_employee_id_idx on public.leave_requests (employee_id);
create index leave_requests_status_idx      on public.leave_requests (status);
create index leave_requests_pending_idx     on public.leave_requests (employee_id) where status = 'pending';
create index leave_requests_range_idx       on public.leave_requests (start_date, end_date);
create index attendance_employee_date_idx   on public.attendance_records (employee_id, date desc);
create index attendance_date_idx            on public.attendance_records (date);
create index documents_employee_id_idx      on public.documents (employee_id);

-- keep employees.updated_at honest
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger employees_touch_updated_at
  before update on public.employees
  for each row execute function public.touch_updated_at();
