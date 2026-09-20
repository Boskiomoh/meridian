import { supabase, type LeaveType } from '@/lib/supabase'
import { one } from '@/lib/embed'
import { parseRow, parseRows } from '@/lib/parseRows'
import { leaveRequestSchema, type LeaveRequest } from '@/schemas'

const LEAVE_SELECT =
  'id, employee_id, type, start_date, end_date, reason, status, comment, decided_at, decided_by, created_at,' +
  ' employee:employees!leave_requests_employee_id_fkey(' +
  '   title, department:departments(name), profile:profiles!employees_id_fkey(full_name)' +
  ' ),' +
  ' decider:profiles!leave_requests_decided_by_fkey(full_name)'

interface LeaveRow {
  id: string
  employee_id: string
  type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  comment: string | null
  decided_at: string | null
  decided_by: string | null
  created_at: string
  employee: {
    title: string
    department: { name: string } | { name: string }[] | null
    profile: { full_name: string } | { full_name: string }[] | null
  } | null
  decider: { full_name: string } | { full_name: string }[] | null
}

function flatten(row: LeaveRow): unknown {
  const profile = one(row.employee?.profile)
  const department = one(row.employee?.department)
  return {
    id: row.id,
    employee_id: row.employee_id,
    type: row.type,
    start_date: row.start_date,
    end_date: row.end_date,
    reason: row.reason,
    status: row.status,
    comment: row.comment,
    decided_at: row.decided_at,
    decided_by: row.decided_by,
    created_at: row.created_at,
    employee_name: profile?.full_name ?? 'Unknown',
    employee_title: row.employee?.title ?? '',
    department_name: department?.name ?? null,
    decider_name: one(row.decider)?.full_name ?? null,
  }
}

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(LEAVE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return parseRows(leaveRequestSchema, ((data ?? []) as unknown as LeaveRow[]).map(flatten), 'fetchLeaveRequests')
}

/** Used by the Realtime handler to fetch one fully-joined row after a change. */
export async function fetchLeaveRequestById(id: string): Promise<LeaveRequest | null> {
  const { data, error } = await supabase.from('leave_requests').select(LEAVE_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return parseRow(leaveRequestSchema, flatten(data as unknown as LeaveRow), 'fetchLeaveRequestById')
}

export interface SubmitLeaveInput {
  employee_id: string
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
}

export async function submitLeaveRequest(input: SubmitLeaveInput): Promise<string> {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({ ...input, status: 'pending' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

/** Only a manager of that employee, or an admin, can get past RLS here. */
export async function decideLeaveRequest(
  id: string,
  status: 'approved' | 'denied',
  comment: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status, comment: comment.trim() || null })
    .eq('id', id)
    .select('id')

  if (error) throw new Error(error.message)
  // An empty result means RLS matched no row: the caller was not allowed.
  if (!data || data.length === 0) {
    throw new Error('You do not have permission to decide this request.')
  }
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase.from('leave_requests').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
