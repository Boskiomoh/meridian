<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useIsDesktop } from '@/composables/useMediaQuery'

const isDesktop = useIsDesktop()

withDefaults(
  defineProps<{
    title: string
    /** Live count of what the filters currently resolve to. */
    count?: number | null
    countNoun?: string
    /** Drives the inspector: present on desktop, a full sheet on mobile. */
    inspectorOpen?: boolean
    inspectorLabel?: string
    /** 'column' (default): a persistent third column on desktop. 'drawer':
     * an overlay panel that only occupies space while a record is selected. */
    inspectorMode?: 'column' | 'drawer'
  }>(),
  { count: null, countNoun: 'records', inspectorOpen: false, inspectorLabel: 'Details', inspectorMode: 'column' },
)

defineEmits<{ closeInspector: [] }>()
</script>

<template>
  <div class="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0">
    <!-- Sticky sub-header: what this section is, how much of it there is,
         and every control that narrows it. Nothing else lives here. -->
    <header
      class="sticky top-14 z-20 shrink-0 border-b border-border bg-bg/85 backdrop-blur-sm lg:top-0"
    >
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pb-3 pt-4 lg:px-7 lg:pt-5">
        <h1 class="font-display text-xl font-semibold tracking-tight text-ink">{{ title }}</h1>
        <span
          v-if="count !== null"
          data-numeric
          class="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-border"
        >
          {{ count }} {{ countNoun }}
        </span>
        <div class="ml-auto flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2 px-5 pb-3.5 lg:px-7">
        <slot name="filters" />
      </div>
    </header>

    <div class="flex min-h-0 flex-1 lg:overflow-hidden">
      <section class="min-w-0 flex-1 lg:overflow-y-auto" :aria-label="title">
        <slot name="list" />
      </section>

      <!-- Desktop, column mode: a persistent third column. The primary action
           always lands here, never in a row, so a mis-click can never decide
           a request. Rendered only on desktop so the sheet below is never a
           second copy. -->
      <aside
        v-if="$slots.inspector && isDesktop && inspectorMode === 'column'"
        class="w-[var(--inspector-w)] shrink-0 overflow-y-auto border-l border-border bg-surface"
        :aria-label="inspectorLabel"
      >
        <slot name="inspector" />
      </aside>
    </div>

    <!-- Desktop, drawer mode: an overlay panel that only claims space while a
         record is selected, instead of a column that sits there empty.
         Unmounted (not just hidden) when closed, so its buttons and links
         never sit in the tab order off-screen. -->
    <template v-if="$slots.inspector && isDesktop && inspectorMode === 'drawer'">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-150 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="inspectorOpen"
          class="fixed inset-0 z-30 bg-ink/25"
          @click="$emit('closeInspector')"
        />
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        leave-active-class="transition-transform duration-150 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="inspectorOpen"
          class="fixed inset-y-0 right-0 z-40 flex w-[min(34vw,720px)] min-w-[420px] flex-col border-l border-border bg-surface shadow-[var(--shadow-pop)]"
          :aria-label="inspectorLabel"
        >
          <div class="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <span class="font-display text-md font-semibold text-ink">{{ inspectorLabel }}</span>
            <button
              class="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
              aria-label="Close"
              @click="$emit('closeInspector')"
            >
              <X :size="18" :stroke-width="2" />
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <slot name="inspector" />
          </div>
        </aside>
      </Transition>
    </template>

    <!-- Mobile: the same inspector content as a sheet, not a squeezed column. -->
    <div
      v-if="$slots.inspector && inspectorOpen && !isDesktop"
      class="fixed inset-0 z-40 flex flex-col bg-surface"
      role="dialog"
      :aria-label="inspectorLabel"
    >
      <div class="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <span class="font-display text-md font-semibold text-ink">{{ inspectorLabel }}</span>
        <button
          class="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Close"
          @click="$emit('closeInspector')"
        >
          <X :size="18" :stroke-width="2" />
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <slot name="inspector" />
      </div>
    </div>
  </div>
</template>
