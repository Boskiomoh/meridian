<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAttendanceWindowQuery } from '@/queries/attendance'
import { useEmployeesQuery } from '@/queries/people'
import { useLeaveRequestsQuery } from '@/queries/leave'
import { businessDays } from '@/lib/format'
import WorkSurface from '@/components/WorkSurface.vue'
import StateBlock from '@/components/StateBlock.vue'
import ChartBars from '@/components/charts/ChartBars.vue'
import ChartLine from '@/components/charts/ChartLine.vue'
import type { BarDatum, LinePoint } from '@/components/charts/types'

const MONTHS = 6

/** The last N calendar months, oldest first. */
const months = computed(() => {
  const out: { key: string; label: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    out.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(d),
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
    })
  }
  return out
})

/**
 * Working days in a month. The month in progress counts only days that have
 * already happened -- otherwise today's partial month always reads as a crash
 * in the attendance rate, which is an artefact of the calendar, not the data.
 */
function weekdaysIn(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const now = new Date()
  const isCurrent = year === now.getUTCFullYear() && month === now.getUTCMonth()
  const end = isCurrent ? Math.min(now.getUTCDate(), lastDay) : lastDay

  let count = 0
  for (let day = 1; day <= end; day++) {
    const dow = new Date(Date.UTC(year, month, day)).getUTCDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

const windowFrom = ref(`${months.value[0].year}-${String(months.value[0].month + 1).padStart(2, '0')}-01`)

const { data: people, isPending: peopleLoading, error: peopleError } = useEmployeesQuery()
const { data: leaveRequests, isPending: leaveLoading, error: leaveError } = useLeaveRequestsQuery()
const { data: attendanceData, isPending: attendanceLoading, error: attendanceError } =
  useAttendanceWindowQuery(windowFrom)

const isLoading = computed(() => peopleLoading.value || leaveLoading.value || attendanceLoading.value)
const error = computed(() => peopleError.value ?? leaveError.value ?? attendanceError.value)

const attendance = computed(() => attendanceData.value ?? [])
const leave = computed(() => leaveRequests.value ?? [])

const activeStaff = computed(() =>
  (people.value ?? []).filter((p) => p.employment_status !== 'deactivated'),
)

const headcount = computed<BarDatum[]>(() => {
  const counts = new Map<string, { total: number; away: number }>()
  for (const p of people.value ?? []) {
    if (p.employment_status === 'deactivated') continue
    const name = p.department?.name ?? 'Unassigned'
    const entry = counts.get(name) ?? { total: 0, away: 0 }
    entry.total++
    if (p.employment_status === 'on_leave') entry.away++
    counts.set(name, entry)
  }
  return [...counts.entries()]
    .map(([label, v]) => ({
      label,
      value: v.total,
      meta: v.away > 0 ? `${v.away} on leave` : undefined,
    }))
    .sort((a, b) => b.value - a.value)
})

/** Approved leave days taken per month, in working days. */
const leaveUtilisation = computed<LinePoint[]>(() =>
  months.value.map((m) => {
    let days = 0
    for (const r of leave.value) {
      if (r.status !== 'approved') continue
      if (!r.start_date.startsWith(m.key)) continue
      days += businessDays(r.start_date, r.end_date)
    }
    return { label: m.label, value: days }
  }),
)

const attendanceByMonth = computed<LinePoint[]>(() =>
  months.value.map((m) => {
    const recorded = attendance.value.filter((a) => a.date.startsWith(m.key)).length
    const expected = weekdaysIn(m.year, m.month) * Math.max(1, activeStaff.value.length)
    return { label: m.label, value: Math.round((recorded / expected) * 100) }
  }),
)

/**
 * Rate across the whole window rather than an average of monthly rates, so a
 * short month cannot distort it. The current month is excluded because it is
 * still being recorded and would always read low.
 */
const overallRate = computed(() => {
  const closed = months.value.slice(0, -1)
  if (closed.length === 0) return null
  let recorded = 0
  let expected = 0
  for (const m of closed) {
    recorded += attendance.value.filter((a) => a.date.startsWith(m.key)).length
    expected += weekdaysIn(m.year, m.month) * Math.max(1, activeStaff.value.length)
  }
  return expected === 0 ? null : Math.round((recorded / expected) * 100)
})

const leaveMix = computed<BarDatum[]>(() => {
  const counts = new Map<string, number>()
  for (const r of leave.value) {
    if (r.status !== 'approved') continue
    const label = r.type.charAt(0).toUpperCase() + r.type.slice(1)
    counts.set(label, (counts.get(label) ?? 0) + businessDays(r.start_date, r.end_date))
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
})
</script>

<template>
  <WorkSurface title="Analytics" :count="null">
    <template #list>
      <div v-if="isLoading" class="grid gap-5 px-5 py-6 lg:px-7">
        <div v-for="i in 3" :key="i" class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <span class="skeleton block h-4 w-40 rounded" aria-hidden="true" />
          <span class="skeleton mt-4 block h-40 w-full rounded" aria-hidden="true" />
        </div>
        <span class="sr-only">Loading analytics</span>
      </div>

      <StateBlock
        v-else-if="error"
        kind="error"
        title="Analytics could not be loaded"
        :body="error.message"
      />

      <div v-else class="flex flex-col gap-5 px-5 py-6 lg:px-7">
        <!-- Headcount. The total lives in the heading rather than in a
             separate stat tile, so there is one number, not two. -->
        <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <div class="mb-4 flex items-baseline justify-between gap-4">
            <h2 class="font-display text-md font-semibold tracking-tight text-ink">
              Headcount by department
            </h2>
            <p class="text-sm text-ink-soft">
              <span class="font-display text-lg font-semibold text-ink" data-numeric>
                {{ activeStaff.length }}
              </span>
              active
            </p>
          </div>
          <ChartBars :data="headcount" caption="Active headcount by department" />
        </section>

        <div class="grid gap-5 xl:grid-cols-2">
          <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
            <h2 class="font-display text-md font-semibold tracking-tight text-ink">
              Leave taken
            </h2>
            <p class="mt-0.5 mb-4 text-xs text-ink-faint">
              Approved working days starting in each month.
            </p>
            <ChartLine
              :data="leaveUtilisation"
              unit=" days"
              caption="Approved leave days per month over the last six months"
            />
          </section>

          <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
            <div class="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h2 class="font-display text-md font-semibold tracking-tight text-ink">
                  Attendance rate
                </h2>
                <p class="mt-0.5 text-xs text-ink-faint">
                  Days recorded against working days expected.
                </p>
              </div>
              <p v-if="overallRate !== null" class="shrink-0 text-right">
                <span class="font-display text-2xl font-semibold text-ink" data-numeric>
                  {{ overallRate }}%
                </span>
                <span class="block text-2xs text-ink-faint">completed months</span>
              </p>
            </div>
            <ChartLine
              :data="attendanceByMonth"
              unit="%"
              :max="100"
              caption="Attendance rate per month over the last six months"
            />
          </section>
        </div>

        <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <h2 class="mb-4 font-display text-md font-semibold tracking-tight text-ink">
            What leave is used for
          </h2>
          <ChartBars
            v-if="leaveMix.length"
            :data="leaveMix"
            unit="d"
            tone="brass"
            caption="Approved leave days by type"
          />
          <p v-else class="text-sm text-ink-soft">No approved leave has been recorded yet.</p>
        </section>
      </div>
    </template>
  </WorkSurface>
</template>
