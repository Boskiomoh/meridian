<script setup lang="ts">
import { computed, useId } from 'vue'
import { CircleAlert } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    label: string
    error?: string | null
    hint?: string
    required?: boolean
  }>(),
  { error: null, hint: undefined, required: false },
)

const id = useId()
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(`${id}-hint`)
  if (props.error) ids.push(`${id}-error`)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium text-ink-soft">
      {{ label }}
      <span v-if="!required" class="text-2xs font-normal text-ink-faint">Optional</span>
    </label>

    <slot :id="id" :described-by="describedBy" :invalid="Boolean(error)" />

    <p v-if="hint && !error" :id="`${id}-hint`" class="mt-1.5 text-xs text-ink-faint">
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="`${id}-error`"
      class="mt-1.5 flex items-start gap-1.5 text-xs text-danger"
      role="alert"
    >
      <CircleAlert :size="13" :stroke-width="2.2" class="mt-px shrink-0" aria-hidden="true" />
      {{ error }}
    </p>
  </div>
</template>
