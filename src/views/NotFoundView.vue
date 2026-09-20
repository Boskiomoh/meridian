<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-bg px-6 py-16">
    <div class="max-w-md text-center">
      <p class="font-display text-3xl font-semibold tracking-tight text-ink">
        That page does not exist
      </p>
      <p class="mt-3 text-md leading-relaxed text-ink-soft">
        The link may be out of date, or it may point at a record you do not have access to.
      </p>
      <RouterLink
        :to="auth.signedIn ? { name: 'directory' } : { name: 'login' }"
        class="mt-7 inline-flex h-9.5 items-center rounded-full bg-accent px-5 text-sm font-medium text-ink-invert no-underline shadow-raise transition-colors duration-150 hover:bg-accent-mid"
      >
        {{ auth.signedIn ? 'Back to Meridian' : 'Sign in' }}
      </RouterLink>
    </div>
  </div>
</template>
