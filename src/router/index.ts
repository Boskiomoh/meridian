import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { Role } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Omitted means "any signed-in role". `public` opts out of the guard. */
    roles?: Role[]
    public?: boolean
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: 'Sign in' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppShell.vue'),
    children: [
      { path: '', redirect: { name: 'directory' } },
      {
        path: 'directory',
        name: 'directory',
        component: () => import('@/views/DirectoryView.vue'),
        meta: { title: 'Directory' },
      },
      {
        path: 'people/:id',
        name: 'person',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'me',
        name: 'me',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: 'My profile' },
      },
      {
        path: 'leave',
        name: 'leave',
        component: () => import('@/views/LeaveView.vue'),
        meta: { title: 'Leave' },
      },
      {
        path: 'attendance',
        name: 'attendance',
        component: () => import('@/views/AttendanceView.vue'),
        meta: { title: 'Attendance' },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/views/AnalyticsView.vue'),
        meta: { roles: ['admin'], title: 'Analytics' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { public: true, title: 'Not found' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.loading) await auth.init()

  if (to.meta.public) {
    // A signed-in user landing on /login goes where they belong instead.
    if (to.name === 'login' && auth.signedIn) return { name: 'directory' }
    return true
  }

  if (!auth.signedIn) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { next: to.fullPath } }
  }

  // An employee has no directory to browse -- one row is not a directory.
  if (to.name === 'directory' && auth.role === 'employee') {
    return { name: 'me' }
  }

  if (to.meta.roles && auth.role && !to.meta.roles.includes(auth.role)) {
    return { name: auth.role === 'employee' ? 'me' : 'directory' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Meridian` : 'Meridian'
})

export default router
