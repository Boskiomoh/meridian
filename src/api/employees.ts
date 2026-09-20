import { supabase, type EmploymentStatus, type Role } from '@/lib/supabase'
import { one } from '@/lib/embed'
import { parseRows } from '@/lib/parseRows'
import { personSchema, departmentSchema, type Person, type Department } from '@/schemas'

const PERSON_SELECT =
  'id, title, employment_status, start_date, phone, location, leave_allowance_days, department_id,' +
  ' department:departments(id, name),' +
  ' profile:profiles!employees_id_fkey(full_name, email, role, manager_id)'

interface PersonRow {
  id: string
  title: string
  employment_status: EmploymentStatus
  start_date: string
  phone: string | null
  location: string | null
  leave_allowance_days: number
  department_id: string | null
  department: Department | Department[] | null
  profile:
    | { full_name: string; email: string; role: Role; manager_id: string | null }
    | { full_name: string; email: string; role: Role; manager_id: string | null }[]
    | null
}

function flatten(row: PersonRow): unknown {
  const profile = one(row.profile)
  return {
    id: row.id,
    title: row.title,
    employment_status: row.employment_status,
    start_date: row.start_date,
    phone: row.phone,
    location: row.location,
    leave_allowance_days: row.leave_allowance_days,
    department_id: row.department_id,
    department: one(row.department),
    full_name: profile?.full_name ?? 'Unknown',
    email: profile?.email ?? '',
    role: profile?.role ?? 'employee',
    manager_id: profile?.manager_id ?? null,
  }
}

export async function fetchEmployees(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(PERSON_SELECT)
    .order('start_date', { ascending: true })

  if (error) throw new Error(error.message)
  return parseRows(personSchema, ((data ?? []) as unknown as PersonRow[]).map(flatten), 'fetchEmployees')
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('id, name').order('name')
  if (error) throw new Error(error.message)
  return parseRows(departmentSchema, data ?? [], 'fetchDepartments')
}

/** Contact details an employee may change on their own record. */
export async function updateEmployeeContact(
  id: string,
  patch: { phone?: string | null; location?: string | null },
): Promise<void> {
  const { error } = await supabase.from('employees').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Admin-only employment fields. */
export interface EmploymentPatch {
  title?: string
  department_id?: string | null
  employment_status?: EmploymentStatus
  leave_allowance_days?: number
}

export async function updateEmployeeEmployment(id: string, patch: EmploymentPatch): Promise<void> {
  const { error } = await supabase.from('employees').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export interface CreateEmployeeInput {
  full_name: string
  email: string
  title: string
  department_id: string | null
  start_date: string
  role: Role
  manager_id: string | null
  leave_allowance_days: number
}

/**
 * Calls the create-employee Edge Function -- the only privileged path in the
 * product, because creating an employee means creating an auth user, which a
 * browser cannot do with a publishable key. The function re-checks the
 * caller's role server-side; a valid JWT alone is not enough.
 */
export async function createEmployee(input: CreateEmployeeInput): Promise<{ id: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token

  const { data, error } = await supabase.functions.invoke('create-employee', {
    body: input,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (error) {
    // The function returns a readable reason in the body; surface that, not "non-2xx".
    let message = error.message
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json()
        if (parsed?.error) message = parsed.error
      }
    } catch {
      /* fall back to the transport message */
    }
    throw new Error(message)
  }

  return data as { id: string }
}
