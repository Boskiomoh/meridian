<script setup lang="ts">
/**
 * A themed stand-in for <input type="date">. Same reasoning as AppSelect:
 * the closed field can be styled, but the calendar popup is drawn by the
 * OS/browser and cannot be, so the whole control is rebuilt here.
 */
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { formatDate } from '@/lib/format'

const props = defineProps<{ modelValue: string; min?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

defineOptions({ inheritAttrs: false })

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const position = ref({ top: 0, left: 0 })
const panelId = useId()

const todayUTC = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}
const isoOf = (d: Date) => d.toISOString().slice(0, 10)
const todayIso = isoOf(todayUTC())

function parseISO(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

const viewYear = ref(todayUTC().getUTCFullYear())
const viewMonth = ref(todayUTC().getUTCMonth())
const focusedIso = ref(todayIso)

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(viewYear.value, viewMonth.value, 1)),
  ),
)

interface Cell {
  iso: string
  day: number
  inMonth: boolean
  disabled: boolean
}

const cells = computed<Cell[]>(() => {
  const firstOfMonth = new Date(Date.UTC(viewYear.value, viewMonth.value, 1))
  const startWeekday = firstOfMonth.getUTCDay()
  const out: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(viewYear.value, viewMonth.value, 1 - startWeekday + i))
    const iso = isoOf(d)
    out.push({
      iso,
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === viewMonth.value,
      disabled: Boolean(props.min && iso < props.min),
    })
  }
  return out
})

function showMonthOf(iso: string) {
  const d = parseISO(iso)
  if (!d) return
  viewYear.value = d.getUTCFullYear()
  viewMonth.value = d.getUTCMonth()
}

function place() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  position.value = { top: rect.bottom + 6, left: rect.left }
}

function onScrollOrResize() {
  if (open.value) close()
}

function openPanel() {
  if (open.value) return
  const base = parseISO(props.modelValue) ?? todayUTC()
  focusedIso.value = isoOf(base)
  showMonthOf(focusedIso.value)
  place()
  open.value = true
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
  document.addEventListener('pointerdown', onPointerDown, true)
  void nextTick(() =>
    panelRef.value?.querySelector<HTMLElement>('[data-focused="true"]')?.scrollIntoView({ block: 'nearest' }),
  )
}

function close() {
  if (!open.value) return
  open.value = false
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
  document.removeEventListener('pointerdown', onPointerDown, true)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  close()
}

function toggle() {
  if (open.value) close()
  else openPanel()
}

function pick(cell: Cell) {
  if (cell.disabled) return
  emit('update:modelValue', cell.iso)
  close()
  triggerRef.value?.focus()
}

function shiftMonth(delta: number) {
  const d = new Date(Date.UTC(viewYear.value, viewMonth.value + delta, 1))
  viewYear.value = d.getUTCFullYear()
  viewMonth.value = d.getUTCMonth()
}

function shiftFocus(days: number) {
  const d = parseISO(focusedIso.value) ?? todayUTC()
  d.setUTCDate(d.getUTCDate() + days)
  focusedIso.value = isoOf(d)
  showMonthOf(focusedIso.value)
}

function clear() {
  emit('update:modelValue', '')
  close()
  triggerRef.value?.focus()
}

function goToday() {
  if (props.min && todayIso < props.min) return
  emit('update:modelValue', todayIso)
  close()
  triggerRef.value?.focus()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openPanel()
    }
    return
  }
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      shiftFocus(1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      shiftFocus(-1)
      break
    case 'ArrowDown':
      event.preventDefault()
      shiftFocus(7)
      break
    case 'ArrowUp':
      event.preventDefault()
      shiftFocus(-7)
      break
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const cell = cells.value.find((c) => c.iso === focusedIso.value)
      if (cell) pick(cell)
      break
    }
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Tab':
      close()
      break
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
  document.removeEventListener('pointerdown', onPointerDown, true)
})
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    v-bind="$attrs"
    class="flex items-center gap-2 rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-left text-base text-ink transition-[border-color,box-shadow] duration-150 hover:border-ink-faint focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-faint"
    @click="toggle"
    @keydown="onTriggerKeydown"
  >
    <CalendarDays :size="15" :stroke-width="1.8" class="shrink-0 text-ink-faint" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate" :class="{ 'text-ink-faint': !modelValue }" data-numeric>
      {{ modelValue ? formatDate(modelValue) : 'Choose a date' }}
    </span>
  </button>

  <Transition
    enter-active-class="transition-[opacity,transform] duration-100 ease-out"
    leave-active-class="transition-[opacity,transform] duration-75 ease-in"
    enter-from-class="opacity-0 scale-[0.98] -translate-y-1"
    leave-to-class="opacity-0 scale-[0.98] -translate-y-1"
  >
    <div
      v-if="open"
      ref="panelRef"
      :id="panelId"
      role="dialog"
      aria-label="Choose a date"
      class="fixed z-50 w-72 rounded-panel bg-surface p-3 shadow-[var(--shadow-pop)] ring-1 ring-inset ring-border"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div class="flex items-center justify-between px-0.5 pb-2">
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          <ChevronLeft :size="16" :stroke-width="2" />
        </button>
        <span class="font-display text-sm font-semibold text-ink">{{ monthLabel }}</span>
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          aria-label="Next month"
          @click="shiftMonth(1)"
        >
          <ChevronRight :size="16" :stroke-width="2" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-y-0.5 px-0.5">
        <span
          v-for="wd in WEEKDAYS"
          :key="wd"
          class="flex h-7 items-center justify-center text-2xs font-medium text-ink-faint"
        >
          {{ wd }}
        </span>

        <button
          v-for="cell in cells"
          :key="cell.iso"
          type="button"
          :data-focused="cell.iso === focusedIso"
          :disabled="cell.disabled"
          class="flex size-7 items-center justify-center justify-self-center rounded-full text-sm transition-colors duration-150"
          data-numeric
          :class="[
            !cell.inMonth && 'text-ink-faint/60',
            cell.inMonth && !cell.disabled && 'text-ink',
            cell.disabled && 'cursor-not-allowed text-ink-faint/40',
            cell.iso === modelValue
              ? 'bg-accent text-ink-invert font-medium'
              : cell.iso === focusedIso
                ? 'ring-1 ring-inset ring-accent'
                : !cell.disabled && 'hover:bg-surface-alt',
            cell.iso === todayIso && cell.iso !== modelValue && 'font-semibold text-accent',
          ]"
          @click="pick(cell)"
        >
          {{ cell.day }}
        </button>
      </div>

      <div class="mt-2 flex items-center justify-between border-t border-border pt-2.5">
        <button
          type="button"
          class="text-xs font-medium text-ink-soft transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:text-ink-faint"
          :disabled="!modelValue"
          @click="clear"
        >
          Clear
        </button>
        <button
          type="button"
          class="text-xs font-medium text-accent transition-colors duration-150 hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline"
          :disabled="Boolean(min && todayIso < min)"
          @click="goToday"
        >
          Today
        </button>
      </div>
    </div>
  </Transition>
</template>
