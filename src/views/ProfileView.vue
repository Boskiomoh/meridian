<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Check, Pencil, X } from 'lucide-vue-next'
import { useEmployeesQuery, usePeopleById, useUpdateContactMutation } from '@/queries/people'
import { useAuthStore } from '@/stores/auth'
import { useLeaveRequestsQuery } from '@/queries/leave'
import { useEmployeeAttendanceQuery } from '@/queries/attendance'
import { useToast } from '@/composables/useToast'
import {
  EMPLOYMENT_STATUS_LABEL,
  ROLE_LABEL,
  businessDays,
  formatDate,
  formatDateRange,
} from '@/lib/format'
import AvatarMark from '@/components/AvatarMark.vue'
import StatusPill from '@/components/StatusPill.vue'
import AppButton from '@/components/AppButton.vue'
import StateBlock from '@/components/StateBlock.vue'
import FormField from '@/components/FormField.vue'
import DocumentPanel from '@/components/DocumentPanel.vue'

const route = useRoute()
const auth = useAuthStore()

const { isPending: peopleLoading } = useEmployeesQuery()
const peopleById = usePeopleById()
const { data: leaveRequests } = useLeaveRequestsQuery()
const updateContact = useUpdateContactMutation()
const toast = useToast()

const personId = computed(() =>
  route.name === 'me' ? auth.userId : ((route.params.id as string | undefined) ?? null),
)

const { data: attendanceData, isPending: attendanceLoading } = useEmployeeAttendanceQuery(personId, 30)
const attendance = computed(() => attendanceData.value ?? [])

const person = computed(() => (personId.value ? (peopleById.value.get(personId.value) ?? null) : null))
const isSelf = computed(() => personId.value === auth.userId)
const canEditContact = computed(() => isSelf.value || auth.isAdmin)

const manager = computed(() =>
  person.value?.manager_id ? (peopleById.value.get(person.value.manager_id) ?? null) : null,
)

// --- contact editing ---------------------------------------------------------
const editing = ref(false)
const draft = ref({ phone: '', location: '' })
const saveError = ref<string | null>(null)

function startEdit() {
  draft.value = { phone: person.value?.phone ?? '', location: person.value?.location ?? '' }
  saveError.value = null
  editing.value = true
}

async function save() {
  if (!person.value) return
  saveError.value = null
  try {
    await updateContact.mutateAsync({
      id: person.value.id,
      patch: {
        phone: draft.value.phone.trim() || null,
        location: draft.value.location.trim() || null,
      },
    })
    toast.success('Contact details updated')
    editing.value = false
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save those details.'
    saveError.value = message
    toast.error('Could not save those details', message)
  }
}

// --- derived summaries -------------------------------------------------------
const myLeave = computed(() =>
  (leaveRequests.value ?? [])
    .filter((r) => r.employee_id === personId.value)
    .slice()
    .sort((a, b) => b.start_date.localeCompare(a.start_date)),
)

const usedDays = computed(() => {
  const year = new Date().getUTCFullYear()
  return myLeave.value
    .filter((r) => r.status === 'approved' && r.start_date.startsWith(String(year)))
    .reduce((sum, r) => sum + businessDays(r.start_date, r.end_date), 0)
})

const remainingDays = computed(() =>
  person.value ? Math.max(0, person.value.leave_allowance_days - usedDays.value) : 0,
)

/** Attendance over the trailing 30 calendar days. */
const attendanceSummary = computed(() => {
  const recorded = attendance.value.length
  let expected = 0
  const cursor = new Date()
  for (let i = 0; i < 30; i++) {
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) expected++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return {
    recorded,
    expected,
    rate: expected === 0 ? 0 : Math.round((recorded / expected) * 100),
  }
})

