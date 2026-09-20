<script setup lang="ts">
import { computed, ref } from 'vue'

import type { LinePoint } from './types'

const props = withDefaults(
  defineProps<{
    data: LinePoint[]
    caption: string
    unit?: string
    /** Forces the y-axis top; otherwise it is derived with headroom. */
    max?: number | null
  }>(),
  { unit: '', max: null },
)

// A fixed viewBox keeps stroke widths honest at every rendered size.
const W = 640
const H = 180
const PAD = { top: 14, right: 8, bottom: 26, left: 30 }

const hovered = ref<number | null>(null)

const yMax = computed(() => {
  if (props.max !== null) return props.max
  const peak = Math.max(1, ...props.data.map((d) => d.value))
  // There are four gridline gaps, so the top must be divisible by 4 for every
  // axis label to be a whole number rather than 19 / 38 / 56.
  const step = peak <= 8 ? 4 : peak <= 40 ? 20 : peak <= 200 ? 40 : 100
  return Math.ceil((peak * 1.12) / step) * step
})

const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const points = computed(() =>
  props.data.map((d, i) => {
    const x =
      PAD.left + (props.data.length === 1 ? plotW / 2 : (i / (props.data.length - 1)) * plotW)
    const y = PAD.top + plotH - (d.value / yMax.value) * plotH
    return { ...d, x, y, index: i }
  }),
)

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  const base = PAD.top + plotH
  return `${linePath.value} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`
})

/** Four gridlines including zero, at values the reader can actually name. */
const gridLines = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD.top + plotH - t * plotH,
    value: Math.round(t * yMax.value),
  })),
)

// Enough labels to orient, never so many they collide.
const labelEvery = computed(() => Math.max(1, Math.ceil(props.data.length / 7)))
</script>

<template>
  <figure class="m-0">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full overflow-visible"
      role="img"
      :aria-label="caption"
      preserveAspectRatio="none"
      @mouseleave="hovered = null"
    >
      <defs>
        <linearGradient id="meridian-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent-mid)" stop-opacity="0.18" />
          <stop offset="100%" stop-color="var(--color-accent-mid)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g>
        <line
          v-for="g in gridLines"
          :key="`g-${g.value}`"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="g.y"
          :y2="g.y"
          stroke="var(--color-border)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
        <text
          v-for="g in gridLines"
          :key="`t-${g.value}`"
          :x="PAD.left - 7"
          :y="g.y + 3.5"
          text-anchor="end"
          fill="var(--color-ink-faint)"
          font-size="9"
          font-family="var(--font-sans)"
        >
          {{ g.value }}
        </text>
      </g>

      <path :d="areaPath" fill="url(#meridian-area)" />
      <path
        :d="linePath"
        fill="none"
        stroke="var(--color-accent)"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />

      <g>
        <circle
          v-for="p in points"
          :key="`p-${p.index}`"
          :cx="p.x"
          :cy="p.y"
          :r="hovered === p.index ? 4 : 2.5"
          fill="var(--color-surface)"
          stroke="var(--color-accent)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          class="transition-[r] duration-150"
        />
      </g>

      <!-- Generous invisible hit targets: the dots are too small to aim at. -->
      <g>
        <rect
          v-for="p in points"
          :key="`h-${p.index}`"
          :x="p.x - plotW / Math.max(1, data.length * 2)"
          :y="PAD.top"
          :width="plotW / Math.max(1, data.length)"
          :height="plotH"
          fill="transparent"
          @mouseenter="hovered = p.index"
        />
      </g>

      <g>
        <text
          v-for="p in points"
          :key="`x-${p.index}`"
          v-show="p.index % labelEvery === 0 || p.index === points.length - 1"
          :x="p.x"
          :y="H - 8"
          text-anchor="middle"
          fill="var(--color-ink-faint)"
          font-size="9"
          font-family="var(--font-sans)"
        >
          {{ p.label }}
        </text>
      </g>
    </svg>

    <p
      class="mt-2 h-4 text-xs text-ink-soft"
      aria-live="polite"
    >
      <template v-if="hovered !== null && points[hovered]">
        <span class="font-medium text-ink">{{ points[hovered].label }}</span>
        <span data-numeric> — {{ points[hovered].value }}{{ unit }}</span>
      </template>
    </p>

    <!-- Wrapped in a div, not applied to the table directly: a table's
         intrinsic min-content width (and its caption's, via inherited
         white-space) both ignore an explicit small width and defeat
         overflow:hidden, which forced the page to scroll horizontally. -->
    <div class="sr-only">
      <table>
        <caption>{{ caption }}</caption>
        <thead>
          <tr><th scope="col">Period</th><th scope="col">Value</th></tr>
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
