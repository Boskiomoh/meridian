<script setup lang="ts">
import { computed } from 'vue'
import { initials } from '@/lib/format'

const props = withDefaults(
  defineProps<{
    name: string
    size?: 'sm' | 'md' | 'lg'
    /**
     * True where the name is already written next to the avatar, as in every
     * list row. Without this the name is announced twice and matches twice in
     * the DOM — the avatar is then pure decoration and says nothing.
     */
    decorative?: boolean
  }>(),
  { size: 'md', decorative: false },
)

const SIZES = {
  sm: 'size-7 text-2xs',
  md: 'size-9 text-xs',
  lg: 'size-14 text-lg',
}

/**
 * Deterministic tint from the name, drawn only from the accent and brass
 * families so 25 avatars never introduce a colour the palette does not own.
 */
const SWATCHES = [
  'bg-accent-soft text-accent-ink',
  'bg-brass-soft text-[#7d5720]',
  'bg-nav-deep text-ink-soft',
  'bg-success-soft text-[#2c5c34]',
] as const

const swatch = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) hash = (hash * 31 + props.name.charCodeAt(i)) >>> 0
  return SWATCHES[hash % SWATCHES.length]
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5"
    :class="[SIZES[size], swatch]"
    :title="decorative ? undefined : name"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <span aria-hidden="true">{{ initials(name) }}</span>
    <span v-if="!decorative" class="sr-only">{{ name }}</span>
  </span>
</template>
