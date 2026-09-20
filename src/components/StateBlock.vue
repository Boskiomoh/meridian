<script setup lang="ts">
import { TriangleAlert, SearchX, Inbox } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'

withDefaults(
  defineProps<{
    kind: 'empty' | 'no-results' | 'error'
    title: string
    /** Empty states teach the interface; they never just say "nothing here". */
    body?: string
    actionLabel?: string
  }>(),
  { body: undefined, actionLabel: undefined },
)

defineEmits<{ action: [] }>()

const ICONS = { empty: Inbox, 'no-results': SearchX, error: TriangleAlert }
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span
      class="mb-4 inline-flex size-11 items-center justify-center rounded-full"
      :class="kind === 'error' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent'"
    >
      <component :is="ICONS[kind]" :size="20" :stroke-width="1.75" aria-hidden="true" />
    </span>

    <p class="font-display text-md font-semibold text-ink">{{ title }}</p>
    <p v-if="body" class="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{{ body }}</p>

    <AppButton
      v-if="actionLabel"
      class="mt-5"
      :variant="kind === 'error' ? 'secondary' : 'primary'"
      size="sm"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </AppButton>
  </div>
</template>
