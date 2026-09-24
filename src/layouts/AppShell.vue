<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Users,
  CalendarDays,
  Clock3,
  ChartColumn,
  UserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL } from '@/lib/format'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import AvatarMark from '@/components/AvatarMark.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const toast = useToast()

const drawerOpen = ref(false)
watch(() => route.fullPath, () => (drawerOpen.value = false))

const nav = computed(() => {
  const items = [
    {
      name: 'directory',
      // A manager browses a team; an admin browses the company. Same route,
      // honest label for what the row set actually contains.
      label: auth.isAdmin ? 'Directory' : 'My team',
      icon: Users,
      show: auth.canApprove,
    },
    { name: 'leave', label: 'Leave', icon: CalendarDays, show: true },
    { name: 'attendance', label: 'Attendance', icon: Clock3, show: true },
    { name: 'analytics', label: 'Analytics', icon: ChartColumn, show: auth.isAdmin },
    { name: 'me', label: 'My profile', icon: UserRound, show: true },
  ]
  return items.filter((i) => i.show)
})

const isCurrent = (name: string) =>
  route.name === name || (name === 'directory' && route.name === 'person')

async function signOut() {
  const ok = await confirm({
    title: 'Sign out of Meridian?',
    body: 'You will need to sign in again to get back to your dashboard.',
    confirmLabel: 'Sign out',
  })
  if (!ok) return

  await auth.signOut()
  await router.push({ name: 'login' })
  toast.success('Signed out')
}
</script>

<template>
  <div class="min-h-dvh bg-bg">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-ink-invert"
    >
      Skip to content
    </a>

    <!-- Mobile bar: the rail becomes a drawer rather than a squeezed column. -->
    <header
      class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-nav px-4 lg:hidden"
    >
      <button
        class="-ml-1.5 inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-nav-deep hover:text-ink"
        :aria-expanded="drawerOpen"
        aria-controls="app-rail"
        aria-label="Open navigation"
        @click="drawerOpen = true"
      >
        <Menu :size="19" :stroke-width="1.9" />
      </button>
      <RouterLink :to="{ name: 'directory' }" class="flex items-center gap-2 no-underline">
        <span class="font-display text-md font-semibold tracking-tight text-ink">Meridian</span>
      </RouterLink>
      <span class="ml-auto">
        <AvatarMark v-if="auth.profile" :name="auth.profile.full_name" size="sm" />
      </span>
    </header>

    <div
      v-if="drawerOpen"
      class="fixed inset-0 z-40 bg-ink/25 lg:hidden"
      @click="drawerOpen = false"
    />

    <div class="lg:flex">
      <!-- Rail: its own lighter-but-deeper sage layer gives the shell weight. -->
      <nav
        id="app-rail"
        class="fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-border bg-nav transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-[var(--rail-w)] lg:translate-x-0"
        :class="drawerOpen ? 'translate-x-0' : '-translate-x-full'"
        aria-label="Sections"
      >
        <div class="flex h-14 shrink-0 items-center gap-2.5 px-5 lg:h-[62px]">
          <span
            class="inline-flex size-6 items-center justify-center rounded-[5px] bg-accent"
            aria-hidden="true"
          >
            <span class="block h-2.5 w-px bg-ink-invert" />
          </span>
          <span class="font-display text-md font-semibold tracking-tight text-ink">Meridian</span>
          <button
            class="ml-auto inline-flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-nav-deep lg:hidden"
            aria-label="Close navigation"
            @click="drawerOpen = false"
          >
            <X :size="17" :stroke-width="2" />
          </button>
        </div>

        <p class="px-5 pb-3 text-2xs font-medium uppercase tracking-[0.13em] text-ink-faint">
          Northlane Studio
        </p>

        <ul class="flex flex-1 flex-col gap-0.5 px-3">
          <li v-for="item in nav" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              class="group flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-sm no-underline transition-colors duration-150"
              :class="
                isCurrent(item.name)
                  ? 'bg-accent text-ink-invert font-medium'
                  : 'text-ink-soft hover:bg-nav-deep hover:text-ink'
              "
              :aria-current="isCurrent(item.name) ? 'page' : undefined"
            >
              <component
                :is="item.icon"
                :size="16"
                :stroke-width="isCurrent(item.name) ? 2.1 : 1.8"
                aria-hidden="true"
              />
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <div v-if="auth.profile" class="mt-auto border-t border-border px-3 py-3">
          <div class="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5">
            <AvatarMark :name="auth.profile.full_name" size="sm" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-medium text-ink">
                {{ auth.profile.full_name }}
              </span>
              <span class="block truncate text-2xs text-ink-faint">
                {{ auth.role ? ROLE_LABEL[auth.role] : '' }}
              </span>
            </span>
            <button
              class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-nav-deep hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
              @click="signOut"
            >
              <LogOut :size="15" :stroke-width="1.9" />
            </button>
          </div>
        </div>
      </nav>

      <main id="main" class="min-w-0 flex-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
