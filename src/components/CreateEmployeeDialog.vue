<script setup lang="ts">
import { computed, onMounted, reactive, useTemplateRef } from 'vue'
import { X } from 'lucide-vue-next'
import { useCreateEmployeeMutation, useDepartmentsQuery, useEmployeesQuery } from '@/queries/people'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'

const emit = defineEmits<{ close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const { data: departments } = useDepartmentsQuery()
const { data: employees } = useEmployeesQuery()
const createEmployee = useCreateEmployeeMutation()

const form = reactive({
  full_name: '',
  email: '',
  title: '',
  department_id: '',
  start_date: new Date().toISOString().slice(0, 10),
  role: 'employee' as 'employee' | 'manager' | 'admin',
  manager_id: '',
  leave_allowance_days: 25,
})

const errors = reactive<Record<string, string | null>>({})

const managers = computed(() =>
  (employees.value ?? [])
    .filter((p) => p.role !== 'employee' && p.employment_status !== 'deactivated')
    .sort((a, b) => a.full_name.localeCompare(b.full_name)),
)

onMounted(() => dialog.value?.showModal())

function close() {
  dialog.value?.close()
  emit('close')
}

function validate() {
  errors.full_name = form.full_name.trim() ? null : 'Enter the person’s full name.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? null
    : 'Enter a valid work email address.'
  errors.title = form.title.trim() ? null : 'Enter their job title.'
  errors.start_date = form.start_date ? null : 'Choose a start date.'
  return !errors.full_name && !errors.email && !errors.title && !errors.start_date
}

async function submit() {
  createEmployee.reset()
  if (!validate()) return

  try {
    await createEmployee.mutateAsync({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      title: form.title.trim(),
      department_id: form.department_id || null,
      start_date: form.start_date,
      role: form.role,
      manager_id: form.manager_id || null,
      leave_allowance_days: Number(form.leave_allowance_days) || 25,
    })
    close()
  } catch {
    // createEmployee.error is reactive and rendered below; nothing else to do.
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-panel bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
    aria-labelledby="create-employee-title"
    @cancel.prevent="close"
  >
    <form class="flex max-h-[85dvh] flex-col" novalidate @submit.prevent="submit">
      <header class="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 id="create-employee-title" class="font-display text-lg font-semibold tracking-tight">
            Add an employee
          </h2>
          <p class="mt-0.5 text-xs text-ink-faint">
            Creates their account and directory record. They keep the same reporting line until you change it.
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

      <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
        <FormField v-slot="{ id, describedBy, invalid }" label="Full name" required :error="errors.full_name" class="sm:col-span-2">
          <input
            :id="id" v-model="form.full_name" :aria-describedby="describedBy" :aria-invalid="invalid"
            type="text" autocomplete="off" class="field-input" placeholder="Rosa Lindqvist"
          />
        </FormField>

        <FormField v-slot="{ id, describedBy, invalid }" label="Work email" required :error="errors.email" class="sm:col-span-2">
          <input
            :id="id" v-model="form.email" :aria-describedby="describedBy" :aria-invalid="invalid"
            type="email" autocomplete="off" class="field-input" placeholder="rosa.lindqvist@northlane.studio"
          />
        </FormField>

        <FormField v-slot="{ id, describedBy, invalid }" label="Job title" required :error="errors.title">
          <input
            :id="id" v-model="form.title" :aria-describedby="describedBy" :aria-invalid="invalid"
            type="text" class="field-input" placeholder="Service Designer"
          />
        </FormField>

        <FormField v-slot="{ id }" label="Department">
          <select :id="id" v-model="form.department_id" class="field-select">
            <option value="">Unassigned</option>
            <option v-for="d in departments ?? []" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </FormField>

        <FormField v-slot="{ id, describedBy, invalid }" label="Start date" required :error="errors.start_date">
          <input :id="id" v-model="form.start_date" :aria-describedby="describedBy" :aria-invalid="invalid" type="date" class="field-input" />
        </FormField>

        <FormField v-slot="{ id }" label="Role" required>
          <select :id="id" v-model="form.role" class="field-select">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">HR Admin</option>
          </select>
        </FormField>

        <FormField v-slot="{ id }" label="Reports to">
          <select :id="id" v-model="form.manager_id" class="field-select">
            <option value="">No manager</option>
            <option v-for="m in managers" :key="m.id" :value="m.id">
              {{ m.full_name }} — {{ m.title }}
            </option>
          </select>
        </FormField>

        <FormField v-slot="{ id }" label="Annual leave" hint="Working days per year.">
          <input :id="id" v-model.number="form.leave_allowance_days" type="number" min="0" max="365" class="field-input" />
        </FormField>
      </div>

      <footer class="shrink-0 border-t border-border px-6 py-4">
        <p v-if="createEmployee.error.value" class="mb-3 rounded-[6px] bg-danger-soft px-3 py-2 text-sm text-[#87291f]" role="alert">
          {{ createEmployee.error.value.message }}
        </p>
        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="ghost" @click="close">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="createEmployee.isPending.value">Add employee</AppButton>
        </div>
      </footer>
    </form>
  </dialog>
</template>
