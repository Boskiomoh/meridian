<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useMonthAttendanceQuery } from '@/queries/attendance'
import { useEmployeesQuery, usePeopleById } from '@/queries/people'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatTime, workedHours } from '@/lib/format'
import WorkSurface from '@/components/WorkSurface.vue'
import AvatarMark from '@/components/AvatarMark.vue'
import StateBlock from '@/components/StateBlock.vue'
import SkeletonRows from '@/components/SkeletonRows.vue'

const auth = useAuthStore()
const { data: people } = useEmployeesQuery()
const peopleById = usePeopleById()

const selectedId = ref<string | null>(auth.canApprove ? null : auth.userId)

// Month cursor, anchored to the first of the month in UTC.
const cursor = ref(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)))
const monthKey = computed(
  () => `${cursor.value.getUTCFullYear()}-${String(cursor.value.getUTCMonth() + 1).padStart(2, '0')}`,
)

const { data: rowsData, isPending: isLoading, error, refetch } = useMonthAttendanceQuery(monthKey)
const rows = computed(() => rowsData.value ?? [])

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    cursor.value,
  ),
)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    cursor.value.getUTCFullYear() === now.getUTCFullYear() &&
    cursor.value.getUTCMonth() === now.getUTCMonth()
  )
})

/** Working days in the month, counted only up to today for the current month. */
const workingDays = computed(() => {
  const y = cursor.value.getUTCFullYear()
  const m = cursor.value.getUTCMonth()
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const today = new Date()
  const cap =
    isCurrentMonth.value && today.getUTCDate() < lastDay ? today.getUTCDate() : lastDay
  let count = 0
  for (let d = 1; d <= cap; d++) {
    const dow = new Date(Date.UTC(y, m, d)).getUTCDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
})

const summaries = computed(() =>
  (people.value ?? [])
    .filter((p) => p.employment_status !== 'deactivated')
    .map((p) => {
      const mine = rows.value.filter((r) => r.employee_id === p.id)
      const hours = mine.reduce((sum, r) => sum + (workedHours(r.check_in, r.check_out) ?? 0), 0)
      return {
        person: p,
        recorded: mine.length,
        rate: workingDays.value === 0 ? 0 : Math.round((mine.length / workingDays.value) * 100),
        hours: Math.round(hours),
      }
    })
    .sort((a, b) => a.person.full_name.localeCompare(b.person.full_name)),
)

const selectedRows = computed(() =>
  selectedId.value ? rows.value.filter((r) => r.employee_id === selectedId.value) : [],
)

const selectedPerson = computed(() =>
  selectedId.value ? (peopleById.value.get(selectedId.value) ?? null) : null,
)

function shiftMonth(delta: number) {
  cursor.value = new Date(
    Date.UTC(cursor.value.getUTCFullYear(), cursor.value.getUTCMonth() + delta, 1),
  )
}

/** Low rates are worth flagging, but never with colour alone. */
function rateTone(rate: number) {
  if (rate >= 90) return 'text-ink'
  if (rate >= 75) return 'text-brass'
  return 'text-danger'
}

const GRID =
  'grid items-center gap-4 grid-cols-[minmax(0,1fr)_auto]' +
  ' sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]' +
  ' lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_5rem_4.5rem]'
</script>

<template>
  <WorkSurface
    title="Attendance"
    :count="isLoading ? null : summaries.length"
    :count-noun="summaries.length === 1 ? 'person' : 'people'"
    :inspector-open="selectedId !== null"
    inspector-label="Attendance detail"
    inspector-mode="drawer"
    @close-inspector="selectedId = null"
  >
    <template #filters>
      <div class="inline-flex items-center gap-1 rounded-full bg-surface p-0.5 ring-1 ring-inset ring-border">
        <button
          class="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          <ChevronLeft :size="15" :stroke-width="2" />
        </button>
        <span class="min-w-[9rem] text-center text-sm font-medium text-ink" data-numeric>
          {{ monthLabel }}
        </span>
        <button
          class="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink disabled:text-border-strong disabled:hover:bg-transparent"
          aria-label="Next month"
          :disabled="isCurrentMonth"
          @click="shiftMonth(1)"
        >
          <ChevronRight :size="15" :stroke-width="2" />
        </button>
      </div>
      <span class="text-xs text-ink-faint" data-numeric>
        {{ workingDays }} working days{{ isCurrentMonth ? ' so far' : '' }}
      </span>
    </template>

    <template #list>
      <SkeletonRows v-if="isLoading" :rows="8" />

      <StateBlock
        v-else-if="error"
        kind="error"
        title="Attendance could not be loaded"
        :body="error.message"
        action-label="Try again"
        @action="refetch()"
      />

      <StateBlock
        v-else-if="summaries.length === 0"
        kind="empty"
        title="No attendance to show"
        body="Check-in and check-out records appear here once they are logged."
      />

      <template v-else>
        <div
          class="sticky top-0 z-10 hidden border-b border-border bg-bg/90 backdrop-blur-sm lg:block"
        >
          <div :class="[GRID, 'py-2 pl-4 pr-5 text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint']">
            <span>Name</span>
            <span>Days recorded</span>
            <span>Hours</span>
            <span class="justify-self-end">Rate</span>
          </div>
        </div>

        <ul class="divide-y divide-border">
          <li v-for="s in summaries" :key="s.person.id">
            <button
              :class="[
                GRID,
                'relative w-full py-2.5 pl-4 pr-5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                selectedId === s.person.id ? 'bg-accent-soft' : 'hover:bg-surface-alt',
              ]"
              :aria-pressed="selectedId === s.person.id"
              @click="selectedId = selectedId === s.person.id ? null : s.person.id"
            >
              <span
                class="absolute inset-y-0 left-0 w-[3px]"
                :class="s.rate >= 90 ? 'bg-success' : s.rate >= 75 ? 'bg-brass' : 'bg-danger'"
                aria-hidden="true"
              />

              <span class="flex min-w-0 items-center gap-2.5">
                <AvatarMark :name="s.person.full_name" size="sm" decorative />
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium text-ink">
                    {{ s.person.full_name }}
                  </span>
                  <span class="block truncate text-xs text-ink-faint">{{ s.person.title }}</span>
                </span>
              </span>

              <span class="hidden text-sm text-ink-soft sm:block" data-numeric>
                {{ s.recorded }} of {{ workingDays }}
              </span>

              <span class="hidden text-sm text-ink-faint lg:block" data-numeric>{{ s.hours }}h</span>

              <span
                class="justify-self-end text-sm font-medium"
                :class="rateTone(s.rate)"
                data-numeric
              >
                {{ s.rate }}%
              </span>
            </button>
          </li>
        </ul>
      </template>
    </template>

    <template #inspector>
      <div
        v-if="!selectedPerson"
        class="flex h-full flex-col items-center justify-center gap-3 px-8 py-16 text-center"
      >
        <p class="text-sm font-medium text-ink-soft">Select someone to see their days</p>
        <p class="max-w-[24ch] text-xs leading-relaxed text-ink-faint">
          Check-in and check-out times for {{ monthLabel }} appear here.
        </p>
      </div>

      <div v-else class="flex h-full flex-col">
        <div class="border-b border-border px-5 py-4">
          <h2 class="font-display text-md font-semibold leading-tight text-ink">
            {{ selectedPerson.full_name }}
          </h2>
          <p class="mt-0.5 text-xs text-ink-faint" data-numeric>
            {{ monthLabel }} · {{ selectedRows.length }} of {{ workingDays }} days recorded
          </p>
        </div>

        <p v-if="selectedRows.length === 0" class="px-5 py-8 text-center text-sm text-ink-soft">
          Nothing recorded this month.
        </p>

        <ul v-else class="divide-y divide-border">
          <li
            v-for="row in selectedRows"
            :key="row.id"
            class="flex items-center justify-between gap-3 px-5 py-2.5"
          >
            <span class="text-sm text-ink" data-numeric>{{ formatDate(row.date) }}</span>
            <span class="flex items-center gap-2 text-sm text-ink-soft" data-numeric>
              <span>{{ formatTime(row.check_in) }}</span>
              <span class="text-ink-faint" aria-hidden="true">→</span>
              <span>{{ formatTime(row.check_out) }}</span>
              <span class="w-11 text-right text-xs text-ink-faint">
                {{ workedHours(row.check_in, row.check_out) ?? '—' }}h
              </span>
            </span>
          </li>
        </ul>
      </div>
    </template>
  </WorkSurface>
</template>
