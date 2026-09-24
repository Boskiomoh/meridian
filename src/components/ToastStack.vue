<script setup lang="ts">
import { CircleCheck, CircleAlert, Info, X } from 'lucide-vue-next'
import { useToast, type ToastVariant } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const ICON: Record<ToastVariant, typeof CircleCheck> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

// Same hue vocabulary as StatusPill's chip tones, so a toast reads as the
// same product as the pill it is reporting on.
const TONE: Record<ToastVariant, string> = {
  success: 'bg-success-soft text-[#2c5c34] ring-[#bcdbc2]',
  error: 'bg-danger-soft text-[#87291f] ring-[#e5bdb7]',
  info: 'bg-brass-soft text-[#7d5720] ring-[#e3cfa6]',
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 top-[calc(3.5rem+0.75rem)] z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96 lg:top-5"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        role="status"
        class="pointer-events-auto flex items-start gap-3 rounded-panel bg-surface px-4 py-3 shadow-[var(--shadow-pop)] ring-1 ring-inset ring-border"
      >
        <span
          class="inline-flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset"
          :class="TONE[t.variant]"
        >
          <component :is="ICON[t.variant]" :size="14" :stroke-width="2.2" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1 pt-0.5">
          <span class="block text-sm font-medium leading-snug text-ink">{{ t.title }}</span>
          <span v-if="t.description" class="mt-0.5 block text-xs leading-relaxed text-ink-soft">
            {{ t.description }}
          </span>
        </span>
        <button
          class="-mr-1 -mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Dismiss notification"
          @click="dismiss(t.id)"
        >
          <X :size="14" :stroke-width="2" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.toast-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}
@media (min-width: 640px) {
  .toast-leave-active {
    width: 24rem;
  }
}
.toast-move {
  transition: transform 200ms ease;
}
</style>
