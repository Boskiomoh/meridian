<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock, X, Minus, Plane, CircleDot } from 'lucide-vue-next'
import type { EmploymentStatus, LeaveStatus } from '@/lib/supabase'
import { EMPLOYMENT_STATUS_LABEL, LEAVE_STATUS_LABEL } from '@/lib/format'

const props = withDefaults(
  defineProps<{
    status: LeaveStatus | EmploymentStatus
    /** `bare` drops the chip background for use inside an already-tinted row. */
    variant?: 'chip' | 'bare'
  }>(),
  { variant: 'chip' },
)

/**
 * Every status pairs a hue with a word AND a glyph. Colour alone would fail
 * both the accessibility bar and a greyscale print of the directory.
 */
const TOKENS = {
  approved: { label: LEAVE_STATUS_LABEL.approved, icon: Check, tone: 'success' },
  pending: { label: LEAVE_STATUS_LABEL.pending, icon: Clock, tone: 'brass' },
  denied: { label: LEAVE_STATUS_LABEL.denied, icon: X, tone: 'danger' },
  active: { label: EMPLOYMENT_STATUS_LABEL.active, icon: CircleDot, tone: 'success' },
  on_leave: { label: EMPLOYMENT_STATUS_LABEL.on_leave, icon: Plane, tone: 'brass' },
  deactivated: { label: EMPLOYMENT_STATUS_LABEL.deactivated, icon: Minus, tone: 'muted' },
} as const

const token = computed(() => TOKENS[props.status])

const CHIP: Record<string, string> = {
  success: 'bg-success-soft text-[#2c5c34] ring-1 ring-inset ring-[#bcdbc2]',
  brass: 'bg-brass-soft text-[#7d5720] ring-1 ring-inset ring-[#e3cfa6]',
  danger: 'bg-danger-soft text-[#87291f] ring-1 ring-inset ring-[#e5bdb7]',
  muted: 'bg-surface-alt text-ink-faint ring-1 ring-inset ring-border',
}

const BARE: Record<string, string> = {
  success: 'text-[#2c5c34]',
  brass: 'text-[#7d5720]',
  danger: 'text-[#87291f]',
  muted: 'text-ink-faint',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap font-medium"
    :class="[
      variant === 'chip'
        ? ['rounded-full py-0.5 pl-1.5 pr-2.5 text-2xs', CHIP[token.tone]]
        : ['text-xs', BARE[token.tone]],
    ]"
  >
    <component :is="token.icon" :size="variant === 'chip' ? 12 : 13" :stroke-width="2.5" aria-hidden="true" />
    {{ token.label }}
  </span>
</template>
