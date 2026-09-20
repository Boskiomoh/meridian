<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.loading) void auth.init()
})
</script>

<template>
  <RouterView />
</template>
