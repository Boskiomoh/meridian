<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useConfirmState } from '@/composables/useConfirm'
import AppButton from '@/components/AppButton.vue'

const { state, settle } = useConfirmState()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

watch(
  () => state.open,
  (open) => {
    if (open) dialog.value?.showModal()
    else dialog.value?.close()
  },
)

function cancel() {
  settle(false)
}

function confirm() {
  settle(true)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-panel bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
    aria-labelledby="confirm-dialog-title"
    @cancel.prevent="cancel"
  >
    <div class="px-6 py-5">
      <h2 id="confirm-dialog-title" class="font-display text-lg font-semibold tracking-tight text-ink">
        {{ state.title }}
      </h2>
      <p v-if="state.body" class="mt-2 text-sm leading-relaxed text-ink-soft">{{ state.body }}</p>
    </div>
    <footer class="flex justify-end gap-2 border-t border-border px-6 py-4">
      <AppButton type="button" variant="ghost" autofocus @click="cancel">{{ state.cancelLabel }}</AppButton>
      <AppButton
        type="button"
        :variant="state.variant === 'danger' ? 'danger' : 'primary'"
        @click="confirm"
      >
        {{ state.confirmLabel }}
      </AppButton>
    </footer>
  </dialog>
</template>
