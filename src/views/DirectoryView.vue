<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, UserPlus, X } from 'lucide-vue-next'
import { useDepartmentsQuery, useVisiblePeople } from '@/queries/people'
import { useAuthStore } from '@/stores/auth'
import { EMPLOYMENT_STATUS_LABEL, ROLE_LABEL, formatDate } from '@/lib/format'
import type { Person } from '@/schemas'
import WorkSurface from '@/components/WorkSurface.vue'
import StatusPill from '@/components/StatusPill.vue'
import AvatarMark from '@/components/AvatarMark.vue'
import AppButton from '@/components/AppButton.vue'
import StateBlock from '@/components/StateBlock.vue'
import SkeletonRows from '@/components/SkeletonRows.vue'
import PersonInspector from '@/components/PersonInspector.vue'
import CreateEmployeeDialog from '@/components/CreateEmployeeDialog.vue'

const auth = useAuthStore()
const router = useRouter()
const { people, visible, isLoading, error, refetch, filters } = useVisiblePeople()
const { data: departments } = useDepartmentsQuery()

const selectedId = ref<string | null>(null)
const createOpen = ref(false)

const selected = computed<Person | null>(
  () => visible.value.find((p) => p.id === selectedId.value) ?? null,
)

// Keep a selection that the filters have just hidden from going stale.
watch(visible, (rows) => {
  if (selectedId.value && !rows.some((r) => r.id === selectedId.value)) selectedId.value = null
})

const STRIPE: Record<string, string> = {
  active: 'bg-success',
  on_leave: 'bg-brass',
  deactivated: 'bg-border-strong',
}

// One grid shared by the header and every row, so columns cannot drift apart.
const GRID =
  'grid items-center gap-4 grid-cols-[minmax(0,1fr)_auto]' +
  ' sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]' +
  ' lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_7rem_7.5rem]'

function openProfile(id: string) {
  void router.push({ name: 'person', params: { id } })
}
</script>

<template>
  <WorkSurface
    :title="auth.isAdmin ? 'Directory' : 'My team'"
    :count="isLoading ? null : visible.length"
    :count-noun="visible.length === 1 ? 'person' : 'people'"
    :inspector-open="selectedId !== null"
    inspector-label="Employee details"
    @close-inspector="selectedId = null"
  >
    <template #actions>
      <AppButton v-if="auth.isAdmin" variant="primary" size="sm" @click="createOpen = true">
        <UserPlus :size="15" :stroke-width="2" aria-hidden="true" />
        Add employee
      </AppButton>
    </template>

    <template #filters>
      <div class="relative min-w-0 basis-full sm:max-w-xs sm:basis-auto">
        <Search
          :size="15"
          :stroke-width="1.9"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          v-model="filters.search"
          type="search"
          class="field-input field-sm pl-8.5"
          placeholder="Search people"
          aria-label="Search people"
        />
      </div>

      <select v-model="filters.departmentFilter" class="field-select field-sm w-auto" aria-label="Filter by department">
        <option value="all">All departments</option>
        <option v-for="d in departments ?? []" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>

      <select v-model="filters.statusFilter" class="field-select field-sm w-auto" aria-label="Filter by status">
        <option value="all">Any status</option>
        <option v-for="(label, value) in EMPLOYMENT_STATUS_LABEL" :key="value" :value="value">
          {{ label }}
        </option>
      </select>

      <select v-model="filters.roleFilter" class="field-select field-sm w-auto" aria-label="Filter by role">
        <option value="all">Any role</option>
        <option v-for="(label, value) in ROLE_LABEL" :key="value" :value="value">{{ label }}</option>
      </select>

      <button
        v-if="filters.hasFilters"
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
        @click="filters.clearFilters()"
      >
        <X :size="13" :stroke-width="2.2" aria-hidden="true" />
        Clear
      </button>
    </template>

    <template #list>
      <SkeletonRows v-if="isLoading" :rows="10" />

      <StateBlock
        v-else-if="error"
        kind="error"
        title="The directory could not be loaded"
        :body="error.message"
        action-label="Try again"
        @action="refetch()"
      />

      <StateBlock
        v-else-if="people.length === 0"
        kind="empty"
        title="No people yet"
        body="Once employees are added to Northlane Studio they appear here, with their department, employment status and leave balance."
      />

      <StateBlock
        v-else-if="visible.length === 0"
        kind="no-results"
        title="No one matches those filters"
        body="Try a different department or status, or clear the filters to see everyone you have access to."
        action-label="Clear filters"
        @action="filters.clearFilters()"
      />

      <template v-else>
        <div
          class="sticky top-0 z-10 hidden border-b border-border bg-bg/90 backdrop-blur-sm lg:block"
        >
          <div :class="[GRID, 'py-2 pl-4 pr-5 text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint']">
            <span>Name</span>
            <span>Department</span>
            <span>Started</span>
            <span class="justify-self-end">Status</span>
          </div>
        </div>

        <ul class="divide-y divide-border">
          <li v-for="person in visible" :key="person.id">
            <button
              :class="[
                GRID,
                'relative w-full py-2.5 pl-4 pr-5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                selectedId === person.id ? 'bg-accent-soft' : 'hover:bg-surface-alt',
              ]"
              :aria-pressed="selectedId === person.id"
              @click="selectedId = selectedId === person.id ? null : person.id"
            >
              <!-- Full-bleed gutter stripe. Because it spans the row edge to
                   edge with no rounding, consecutive rows join into the one
                   unbroken vertical line the product is named for. -->
              <span
                class="absolute inset-y-0 left-0 w-[3px]"
                :class="STRIPE[person.employment_status]"
                aria-hidden="true"
              />

              <span class="flex min-w-0 items-center gap-2.5">
                <AvatarMark :name="person.full_name" size="sm" decorative />
                <span class="min-w-0">
                  <span class="flex items-center gap-1.5">
                    <span class="truncate text-sm font-medium text-ink">{{ person.full_name }}</span>
                    <span
                      v-if="person.role !== 'employee'"
                      class="shrink-0 rounded-full bg-nav px-1.5 py-px text-2xs font-medium text-ink-soft"
                    >
                      {{ ROLE_LABEL[person.role] }}
                    </span>
                  </span>
                  <span class="block truncate text-xs text-ink-faint">{{ person.title }}</span>
                </span>
              </span>

              <span class="hidden min-w-0 truncate text-sm text-ink-soft sm:block">
                {{ person.department?.name ?? '—' }}
              </span>

              <span class="hidden text-sm text-ink-faint lg:block" data-numeric>
                {{ formatDate(person.start_date) }}
              </span>

              <StatusPill :status="person.employment_status" class="justify-self-end" />
            </button>
          </li>
        </ul>
      </template>
    </template>

    <template #inspector>
      <PersonInspector
        :person="selected"
        @open-profile="openProfile"
        @close="selectedId = null"
      />
    </template>
  </WorkSurface>

  <CreateEmployeeDialog v-if="createOpen" @close="createOpen = false" />
</template>
