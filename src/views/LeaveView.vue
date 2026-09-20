<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { CalendarPlus, Radio } from 'lucide-vue-next'
import { useMyLeaveRequests, useLeaveRealtime, useTeamLeaveQueue } from '@/queries/leave'
import { useAuthStore } from '@/stores/auth'
import { LEAVE_TYPE_LABEL, businessDays, formatDateRange } from '@/lib/format'
import type { LeaveRequest } from '@/schemas'
import WorkSurface from '@/components/WorkSurface.vue'
import StatusPill from '@/components/StatusPill.vue'
import AvatarMark from '@/components/AvatarMark.vue'
import AppButton from '@/components/AppButton.vue'
import StateBlock from '@/components/StateBlock.vue'
import SkeletonRows from '@/components/SkeletonRows.vue'
import LeaveInspector from '@/components/LeaveInspector.vue'
import RequestLeaveDialog from '@/components/RequestLeaveDialog.vue'

const auth = useAuthStore()
const mine = useMyLeaveRequests()
const team = useTeamLeaveQueue()
const realtime = useLeaveRealtime()

type Tab = 'mine' | 'team'
const tab = ref<Tab>(auth.canApprove ? 'team' : 'mine')
const selectedId = ref<string | null>(null)
const requestOpen = ref(false)

const active = computed(() => (tab.value === 'mine' ? mine : team))
const rows = computed<LeaveRequest[]>(() => active.value.requests.value)
const isLoading = computed(() => active.value.isLoading.value)
const error = computed(() => active.value.error.value)

const selected = computed<LeaveRequest | null>(
  () => rows.value.find((r) => r.id === selectedId.value) ?? null,
)

onMounted(() => realtime.start())
onUnmounted(() => realtime.stop())

watch(tab, () => (selectedId.value = null))

watch(rows, (next) => {
  if (selectedId.value && !next.some((r) => r.id === selectedId.value)) selectedId.value = null
})

const STRIPE: Record<string, string> = {
  approved: 'bg-success',
  pending: 'bg-brass',
  denied: 'bg-danger',
}

const GRID =
  'grid items-center gap-4 grid-cols-[minmax(0,1fr)_auto]' +
  ' sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]' +
  ' lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4.5rem_7.5rem]'

const emptyCopy = computed(() =>
  tab.value === 'mine'
    ? {
        title: 'You have not requested any leave',
        body: 'When you file a request it appears here with its status, and updates the moment your manager decides.',
      }
    : {
        title: 'Nothing waiting on you',
        body: 'Requests from your direct reports land here. You can approve or deny each one with a comment.',
      },
)
</script>

<template>
  <WorkSurface
    title="Leave"
    :count="isLoading ? null : rows.length"
    :count-noun="rows.length === 1 ? 'request' : 'requests'"
    :inspector-open="selectedId !== null"
    inspector-label="Request"
    @close-inspector="selectedId = null"
  >
    <template #actions>
      <AppButton variant="primary" size="sm" @click="requestOpen = true">
        <CalendarPlus :size="15" :stroke-width="2" aria-hidden="true" />
        Request leave
      </AppButton>
    </template>

    <template #filters>
      <div
        v-if="auth.canApprove"
        class="inline-flex rounded-full bg-surface p-0.5 ring-1 ring-inset ring-border"
        role="tablist"
        aria-label="Leave lists"
      >
        <button
          v-for="option in (['team', 'mine'] as Tab[])"
          :key="option"
          role="tab"
          :aria-selected="tab === option"
          class="rounded-full px-3.5 py-1 text-sm font-medium transition-colors duration-150"
          :class="tab === option ? 'bg-accent text-ink-invert' : 'text-ink-soft hover:text-ink'"
          @click="tab = option"
        >
          {{ option === 'team' ? 'Team queue' : 'My requests' }}
          <span
            v-if="option === 'team' && team.pendingCount.value"
            class="ml-1.5 rounded-full bg-brass px-1.5 py-px text-2xs text-white"
            data-numeric
          >
            {{ team.pendingCount.value }}
          </span>
        </button>
      </div>

      <!-- Says out loud that the list is live, so the update is read as the
           product working rather than as a glitch. -->
      <span class="ml-auto inline-flex items-center gap-1.5 text-2xs text-ink-faint">
        <Radio :size="12" :stroke-width="2" class="text-accent-mid" aria-hidden="true" />
        Updates live
      </span>
    </template>

    <template #list>
      <SkeletonRows v-if="isLoading" :rows="8" />

      <StateBlock
        v-else-if="error"
        kind="error"
        title="Leave requests could not be loaded"
        :body="error.message"
        action-label="Try again"
        @action="active.refetch()"
      />

      <StateBlock
        v-else-if="rows.length === 0"
        kind="empty"
        :title="emptyCopy.title"
        :body="emptyCopy.body"
        :action-label="tab === 'mine' ? 'Request leave' : undefined"
        @action="requestOpen = true"
      />

      <template v-else>
        <div
          class="sticky top-0 z-10 hidden border-b border-border bg-bg/90 backdrop-blur-sm lg:block"
        >
          <div :class="[GRID, 'py-2 pl-4 pr-5 text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint']">
            <span>{{ tab === 'team' ? 'Who' : 'Type' }}</span>
            <span>Dates</span>
            <span>Length</span>
            <span class="justify-self-end">Status</span>
          </div>
        </div>

        <ul class="divide-y divide-border">
          <li v-for="request in rows" :key="request.id">
            <button
              :class="[
                GRID,
                'relative w-full py-2.5 pl-4 pr-5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                selectedId === request.id ? 'bg-accent-soft' : 'hover:bg-surface-alt',
                realtime.recentlyChanged.value.has(request.id) && 'settle',
              ]"
              :aria-pressed="selectedId === request.id"
              @click="selectedId = selectedId === request.id ? null : request.id"
            >
              <span
                class="absolute inset-y-0 left-0 w-[3px]"
                :class="STRIPE[request.status]"
                aria-hidden="true"
              />

              <span class="flex min-w-0 items-center gap-2.5">
                <AvatarMark v-if="tab === 'team'" :name="request.employee_name" size="sm" decorative />
                <span class="min-w-0">
                  <span class="flex items-center gap-1.5">
                    <span class="truncate text-sm font-medium text-ink">
                      {{ tab === 'team' ? request.employee_name : LEAVE_TYPE_LABEL[request.type] }}
                    </span>
                    <span
                      v-if="tab === 'team'"
                      class="shrink-0 rounded-full bg-nav px-1.5 py-px text-2xs font-medium text-ink-soft"
                    >
                      {{ LEAVE_TYPE_LABEL[request.type] }}
                    </span>
                  </span>
                  <span class="block truncate text-xs text-ink-faint">{{ request.reason }}</span>
                </span>
              </span>

              <span class="hidden min-w-0 truncate text-sm text-ink-soft sm:block" data-numeric>
                {{ formatDateRange(request.start_date, request.end_date) }}
              </span>

              <span class="hidden text-sm text-ink-faint lg:block" data-numeric>
                {{ businessDays(request.start_date, request.end_date) }}d
              </span>

              <StatusPill :status="request.status" class="justify-self-end" />
            </button>
          </li>
        </ul>
      </template>
    </template>

    <template #inspector>
      <LeaveInspector
        :request="selected"
        :can-decide="auth.canApprove && tab === 'team'"
        @close="selectedId = null"
      />
    </template>
  </WorkSurface>

  <RequestLeaveDialog v-if="requestOpen" @close="requestOpen = false" />
</template>
