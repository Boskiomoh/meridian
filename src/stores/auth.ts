import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Role } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { fetchProfile } from '@/api/profile'
import type { Profile } from '@/schemas'

export type { Profile }

export const DEMO_PASSWORD = 'Northlane!2026'

export const DEMO_ACCOUNTS: ReadonlyArray<{
  role: Role
  email: string
  name: string
  title: string
  blurb: string
}> = [
  {
    role: 'employee',
    email: 'maya.okonkwo@northlane.studio',
    name: 'Maya Okonkwo',
    title: 'Product Designer',
    blurb: 'Sees only her own record, attendance and leave.',
  },
  {
    role: 'manager',
    email: 'tobias.lind@northlane.studio',
    name: 'Tobias Lind',
    title: 'Design Director',
    blurb: 'Adds four direct reports and an approval queue.',
  },
  {
    role: 'admin',
    email: 'priya.raghunathan@northlane.studio',
    name: 'Priya Raghunathan',
    title: 'People Operations Lead',
    blurb: 'Full directory CRUD and org-wide analytics.',
  },
]

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const userId = computed(() => session.value?.user.id ?? null)
  const role = computed<Role | null>(() => profile.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'admin')
  const isManager = computed(() => role.value === 'manager')
  /** Managers and admins share every approval and team-visibility affordance. */
  const canApprove = computed(() => role.value === 'manager' || role.value === 'admin')
  const signedIn = computed(() => Boolean(session.value))

  /**
   * Routed through the query cache (`queryClient.fetchQuery`, not `useQuery`):
   * this runs inside the router guard and inside signIn/init, both outside any
   * component's render context, so the reactive `useQuery` composable is not
   * available here. Using the client's imperative fetch still shares the same
   * cache key as anything that reads the profile reactively, and still
   * de-dupes concurrent calls.
   */
  async function loadProfile() {
    if (!userId.value) {
      profile.value = null
      return
    }
    try {
      profile.value = await queryClient.fetchQuery({
        queryKey: ['profile', userId.value],
        queryFn: () => fetchProfile(userId.value as string),
      })
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not load your profile.'
      profile.value = null
    }
  }

  /** Called once at boot; also wires the listener that keeps the store honest. */
  async function init() {
    loading.value = true
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await loadProfile()
    loading.value = false

    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
      if (next) {
        void loadProfile()
      } else {
        profile.value = null
      }
    })
  }

  async function signIn(email: string, password: string) {
    error.value = null
    loading.value = true
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false

    if (err) {
      // Supabase returns the same message for unknown user and wrong password,
      // which is correct: revealing which one leaks the directory.
      error.value =
        err.message === 'Invalid login credentials'
          ? 'That email and password do not match an account.'
          : err.message
      return false
    }

    session.value = data.session
    await loadProfile()
    return true
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
    // Every cached query (employees, leave requests, attendance, documents,
    // the profile itself) belongs to the account that just signed out. The
    // router only allows /login to be reached once signedIn is false, so a
    // human can never see this leak -- but nothing stops a future in-app
    // "switch account" flow, or a test, from calling signIn() again on the
    // same tab without an intervening reload. Clearing on sign-out is the
    // one place that guarantees a signOut+signIn cycle never mixes accounts.
    queryClient.clear()
  }

  return {
    session,
    profile,
    loading,
    error,
    userId,
    role,
    isAdmin,
    isManager,
    canApprove,
    signedIn,
    init,
    signIn,
    signOut,
    loadProfile,
  }
})
