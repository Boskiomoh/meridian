<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays, CalendarCheck2, MessageSquareQuote, CircleAlert } from 'lucide-vue-next'
import { useDecideLeaveMutation, useLeaveRequestsQuery } from '@/queries/leave'
import { usePeopleById } from '@/queries/people'
import type { LeaveRequest } from '@/schemas'
import { LEAVE_TYPE_LABEL, businessDays, formatDate, formatDateRange } from '@/lib/format'
import AvatarMark from '@/components/AvatarMark.vue'
import StatusPill from '@/components/StatusPill.vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ request: LeaveRequest | null; canDecide: boolean }>()
defineEmits<{ close: [] }>()

const { data: allRequests } = useLeaveRequestsQuery()
const peopleById = usePeopleById()
const decide = useDecideLeaveMutation()

const comment = ref('')
const localError = ref<string | null>(null)
const busy = ref<'approved' | 'denied' | null>(null)

watch(
  () => props.request?.id,
  () => {
    comment.value = ''
    localError.value = null
    busy.value = null
  },
)

const decidable = computed(() => props.canDecide && props.request?.status === 'pending')

const days = computed(() =>
  props.request ? businessDays(props.request.start_date, props.request.end_date) : 0,
)

/** Who else on this person's team is already away across the same dates. */
const clashes = computed(() => {
  if (!props.request) return []
  const me = peopleById.value.get(props.request.employee_id)
  if (!me) return []
  return (allRequests.value ?? []).filter((r) => {
    if (r.id === props.request!.id || r.status !== 'approved') return false
    const other = peopleById.value.get(r.employee_id)
    if (!other || other.department_id !== me.department_id) return false
    return r.start_date <= props.request!.end_date && r.end_date >= props.request!.start_date
  })
})

async function makeDecision(status: 'approved' | 'denied') {
  if (!props.request) return
  busy.value = status
  localError.value = null
  try {
    await decide.mutateAsync({ id: props.request.id, status, comment: comment.value })
    comment.value = ''
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Could not save that decision.'
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div
    v-if="!request"
    class="flex h-full flex-col items-center justify-center gap-3 px-8 py-16 text-center"
  >
    <span class="inline-flex size-10 items-center justify-center rounded-full bg-surface-alt">
      <CalendarDays :size="18" :stroke-width="1.7" class="text-ink-faint" aria-hidden="true" />
    </span>
    <p class="text-sm font-medium text-ink-soft">Select a request to review it</p>
    <p class="max-w-[24ch] text-xs leading-relaxed text-ink-faint">
      The dates, the reason and who else is already away appear here.
    </p>
  </div>

  <div v-else class="flex h-full flex-col">
    <div class="border-b border-border px-5 py-5">
      <div class="flex items-start gap-3">
        <AvatarMark :name="request.employee_name" size="md" decorative />
        <div class="min-w-0 flex-1">
          <h2 class="font-display text-md font-semibold leading-tight text-ink">
            {{ request.employee_name }}
          </h2>
          <p class="mt-0.5 text-xs text-ink-faint">{{ request.employee_title }}</p>
        </div>
        <StatusPill :status="request.status" />
      </div>

      <div class="mt-4 rounded-panel bg-surface-alt px-3.5 py-3">
        <p class="font-display text-md font-semibold text-ink" data-numeric>
          {{ formatDateRange(request.start_date, request.end_date) }}
        </p>
        <p class="mt-0.5 text-xs text-ink-soft">
          <span data-numeric>{{ days }}</span> working {{ days === 1 ? 'day' : 'days' }} ·
          {{ LEAVE_TYPE_LABEL[request.type] }}
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <section class="border-b border-border px-5 py-4">
        <h3 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">Reason given</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-ink">{{ request.reason }}</p>
      </section>

      <!-- The fact a manager actually needs before deciding. -->
      <section v-if="decidable" class="border-b border-border px-5 py-4">
        <h3 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">
          Team coverage
        </h3>
        <p v-if="clashes.length === 0" class="mt-1.5 text-sm text-ink-soft">
          No one else in this department is approved off across these dates.
        </p>
        <ul v-else class="mt-2 flex flex-col gap-1.5">
          <li
            v-for="clash in clashes"
            :key="clash.id"
            class="flex items-start gap-2 text-sm text-ink-soft"
          >
            <CircleAlert :size="14" :stroke-width="2" class="mt-0.5 shrink-0 text-brass" aria-hidden="true" />
            <span>
              <span class="font-medium text-ink">{{ clash.employee_name }}</span>
              is away
              <span data-numeric>{{ formatDateRange(clash.start_date, clash.end_date) }}</span>
            </span>
          </li>
        </ul>
      </section>

      <section v-if="request.status !== 'pending'" class="border-b border-border px-5 py-4">
        <h3 class="text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">Decision</h3>
        <p class="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
          <CalendarCheck2 :size="14" :stroke-width="1.9" class="shrink-0 text-ink-faint" aria-hidden="true" />
          <span>
            {{ request.decider_name ? `${request.decider_name} decided` : 'Decided' }}
            <span data-numeric>{{ formatDate(request.decided_at) }}</span>
          </span>
        </p>
        <p
          v-if="request.comment"
          class="mt-2.5 flex gap-2 rounded-panel bg-surface-alt px-3 py-2.5 text-sm leading-relaxed text-ink"
        >
          <MessageSquareQuote :size="14" :stroke-width="1.9" class="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
          {{ request.comment }}
        </p>
      </section>

      <section v-else-if="!canDecide" class="px-5 py-4">
        <p class="text-sm text-ink-soft">
          Waiting on a decision. The status here updates the moment your manager responds —
          you do not need to refresh.
        </p>
      </section>
    </div>

    <!-- Decision sits at the inspector's foot, never in a row. -->
    <div v-if="decidable" class="sticky bottom-0 border-t border-border bg-surface px-5 py-4">
      <label for="decision-comment" class="mb-1.5 block text-xs font-medium text-ink-soft">
        Comment
        <span class="font-normal text-ink-faint">— optional, shown to the requester</span>
      </label>
      <textarea
        id="decision-comment"
        v-model="comment"
        class="field-textarea"
        rows="2"
        placeholder="Covered by the rest of the team, enjoy."
      />

      <p v-if="localError" class="mt-2.5 text-xs text-danger" role="alert">{{ localError }}</p>

      <div class="mt-3 flex gap-2">
        <AppButton
          variant="primary"
          size="sm"
          class="flex-1"
          :loading="busy === 'approved'"
          :disabled="busy !== null"
          @click="makeDecision('approved')"
        >
          Approve
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          class="flex-1"
          :loading="busy === 'denied'"
          :disabled="busy !== null"
          @click="makeDecision('denied')"
        >
          Deny
        </AppButton>
      </div>
    </div>
  </div>
</template>
