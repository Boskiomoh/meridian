import type { EmploymentStatus, LeaveStatus, LeaveType } from '@/lib/supabase'

const DAY_MS = 86_400_000

/** "12 Oct 2026" — unambiguous across locales, short enough for a dense row. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/** "12–23 Oct 2026", collapsing the parts both ends share. */
export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start)
  const a = new Date(`${start}T00:00:00Z`)
  const b = new Date(`${end}T00:00:00Z`)
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear()
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth()

  const day = (d: Date) => String(d.getUTCDate()).padStart(2, '0')
  const monthYear = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
  const month = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(d)

  if (sameMonth) return `${day(a)}–${day(b)} ${monthYear(b)}`
  if (sameYear) return `${day(a)} ${month(a)} – ${day(b)} ${monthYear(b)}`
  return `${formatDate(start)} – ${formatDate(end)}`
}

/** "09:14" in UTC, so seeded timestamps read identically on every machine. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d)
}

/** Inclusive calendar length of a leave request. */
export function leaveDays(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`)
  const b = Date.parse(`${end}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.max(0, Math.round((b - a) / DAY_MS) + 1)
}

/** Worked hours for one attendance row, to one decimal. Null when incomplete. */
export function workedHours(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null
  const ms = Date.parse(checkOut) - Date.parse(checkIn)
  if (Number.isNaN(ms) || ms <= 0) return null
  return Math.round((ms / 3_600_000) * 10) / 10
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal',
  other: 'Other',
}

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
}

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  active: 'Active',
  on_leave: 'On leave',
  deactivated: 'Deactivated',
}

export const ROLE_LABEL = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'HR Admin',
} as const

/**
 * Business days between two dates, inclusive, ignoring public holidays.
 * Used for leave balance so a two-week request costs 10 days, not 14.
 */
export function businessDays(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`)
  const b = new Date(`${end}T00:00:00Z`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
  let count = 0
  const cursor = new Date(a)
  while (cursor <= b) {
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) count++
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
}
