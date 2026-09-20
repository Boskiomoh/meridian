<script setup lang="ts">
import { computed } from 'vue'

import type { BarDatum } from './types'

const props = withDefaults(
  defineProps<{
    data: BarDatum[]
    /** Appended to each value in the accessible table and the end label. */
    unit?: string
    /** `brass` marks a series that means "attention", not "good". */
    tone?: 'accent' | 'brass'
    caption: string
  }>(),
  { unit: '', tone: 'accent' },
)

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))

const FILL = {
  accent: 'bg-accent-mid',
  brass: 'bg-brass',
}
</script>

<template>
  <figure class="m-0">
    <!-- Horizontal bars: department names are words, and words read better
         along the axis they are written on than rotated under a column. -->
    <ul class="flex flex-col gap-2.5">
      <li v-for="d in data" :key="d.label" class="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
        <span class="min-w-0">
          <span class="block truncate text-sm text-ink">{{ d.label }}</span>
          <span v-if="d.meta" class="block truncate text-2xs text-ink-faint">{{ d.meta }}</span>
        </span>

        <span class="h-6 overflow-hidden rounded-[3px] bg-surface-alt" aria-hidden="true">
          <span
            class="block h-full rounded-[3px] transition-[width] duration-500 ease-out"
            :class="FILL[tone]"
            :style="{ width: `${Math.max(2, (d.value / max) * 100)}%` }"
          />
        </span>

        <span class="w-10 text-right text-sm font-medium text-ink" data-numeric>
          {{ d.value }}{{ unit }}
        </span>
      </li>
    </ul>

    <!-- Wrapped in a div, not applied to the table directly: a table's
         intrinsic min-content width (and its caption's, via inherited
         white-space) both ignore an explicit small width and defeat
         overflow:hidden, which forced the page to scroll horizontally. -->
    <div class="sr-only">
      <table>
        <caption>{{ caption }}</caption>
        <thead>
          <tr><th scope="col">Category</th><th scope="col">Value</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in data" :key="d.label">
            <th scope="row">{{ d.label }}</th>
            <td>{{ d.value }}{{ unit }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>
