<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastStack from '@/components/ToastStack.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const auth = useAuthStore()

onMounted(() => {
  if (auth.loading) void auth.init()
})
</script>

<template>
  <RouterView />
  <ToastStack />
  <ConfirmDialog />
</template>
