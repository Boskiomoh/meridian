import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { fetchPaged } from '@/lib/paged'
import { parseRows } from '@/lib/parseRows'
import { attendanceRecordSchema, type AttendanceRecord } from '@/schemas'

/** One calendar month, inclusive of both ends. A month can exceed PostgREST's row cap, so this pages. */
export async function fetchAttendanceForMonth(from: string, to: string): Promise<AttendanceRecord[]> {
  const { data, error } = await fetchPaged<unknown>((lo, hi) =>
    supabase
      .from('attendance_records')
      .select('id, employee_id, date, check_in, check_out')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .range(lo, hi),
  )
  if (error) throw new Error(error)
  return parseRows(attendanceRecordSchema, data, 'fetchAttendanceForMonth')
}

/** One employee's trailing window (a profile's "last 30 days" summary). */
export async function fetchAttendanceSince(employeeId: string, since: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id, employee_id, date, check_in, check_out')
    .eq('employee_id', employeeId)
    .gte('date', since)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return parseRows(attendanceRecordSchema, data ?? [], 'fetchAttendanceSince')
}

const attendancePointSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.iso.date(),
})
export type AttendancePoint = z.infer<typeof attendancePointSchema>

/**
 * Analytics' wide window across the whole org -- only the two fields the
 * charts need, but still several thousand rows, so this pages too.
 */
export async function fetchAttendanceFrom(from: string): Promise<AttendancePoint[]> {
  const { data, error } = await fetchPaged<unknown>((lo, hi) =>
    supabase
      .from('attendance_records')
      .select('employee_id, date')
      .gte('date', from)
      .order('date', { ascending: true })
      .range(lo, hi),
  )
  if (error) throw new Error(error)
  return parseRows(attendancePointSchema, data, 'fetchAttendanceFrom')
}
