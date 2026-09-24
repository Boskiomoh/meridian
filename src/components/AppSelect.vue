<script setup lang="ts">
/**
 * A themed stand-in for the native <select>. The closed control can be
 * styled with plain CSS (that is what `.field-select` already did), but the
 * open dropdown is drawn by the OS/browser and cannot be -- so anywhere that
 * popup needs to match the product, the whole control has to be rebuilt.
 *
 * Drop-in API: pass plain `<option>` tags as children exactly as you would
 * to a native select, including `v-for`. This component reads that slot to
 * build its option list, so call sites did not need to change shape.
 */
import { Fragment, computed, nextTick, onBeforeUnmount, ref, useId, useSlots, type VNode } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ modelValue: string; size?: 'sm' | 'md' }>(), {
  size: 'md',
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const slots = useSlots()
const listboxId = useId()
const open = ref(false)
const activeIndex = ref(-1)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const position = ref({ top: 0, left: 0, width: 0 })

interface SelectOption {
  value: string
  label: string
  disabled: boolean
}

function textOf(children: VNode['children']): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children
      .map((c) => {
        if (typeof c === 'string') return c
        if (typeof c === 'number') return String(c)
        if (c && typeof c === 'object' && 'children' in c) return textOf((c as VNode).children)
        return ''
      })
      .join('')
  }
  return ''
}

function flatten(nodes: VNode[]): VNode[] {
  const out: VNode[] = []
  for (const n of nodes) {
    if (n.type === Fragment && Array.isArray(n.children)) out.push(...flatten(n.children as VNode[]))
    else if (n.type === 'option') out.push(n)
  }
  return out
}

const options = computed<SelectOption[]>(() => {
  const nodes = slots.default?.() ?? []
  return flatten(nodes).map((n) => ({
    value: String(n.props?.value ?? ''),
    label: textOf(n.children),
    disabled: Boolean(n.props?.disabled),
  }))
})

const selected = computed(() => options.value.find((o) => o.value === props.modelValue) ?? null)

function enabledIndexes() {
  return options.value.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i !== -1)
}

function place() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  position.value = { top: rect.bottom + 6, left: rect.left, width: rect.width }
}

function onScrollOrResize() {
  if (open.value) close()
}

function openPanel() {
  if (open.value) return
  place()
  open.value = true
  activeIndex.value = options.value.findIndex((o) => o.value === props.modelValue)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
  document.addEventListener('pointerdown', onPointerDown, true)
  void nextTick(() => {
    const list = enabledIndexes()
    if (activeIndex.value === -1 && list.length) activeIndex.value = list[0]
    panelRef.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  })
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

function choose(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  close()
  triggerRef.value?.focus()
}

function moveActive(delta: number) {
  const list = enabledIndexes()
  if (!list.length) return
  const pos = list.indexOf(activeIndex.value)
  const next = pos === -1 ? (delta > 0 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, pos + delta))
  activeIndex.value = list[next]
  panelRef.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
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
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Home':
      event.preventDefault()
      activeIndex.value = enabledIndexes()[0] ?? -1
      break
    case 'End': {
      event.preventDefault()
      const list = enabledIndexes()
      activeIndex.value = list[list.length - 1] ?? -1
      break
    }
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (activeIndex.value !== -1) choose(options.value[activeIndex.value])
      break
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
    role="combobox"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :aria-controls="listboxId"
    :aria-activedescendant="activeIndex !== -1 ? `${listboxId}-opt-${activeIndex}` : undefined"
    v-bind="$attrs"
    class="flex shrink-0 items-center justify-between gap-2 rounded-[6px] border border-border-strong bg-surface text-left text-ink transition-[border-color,box-shadow,background-color] duration-150 hover:border-ink-faint focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-faint"
    :class="size === 'sm' ? 'rounded-full px-3 py-[0.3125rem] text-sm' : 'px-3 py-2 text-base'"
    @click="toggle"
    @keydown="onTriggerKeydown"
  >
    <span class="truncate" :class="{ 'text-ink-faint': !selected }">
      {{ selected ? selected.label : '' }}
    </span>
    <ChevronDown
      :size="15"
      :stroke-width="2"
      class="shrink-0 text-ink-soft transition-transform duration-150"
      :class="{ 'rotate-180': open }"
      aria-hidden="true"
    />
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
      :id="listboxId"
      role="listbox"
      class="fixed z-50 max-h-64 max-w-[22rem] overflow-y-auto rounded-panel bg-surface py-1 shadow-[var(--shadow-pop)] ring-1 ring-inset ring-border"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, minWidth: `${position.width}px` }"
    >
      <div
        v-for="(option, index) in options"
        :id="`${listboxId}-opt-${index}`"
        :key="option.value + index"
        role="option"
        :aria-selected="option.value === modelValue"
        :data-active="index === activeIndex"
        class="mx-1 flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-sm"
        :class="[
          option.disabled
            ? 'cursor-not-allowed text-ink-faint'
            : index === activeIndex
              ? 'bg-accent-soft text-accent-ink'
              : 'text-ink hover:bg-surface-alt',
        ]"
        @click="choose(option)"
        @mousemove="!option.disabled && (activeIndex = index)"
      >
        <Check
          v-if="option.value === modelValue"
          :size="14"
          :stroke-width="2.4"
          class="shrink-0 text-accent"
          aria-hidden="true"
        />
        <span v-else class="inline-block size-3.5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ option.label || ' ' }}</span>
      </div>
    </div>
  </Transition>
</template>
