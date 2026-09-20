<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mail, Phone, MapPin, Building2, CalendarDays, UserRound, ArrowUpRight } from 'lucide-vue-next'
import type { Person } from '@/schemas'
import { usePeopleById, useSetEmploymentStatusMutation } from '@/queries/people'
import { useLeaveRequestsQuery } from '@/queries/leave'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL, businessDays, formatDate } from '@/lib/format'
import AvatarMark from '@/components/AvatarMark.vue'
import StatusPill from '@/components/StatusPill.vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ person: Person | null }>()
const emit = defineEmits<{ openProfile: [id: string]; close: [] }>()

const auth = useAuthStore()
const peopleById = usePeopleById()
const { data: leaveRequests, isPending: leaveLoading } = useLeaveRequestsQuery()
const setStatus = useSetEmploymentStatusMutation()

const actionError = ref<string | null>(null)

const manager = computed(() =>
  props.person?.manager_id ? (peopleById.value.get(props.person.manager_id) ?? null) : null,
)

/** Approved leave in the current calendar year, counted in business days -- read
 * straight from the shared leave cache, so opening this after visiting the
 * Leave view costs no extra fetch. */
const usedDays = computed(() => {
  if (!props.person) return null
  const year = new Date().getUTCFullYear()
  return (leaveRequests.value ?? [])
    .filter(
      (r) =>
        r.employee_id === props.person!.id && r.status === 'approved' && r.start_date.startsWith(String(year)),
    )
    .reduce((sum, r) => sum + businessDays(r.start_date, r.end_date), 0)
})

const remaining = computed(() => {
  if (!props.person || usedDays.value === null) return null
  return Math.max(0, props.person.leave_allowance_days - usedDays.value)
})

async function toggleActive() {
  if (!props.person) return
  actionError.value = null
  try {
    await setStatus.mutateAsync({
      id: props.person.id,
      status: props.person.employment_status === 'deactivated' ? 'active' : 'deactivated',
    })
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not update employment status.'
  }
}
</script>

<template>
  <!-- Resting state. The inspector always occupies its column so the layout
       never reflows when a row is picked. -->
  <div
    v-if="!person"
    class="flex h-full flex-col items-center justify-center gap-3 px-8 py-16 text-center"
  >
    <span class="inline-flex size-10 items-center justify-center rounded-full bg-surface-alt">
      <UserRound :size="18" :stroke-width="1.7" class="text-ink-faint" aria-hidden="true" />
    </span>
    <p class="text-sm font-medium text-ink-soft">Select someone to see their details</p>
    <p class="max-w-[22ch] text-xs leading-relaxed text-ink-faint">
      Their department, leave balance and contact details appear here.
    </p>
  </div>

  <div v-else class="flex h-full flex-col">
    <div class="border-b border-border px-5 py-5">
      <div class="flex items-start gap-3.5">
        <AvatarMark :name="person.full_name" size="lg" decorative />
        <div class="min-w-0 flex-1">
          <h2 class="font-display text-lg font-semibold leading-tight tracking-tight text-ink">
            {{ person.full_name }}
          </h2>
          <p class="mt-0.5 text-sm text-ink-soft">{{ person.title }}</p>
          <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatusPill :status="person.employment_status" />
            <span
              v-if="person.role !== 'employee'"
              class="rounded-full bg-nav px-2 py-0.5 text-2xs font-medium text-ink-soft"
            >
              {{ ROLE_LABEL[person.role] }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave balance: the number a manager actually wants when judging a request. -->
    <div class="border-b border-border px-5 py-4">
      <p class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">
        Leave balance this year
      </p>
      <div v-if="leaveLoading" class="mt-2.5 flex items-end gap-2">
        <span class="skeleton h-7 w-14 rounded" aria-hidden="true" />
        <span class="skeleton mb-1 h-3 w-24 rounded" aria-hidden="true" />
      </div>
      <div v-else class="mt-1.5 flex items-baseline gap-1.5">
        <span class="font-display text-2xl font-semibold text-ink" data-numeric>
          {{ remaining ?? '—' }}
        </span>
        <span class="text-sm text-ink-soft" data-numeric>
          of {{ person.leave_allowance_days }} days left
        </span>
      </div>
      <div
        v-if="remaining !== null"
        class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-alt"
        role="img"
        :aria-label="`${usedDays} of ${person.leave_allowance_days} days used`"
      >
        <div
          class="h-full rounded-full bg-accent-mid transition-[width] duration-300"
          :style="{ width: `${Math.min(100, ((usedDays ?? 0) / person.leave_allowance_days) * 100)}%` }"
        />
      </div>
    </div>

    <dl class="flex-1 divide-y divide-border">
      <div class="flex items-center gap-3 px-5 py-3">
        <Building2 :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Department</dt>
        <dd class="text-sm text-ink">{{ person.department?.name ?? 'Unassigned' }}</dd>
      </div>
      <div class="flex items-center gap-3 px-5 py-3">
        <CalendarDays :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Start date</dt>
        <dd class="text-sm text-ink" data-numeric>Joined {{ formatDate(person.start_date) }}</dd>
      </div>
      <div class="flex items-center gap-3 px-5 py-3">
        <Mail :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Email</dt>
        <dd class="min-w-0 truncate text-sm">
          <a :href="`mailto:${person.email}`" class="text-accent hover:underline">{{ person.email }}</a>
        </dd>
      </div>
      <div v-if="person.phone" class="flex items-center gap-3 px-5 py-3">
        <Phone :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Phone</dt>
        <dd class="text-sm text-ink" data-numeric>{{ person.phone }}</dd>
      </div>
      <div v-if="person.location" class="flex items-center gap-3 px-5 py-3">
        <MapPin :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Location</dt>
        <dd class="text-sm text-ink">{{ person.location }}</dd>
      </div>
      <div v-if="manager" class="flex items-center gap-3 px-5 py-3">
        <UserRound :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <dt class="sr-only">Reports to</dt>
        <dd class="text-sm text-ink-soft">Reports to {{ manager.full_name }}</dd>
      </div>
    </dl>

    <!-- Every primary action for this record lives at the inspector's foot. -->
    <div class="sticky bottom-0 mt-auto border-t border-border bg-surface px-5 py-4">
      <p v-if="actionError" class="mb-2.5 text-xs text-danger" role="alert">{{ actionError }}</p>
      <div class="flex gap-2">
        <AppButton variant="primary" size="sm" class="flex-1" @click="emit('openProfile', person.id)">
          Open profile
          <ArrowUpRight :size="14" :stroke-width="2" aria-hidden="true" />
        </AppButton>
        <AppButton
          v-if="auth.isAdmin && person.id !== auth.userId"
          :variant="person.employment_status === 'deactivated' ? 'secondary' : 'danger'"
          size="sm"
          :loading="setStatus.isPending.value"
          @click="toggleActive"
        >
          {{ person.employment_status === 'deactivated' ? 'Reactivate' : 'Deactivate' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
