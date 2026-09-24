<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText, Trash2, Upload } from 'lucide-vue-next'
import { useDeleteDocumentMutation, useDocumentsQuery, useUploadDocumentMutation, getDocumentSignedUrl } from '@/queries/documents'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/lib/format'
import type { DocumentRow } from '@/schemas'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ employeeId: string; canUpload: boolean }>()

const employeeId = computed(() => props.employeeId)
const { data: documents, isPending: loading } = useDocumentsQuery(employeeId)
const upload = useUploadDocumentMutation(employeeId)
const remove = useDeleteDocumentMutation(employeeId)
const { confirm } = useConfirm()
const toast = useToast()

const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const busy = computed(() => upload.isPending.value || remove.isPending.value)

async function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  error.value = null
  try {
    await upload.mutateAsync(file)
    toast.success('Document uploaded', file.name)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not upload that file.'
    error.value = message
    toast.error('Could not upload that file', message)
  }
  input.value = ''
}

async function onRemove(doc: DocumentRow) {
  const ok = await confirm({
    title: `Delete ${doc.file_name}?`,
    body: 'This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (!ok) return

  error.value = null
  try {
    await remove.mutateAsync(doc)
    toast.success('Document deleted', doc.file_name)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not delete that document.'
    error.value = message
    toast.error('Could not delete that document', message)
  }
}

async function open(doc: DocumentRow) {
  try {
    const url = await getDocumentSignedUrl(doc.storage_path)
    window.open(url, '_blank', 'noopener')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open that document.'
    error.value = message
    toast.error('Could not open that document', message)
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-panel bg-surface ring-1 ring-inset ring-border">
    <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <div>
        <h2 class="font-display text-md font-semibold tracking-tight text-ink">Documents</h2>
        <p class="mt-0.5 text-xs text-ink-faint">
          Demo storage only — do not upload anything real.
        </p>
      </div>
      <AppButton
        v-if="canUpload"
        variant="secondary"
        size="sm"
        :loading="busy"
        @click="fileInput?.click()"
      >
        <Upload :size="14" :stroke-width="1.9" aria-hidden="true" />
        Upload
      </AppButton>
      <input
        ref="fileInput"
        type="file"
        class="sr-only"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        @change="onPick"
      />
    </div>

    <p v-if="error" class="border-b border-border bg-danger-soft px-5 py-2.5 text-sm text-[#87291f]" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="px-5 py-5">
      <span class="skeleton block h-4 w-48 rounded" aria-hidden="true" />
      <span class="sr-only">Loading documents</span>
    </div>

    <p v-else-if="(documents ?? []).length === 0" class="px-5 py-8 text-center text-sm text-ink-soft">
      No documents yet.
      <span v-if="canUpload">Contracts and policy acknowledgements would live here.</span>
    </p>

    <ul v-else class="divide-y divide-border">
      <li
        v-for="doc in documents"
        :key="doc.id"
        class="flex items-center gap-3 px-5 py-3"
      >
        <FileText :size="16" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
        <button
          class="min-w-0 flex-1 truncate text-left text-sm text-ink transition-colors duration-150 hover:text-accent hover:underline"
          @click="open(doc)"
        >
          {{ doc.file_name }}
        </button>
        <span class="hidden shrink-0 text-xs text-ink-faint sm:block" data-numeric>
          {{ formatDate(doc.uploaded_at) }}
        </span>
        <button
          v-if="canUpload"
          class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
          :aria-label="`Delete ${doc.file_name}`"
          :disabled="busy"
          @click="onRemove(doc)"
        >
          <Trash2 :size="14" :stroke-width="1.9" />
        </button>
      </li>
    </ul>
  </section>
</template>
