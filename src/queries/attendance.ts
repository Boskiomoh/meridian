import { type Ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import * as api from '@/api/attendance'

/** One calendar month's records across the whole org, keyed by "YYYY-MM". */
export function useMonthAttendanceQuery(monthKey: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['attendance', 'month', monthKey.value] as const),
    queryFn: () => {
      const [year, month] = monthKey.value.split('-').map(Number)
      const from = `${monthKey.value}-01`
      const to = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
      return api.fetchAttendanceForMonth(from, to)
    },
  })
}

/** One employee's trailing window -- a profile's "last N days" summary. */
export function useEmployeeAttendanceQuery(employeeId: Ref<string | null>, sinceDays = 30) {
  return useQuery({
    queryKey: computed(() => ['attendance', 'employee', employeeId.value, sinceDays] as const),
    queryFn: () => {
      const since = new Date()
      since.setUTCDate(since.getUTCDate() - sinceDays)
      return api.fetchAttendanceSince(employeeId.value as string, since.toISOString().slice(0, 10))
    },
    enabled: computed(() => employeeId.value !== null),
  })
}

/** Analytics' wide, multi-month window across the whole org. */
export function useAttendanceWindowQuery(from: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['attendance', 'window', from.value] as const),
    queryFn: () => api.fetchAttendanceFrom(from.value),
  })
}
