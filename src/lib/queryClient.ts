import { QueryClient } from '@tanstack/vue-query'

/**
 * One client for the whole app, installed via VueQueryPlugin in main.ts.
 *
 * In-memory only: there is no persister here, and deliberately so. This is an
 * HR admin tool whose entire thesis is "we take this data's access boundary
 * seriously" -- caching employee names, leave reasons and attendance times to
 * localStorage between sessions would undercut that, even though the demo
 * data is fictional. A hard reload always starts from an empty cache.
 *
 * Defaults tuned for an internal admin tool, not a public site:
 *  - staleTime > 0 so switching Directory -> Leave -> Directory does not
 *    re-fetch the employee list every time; the list rarely changes mid-session.
 *  - refetchOnWindowFocus is off. This product is worked in one tab for
 *    minutes at a time; refetching on every alt-tab is noise, not freshness.
 *  - Realtime (leave_requests) supplies its own targeted cache updates, so it
 *    does not depend on staleTime at all.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
