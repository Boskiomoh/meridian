<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    block?: boolean
  }>(),
  { variant: 'secondary', size: 'md', loading: false, disabled: false, type: 'button', block: false },
)

const isBlocked = computed(() => props.disabled || props.loading)

// One shape vocabulary across the whole product: full pill, same height ramp,
// same focus treatment. A "save" that looks different on two screens is a bug.
const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,box-shadow,border-color] duration-150 select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:cursor-not-allowed'

const SIZES = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-9.5 px-4 text-sm',
}

const VARIANTS = {
  primary:
    'bg-accent text-ink-invert shadow-raise hover:bg-accent-mid active:bg-accent-ink ' +
    'disabled:bg-border-strong disabled:text-ink-faint disabled:shadow-none',
  secondary:
    'bg-surface text-ink ring-1 ring-inset ring-border-strong hover:bg-surface-alt hover:ring-ink-faint ' +
    'active:bg-nav disabled:bg-surface-alt disabled:text-ink-faint disabled:ring-border',
  ghost:
    'bg-transparent text-ink-soft hover:bg-nav hover:text-ink active:bg-nav-deep ' +
    'disabled:text-ink-faint disabled:hover:bg-transparent',
  danger:
    'bg-surface text-danger ring-1 ring-inset ring-[#e5bdb7] hover:bg-danger-soft hover:ring-danger ' +
    'active:bg-[#f0d2cd] disabled:bg-surface-alt disabled:text-ink-faint disabled:ring-border',
}
</script>

<template>
  <button
    :type="type"
    :disabled="isBlocked"
    :aria-busy="loading || undefined"
    :class="[BASE, SIZES[size], VARIANTS[variant], block && 'w-full']"
  >
    <LoaderCircle v-if="loading" :size="15" class="animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