watch(personId, () => {
  editing.value = false
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
    <RouterLink
      v-if="!isSelf"
      :to="{ name: 'directory' }"
      class="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-ink"
    >
      <ArrowLeft :size="15" :stroke-width="1.9" aria-hidden="true" />
      Back to directory
    </RouterLink>

    <div v-if="peopleLoading" class="flex flex-col gap-4">
      <span class="skeleton h-24 w-full rounded-panel" aria-hidden="true" />
      <span class="skeleton h-48 w-full rounded-panel" aria-hidden="true" />
      <span class="sr-only">Loading profile</span>
    </div>

    <StateBlock
      v-else-if="!person"
      kind="empty"
      title="That person is not visible to you"
      body="You can only open records you have access to. An employee sees their own record; a manager sees their direct reports."
    />

    <template v-else>
      <!-- Identity header -->
      <header class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border lg:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AvatarMark :name="person.full_name" size="lg" decorative />
          <div class="min-w-0 flex-1">
            <h1 class="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
              {{ person.full_name }}
            </h1>
            <p class="mt-1 text-md text-ink-soft">
              {{ person.title }}
              <span v-if="person.department"> · {{ person.department.name }}</span>
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusPill :status="person.employment_status" />
              <span class="rounded-full bg-nav px-2 py-0.5 text-2xs font-medium text-ink-soft">
                {{ ROLE_LABEL[person.role] }}
              </span>
              <span class="text-xs text-ink-faint" data-numeric>
                Joined {{ formatDate(person.start_date) }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Three summaries, deliberately different shapes so they do not read
           as a row of identical stat cards. -->
      <div class="mt-5 grid gap-5 lg:grid-cols-3">
        <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <h2 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">
            Leave balance
          </h2>
          <p class="mt-2 flex items-baseline gap-1.5">
            <span class="font-display text-3xl font-semibold text-ink" data-numeric>
              {{ remainingDays }}
            </span>
            <span class="text-sm text-ink-soft" data-numeric>
              of {{ person.leave_allowance_days }} days
            </span>
          </p>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <div
              class="h-full rounded-full bg-accent-mid"
              :style="{ width: `${Math.min(100, (usedDays / person.leave_allowance_days) * 100)}%` }"
            />
          </div>
          <p class="mt-2 text-xs text-ink-faint" data-numeric>{{ usedDays }} days taken this year</p>
        </section>

        <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <h2 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">
            Attendance, last 30 days
          </h2>
          <div v-if="attendanceLoading" class="mt-2">
            <span class="skeleton block h-9 w-24 rounded" aria-hidden="true" />
          </div>
          <template v-else>
            <p class="mt-2 flex items-baseline gap-1.5">
              <span class="font-display text-3xl font-semibold text-ink" data-numeric>
                {{ attendanceSummary.rate }}%
              </span>
            </p>
            <p class="mt-3 text-xs text-ink-faint" data-numeric>
              {{ attendanceSummary.recorded }} of {{ attendanceSummary.expected }} working days recorded
            </p>
          </template>
        </section>

        <section class="rounded-panel bg-surface p-5 ring-1 ring-inset ring-border">
          <div class="flex items-start justify-between gap-2">
            <h2 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">Contact</h2>
            <button
              v-if="canEditContact && !editing"
              class="-mr-1 -mt-1 inline-flex size-7 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
              :aria-label="`Edit contact details`"
              @click="startEdit"
            >
              <Pencil :size="14" :stroke-width="1.9" />
            </button>
          </div>

          <form v-if="editing" class="mt-3 flex flex-col gap-3" @submit.prevent="save">
            <FormField v-slot="{ id }" label="Phone">
              <input :id="id" v-model="draft.phone" type="tel" class="field-input" />
            </FormField>
            <FormField v-slot="{ id }" label="Location">
              <input :id="id" v-model="draft.location" type="text" class="field-input" />
            </FormField>
            <p v-if="saveError" class="text-xs text-danger" role="alert">{{ saveError }}</p>
            <div class="flex gap-2">
              <AppButton type="submit" variant="primary" size="sm" :loading="updateContact.isPending.value">
                <Check :size="14" :stroke-width="2.2" aria-hidden="true" />
                Save
              </AppButton>
              <AppButton type="button" variant="ghost" size="sm" @click="editing = false">
                <X :size="14" :stroke-width="2.2" aria-hidden="true" />
                Cancel
              </AppButton>
            </div>
          </form>

          <dl v-else class="mt-2.5 flex flex-col gap-2 text-sm">
            <div>
              <dt class="sr-only">Email</dt>
              <dd class="truncate">
                <a :href="`mailto:${person.email}`" class="text-accent hover:underline">
                  {{ person.email }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="sr-only">Phone</dt>
              <dd class="text-ink" data-numeric>{{ person.phone ?? '—' }}</dd>
            </div>
            <div>
              <dt class="sr-only">Location</dt>
              <dd class="text-ink">{{ person.location ?? '—' }}</dd>
            </div>
            <div v-if="manager">
              <dt class="sr-only">Reports to</dt>
              <dd class="text-ink-soft">Reports to {{ manager.full_name }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- Leave history -->
      <section class="mt-5 overflow-hidden rounded-panel bg-surface ring-1 ring-inset ring-border">
        <h2 class="border-b border-border px-5 py-3.5 font-display text-md font-semibold tracking-tight text-ink">
          Leave history
        </h2>
        <p v-if="myLeave.length === 0" class="px-5 py-8 text-center text-sm text-ink-soft">
          No leave has been requested yet.
        </p>
        <ul v-else class="divide-y divide-border">
          <li
            v-for="request in myLeave.slice(0, 8)"
            :key="request.id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-ink" data-numeric>
                {{ formatDateRange(request.start_date, request.end_date) }}
              </span>
              <span class="block truncate text-xs text-ink-faint">{{ request.reason }}</span>
            </span>
            <span class="hidden w-16 shrink-0 text-sm text-ink-soft sm:block" data-numeric>
              {{ businessDays(request.start_date, request.end_date) }}d
            </span>
            <StatusPill :status="request.status" />
          </li>
        </ul>
      </section>

      <!-- Attendance log -->
      <section class="mt-5 overflow-hidden rounded-panel bg-surface ring-1 ring-inset ring-border">
        <h2 class="border-b border-border px-5 py-3.5 font-display text-md font-semibold tracking-tight text-ink">
          Recent attendance
        </h2>
        <p v-if="!attendanceLoading && attendance.length === 0" class="px-5 py-8 text-center text-sm text-ink-soft">
          No attendance has been recorded in the last 30 days.
        </p>
        <ul v-else class="divide-y divide-border">
          <li
            v-for="row in attendance.slice(0, 10)"
            :key="row.date"
            class="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
          >
            <span class="text-ink" data-numeric>{{ formatDate(row.date) }}</span>
            <span class="text-ink-soft" data-numeric>
              {{ row.check_in ? new Date(row.check_in).toISOString().slice(11, 16) : '—' }}
              →
              {{ row.check_out ? new Date(row.check_out).toISOString().slice(11, 16) : '—' }}
            </span>
          </li>
        </ul>
      </section>

      <DocumentPanel :employee-id="person.id" :can-upload="isSelf || auth.isAdmin" class="mt-5" />

      <!-- Employment facts an admin may change live in the directory inspector;
           here they are stated, not editable, to keep one place of truth. -->
      <p class="mt-5 text-xs text-ink-faint">
        Employment status is {{ EMPLOYMENT_STATUS_LABEL[person.employment_status].toLowerCase() }}.
        Only an HR admin can change roles, reporting lines or employment details.
      </p>
    </template>
  </div>
</template>
