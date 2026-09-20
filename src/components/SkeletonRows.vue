<script setup lang="ts">
// Skeletons that mirror the real row geometry, so content does not jump when it
// lands. A spinner in the middle of a list would tell the user nothing about
// what is arriving.
withDefaults(defineProps<{ rows?: number; avatar?: boolean }>(), { rows: 8, avatar: true })
</script>

<template>
  <div class="divide-y divide-border" role="status" aria-label="Loading">
    <div v-for="i in rows" :key="i" class="flex items-center gap-3 px-5 py-3.5">
      <span class="w-1 self-stretch rounded-full bg-border" aria-hidden="true" />
      <span v-if="avatar" class="skeleton size-9 shrink-0 rounded-full" aria-hidden="true" />
      <span class="flex min-w-0 flex-1 flex-col gap-1.5" aria-hidden="true">
        <span class="skeleton h-3 rounded" :style="{ width: `${38 + ((i * 13) % 26)}%` }" />
        <span class="skeleton h-2.5 rounded" :style="{ width: `${22 + ((i * 7) % 18)}%` }" />
      </span>
      <span class="skeleton h-5 w-20 shrink-0 rounded-full" aria-hidden="true" />
    </div>
    <span class="sr-only">Loading records</span>
  </div>
</template>
