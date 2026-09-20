import { computed, onScopeDispose, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import * as api from '@/api/leave'
import { useAuthStore } from '@/stores/auth'
import type { LeaveRequest } from '@/schemas'

export const leaveRequestsKey = ['leave-requests'] as const

export function useLeaveRequestsQuery() {
  return useQuery({ queryKey: leaveRequestsKey, queryFn: api.fetchLeaveRequests })
}

/**
 * Your own requests, pending first -- those are the ones you are waiting on.
 * Reads the one shared cache; opening this view after visiting the directory
 * costs no extra fetch.
 */
export function useMyLeaveRequests() {
  const auth = useAuthStore()
  const query = useLeaveRequestsQuery()

  const mine = computed(() =>
    (query.data.value ?? [])
      .filter((r) => r.employee_id === auth.userId)
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'pending') return -1
          if (b.status === 'pending') return 1
        }
        return b.start_date.localeCompare(a.start_date)
      }),
  )

  return { requests: mine, isLoading: query.isPending, error: query.error, refetch: query.refetch }
}

/**
 * Everything the signed-in approver may decide: their reports, not
 * themselves. Pending first -- this is a work queue, and the undecided items
 * are the job. Within each group, soonest start date leads, because that is
 * what expires.
 */
export function useTeamLeaveQueue() {
  const auth = useAuthStore()
  const query = useLeaveRequestsQuery()

  const teamQueue = computed(() =>
    (query.data.value ?? [])
      .filter((r) => r.employee_id !== auth.userId)
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'pending') return -1
          if (b.status === 'pending') return 1
        }
        return a.status === 'pending'
          ? a.start_date.localeCompare(b.start_date)
          : b.start_date.localeCompare(a.start_date)
      }),
  )

  const pendingCount = computed(() => teamQueue.value.filter((r) => r.status === 'pending').length)

  return {
    requests: teamQueue,
    pendingCount,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Realtime keeps the cache in sync with Postgres -- this is what makes the
 * employee's page update live when a manager decides, with no polling. RLS
 * applies to the replication stream too, so an employee only ever receives
 * their own rows here.
 *
 * `setQueryData` patches the single changed row directly (the fast path);
 * `invalidateQueries` would also be correct but would refetch the whole list
 * on every single change. `recentlyChanged` is returned so a row can animate
 * itself when its status flips under the user -- it lives here, not in Pinia,
 * because it is this code that actually knows a change just happened.
 */
export function useLeaveRealtime() {
  const qc = useQueryClient()
  const recentlyChanged = ref<Set<string>>(new Set())
  let channel: RealtimeChannel | null = null

  function markChanged(id: string) {
    recentlyChanged.value = new Set(recentlyChanged.value).add(id)
    window.setTimeout(() => {
      const next = new Set(recentlyChanged.value)
      next.delete(id)
      recentlyChanged.value = next
    }, 6000)
  }

  function start() {
    if (channel) return
    channel = supabase
      .channel('leave-requests-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id?: string } | null
          if (!row?.id) return
          const id = row.id

          if (payload.eventType === 'DELETE') {
            qc.setQueryData<LeaveRequest[]>(leaveRequestsKey, (current) =>
              current ? current.filter((r) => r.id !== id) : current,
            )
            return
          }

          const current = qc.getQueryData<LeaveRequest[]>(leaveRequestsKey)
          const previous = current?.find((r) => r.id === id)
          const nextStatus = (payload.new as { status?: string })?.status
          if (previous && nextStatus && previous.status !== nextStatus) markChanged(id)

          void api.fetchLeaveRequestById(id).then((fresh) => {
            if (!fresh) return
            qc.setQueryData<LeaveRequest[]>(leaveRequestsKey, (curr) => {
              if (!curr) return curr
              const idx = curr.findIndex((r) => r.id === fresh.id)
              if (idx === -1) return [fresh, ...curr]
              const next = curr.slice()
              next[idx] = fresh
              return next
            })
          })
        },
      )
      .subscribe()
  }

  function stop() {
    if (!channel) return
    void supabase.removeChannel(channel)
    channel = null
  }

  onScopeDispose(stop)

  return { start, stop, recentlyChanged }
}

function useInvalidateLeave() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: leaveRequestsKey })
}

export function useSubmitLeaveMutation() {
  const invalidate = useInvalidateLeave()
  return useMutation({
    mutationFn: api.submitLeaveRequest,
    onSuccess: invalidate,
  })
}

export function useDecideLeaveMutation() {
  const invalidate = useInvalidateLeave()
  return useMutation({
    mutationFn: (vars: { id: string; status: 'approved' | 'denied'; comment: string }) =>
      api.decideLeaveRequest(vars.id, vars.status, vars.comment),
    onSuccess: invalidate,
  })
}

export function useCancelLeaveMutation() {
  const invalidate = useInvalidateLeave()
  return useMutation({
    mutationFn: api.cancelLeaveRequest,
    onSuccess: invalidate,
  })
}
