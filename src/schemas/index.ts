import { z } from 'zod'

/**
 * The trust boundary between Supabase and the rest of the app.
 *
 * Every fetch function in src/api/ parses its response through one of these
 * before a component ever sees it. If a future migration renames a column or
 * a generated type in database.ts drifts from the live schema, this throws
 * loudly at the network edge -- not silently as `undefined` three components
 * downstream. Shapes here are written directly against real PostgREST
 * responses (checked against the live project), not against the TypeScript
 * types alone.
 */

const uuid = z.string().uuid()
const isoDate = z.iso.date() // 'YYYY-MM-DD', e.g. attendance_records.date
const isoTimestamp = z.iso.datetime({ offset: true }) // accepts +00:00 and Z, with or without fractional seconds

// --- enums, matching the Postgres enum types exactly ------------------------

export const userRoleSchema = z.enum(['employee', 'manager', 'admin'])
export const employmentStatusSchema = z.enum(['active', 'on_leave', 'deactivated'])
export const leaveTypeSchema = z.enum(['vacation', 'sick', 'personal', 'other'])
export const leaveStatusSchema = z.enum(['pending', 'approved', 'denied'])

export type UserRole = z.infer<typeof userRoleSchema>
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>
export type LeaveType = z.infer<typeof leaveTypeSchema>
export type LeaveStatus = z.infer<typeof leaveStatusSchema>

// --- base rows ----------------------------------------------------------

export const departmentSchema = z.object({
  id: uuid,
  name: z.string().min(1),
})
export type Department = z.infer<typeof departmentSchema>

export const profileSchema = z.object({
  id: uuid,
  full_name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  manager_id: uuid.nullable(),
  avatar_url: z.string().nullable().optional(),
  created_at: isoTimestamp.optional(),
})
export type Profile = z.infer<typeof profileSchema>

export const employeeRowSchema = z.object({
  id: uuid,
  department_id: uuid.nullable(),
  title: z.string().min(1),
  employment_status: employmentStatusSchema,
  start_date: isoDate,
  phone: z.string().nullable(),
  location: z.string().nullable(),
  leave_allowance_days: z.number().int().min(0).max(365),
})
export type EmployeeRow = z.infer<typeof employeeRowSchema>

export const leaveRequestRowSchema = z.object({
  id: uuid,
  employee_id: uuid,
  type: leaveTypeSchema,
  start_date: isoDate,
  end_date: isoDate,
  reason: z.string().min(1),
  status: leaveStatusSchema,
  comment: z.string().nullable(),
  decided_at: isoTimestamp.nullable(),
  decided_by: uuid.nullable(),
  created_at: isoTimestamp,
})
export type LeaveRequestRow = z.infer<typeof leaveRequestRowSchema>

export const attendanceRecordSchema = z.object({
  id: uuid,
  employee_id: uuid,
  date: isoDate,
  check_in: isoTimestamp.nullable(),
  check_out: isoTimestamp.nullable(),
})
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>

export const documentRowSchema = z.object({
  id: uuid,
  employee_id: uuid,
  storage_path: z.string().min(1),
  file_name: z.string().min(1),
  uploaded_at: isoTimestamp,
})
export type DocumentRow = z.infer<typeof documentRowSchema>

// --- composed shapes, matching the embedded selects in src/api/ ------------

/** `employees` joined to its `departments` and `profiles` row. */
export const personSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  employment_status: employmentStatusSchema,
  start_date: isoDate,
  phone: z.string().nullable(),
  location: z.string().nullable(),
  leave_allowance_days: z.number().int().min(0).max(365),
  department_id: uuid.nullable(),
  department: departmentSchema.nullable(),
  full_name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  manager_id: uuid.nullable(),
})
export type Person = z.infer<typeof personSchema>

/** `leave_requests` joined to the requester and, if decided, the decider. */
export const leaveRequestSchema = z.object({
  id: uuid,
  employee_id: uuid,
  type: leaveTypeSchema,
  start_date: isoDate,
  end_date: isoDate,
  reason: z.string().min(1),
  status: leaveStatusSchema,
  comment: z.string().nullable(),
  decided_at: isoTimestamp.nullable(),
  decided_by: uuid.nullable(),
  created_at: isoTimestamp,
  employee_name: z.string().min(1),
  employee_title: z.string(),
  department_name: z.string().nullable(),
  decider_name: z.string().nullable(),
})
export type LeaveRequest = z.infer<typeof leaveRequestSchema>
