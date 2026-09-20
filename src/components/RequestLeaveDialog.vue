<script setup lang="ts">
import { computed, onMounted, reactive, useTemplateRef } from 'vue'
import { X } from 'lucide-vue-next'
import { useSubmitLeaveMutation } from '@/queries/leave'
import { useAuthStore } from '@/stores/auth'
import type { LeaveType } from '@/lib/supabase'
import { LEAVE_TYPE_LABEL, businessDays } from '@/lib/format'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'

const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const submitLeave = useSubmitLeaveMutation()

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  type: 'vacation' as LeaveType,
  start_date: '',
  end_date: '',
  reason: '',
})

const errors = reactive<Record<string, string | null>>({})

const days = computed(() =>
  form.start_date && form.end_date ? businessDays(form.start_date, form.end_date) : 0,
)

onMounted(() => dialog.value?.showModal())

function close() {
  dialog.value?.close()
  emit('close')
}

function validate() {
  errors.start_date = form.start_date ? null : 'Choose the first day you will be away.'
  errors.end_date = !form.end_date
    ? 'Choose the last day you will be away.'
    : form.end_date < form.start_date
      ? 'The last day cannot be before the first day.'
      : null
  errors.reason = form.reason.trim().length >= 4 ? null : 'Give your manager a short reason.'
  return !errors.start_date && !errors.end_date && !errors.reason
}

async function submit() {
  submitLeave.reset()
  if (!validate() || !auth.userId) return

  try {
    await submitLeave.mutateAsync({
      employee_id: auth.userId,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason.trim(),
    })
    close()
  } catch {
    // submitLeave.error is reactive and rendered below.
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-panel bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
    aria-labelledby="request-leave-title"
    @cancel.prevent="close"
  >
    <form class="flex flex-col" novalidate @submit.prevent="submit">
      <header class="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 id="request-leave-title" class="font-display text-lg font-semibold tracking-tight">
            Request leave
          </h2>
          <p class="mt-0.5 text-xs text-ink-faint">
            Goes to your manager as pending. You will see the decision here without refreshing.
          </p>
        </div>
        <button
          type="button"
          class="-mr-1.5 -mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Close"
          @click="close"
        >
          <X :size="17" :stroke-width="2" />
        </button>
      </header>

      <div class="flex flex-col gap-4 px-6 py-5">
        <FormField v-slot="{ id }" label="Type of leave" required>
          <select :id="id" v-model="form.type" class="field-select">
            <option v-for="(label, value) in LEAVE_TYPE_LABEL" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </FormField>

        <div class="grid grid-cols-2 gap-3">
          <FormField v-slot="{ id, describedBy, invalid }" label="First day" required :error="errors.start_date">
            <input
              :id="id" v-model="form.start_date" :aria-describedby="describedBy" :aria-invalid="invalid"
              type="date" :min="today" class="field-input"
            />
          </FormField>
          <FormField v-slot="{ id, describedBy, invalid }" label="Last day" required :error="errors.end_date">
            <input
              :id="id" v-model="form.end_date" :aria-describedby="describedBy" :aria-invalid="invalid"
              type="date" :min="form.start_date || today" class="field-input"
            />
          </FormField>
        </div>

        <p
          v-if="days > 0"
          class="-mt-1 rounded-[6px] bg-accent-wash px-3 py-2 text-sm text-accent-ink"
          aria-live="polite"
        >
          That is <span class="font-semibold" data-numeric>{{ days }}</span>
          working {{ days === 1 ? 'day' : 'days' }}.
        </p>

        <FormField v-slot="{ id, describedBy, invalid }" label="Reason" required :error="errors.reason">
          <textarea
            :id="id" v-model="form.reason" :aria-describedby="describedBy" :aria-invalid="invalid"
            class="field-textarea" rows="3"
            placeholder="Two weeks in Lagos for my sister's wedding."
          />
        </FormField>
      </div>

      <footer class="border-t border-border px-6 py-4">
        <p v-if="submitLeave.error.value" class="mb-3 rounded-[6px] bg-danger-soft px-3 py-2 text-sm text-[#87291f]" role="alert">
          {{ submitLeave.error.value.message }}
        </p>
        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="ghost" @click="close">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitLeave.isPending.value">Submit request</AppButton>
        </div>
      </footer>
    </form>
  </dialog>
</template>
