import { computed, type ComputedRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import * as api from '@/api/employees'
import type { EmploymentStatus } from '@/lib/supabase'
import { usePeopleFiltersStore } from '@/stores/peopleFilters'
import type { Person } from '@/schemas'

export const employeesKey = ['employees'] as const
export const departmentsKey = ['departments'] as const

export function useEmployeesQuery() {
  return useQuery({ queryKey: employeesKey, queryFn: api.fetchEmployees })
}

export function useDepartmentsQuery() {
  return useQuery({ queryKey: departmentsKey, queryFn: api.fetchDepartments })
}

/** `Map<id, Person>` over whatever the employees query currently holds. */
export function usePeopleById(): ComputedRef<Map<string, Person>> {
  const { data } = useEmployeesQuery()
  return computed(() => new Map((data.value ?? []).map((p) => [p.id, p])))
}

/**
 * The directory list after search + filters. Combines the cached server data
 * with the pure client-side filter state in `peopleFilters` -- this is exactly
 * the split described in the migration workflow: TanStack Query owns the
 * data, Pinia owns nothing but what the user is doing with it.
 */
export function useVisiblePeople() {
  const query = useEmployeesQuery()
  const filters = usePeopleFiltersStore()

  const sorted = computed(() =>
    (query.data.value ?? []).slice().sort((a, b) => a.full_name.localeCompare(b.full_name)),
  )

  const visible = computed(() => {
    const q = filters.search.trim().toLowerCase()
    return sorted.value.filter((p) => {
      if (filters.departmentFilter !== 'all' && p.department_id !== filters.departmentFilter) return false
      if (filters.statusFilter !== 'all' && p.employment_status !== filters.statusFilter) return false
      if (filters.roleFilter !== 'all' && p.role !== filters.roleFilter) return false
      if (!q) return true
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.department?.name.toLowerCase().includes(q) ?? false)
      )
    })
  })

  return {
    people: sorted,
    visible,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    filters,
  }
}

function useInvalidateEmployees() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: employeesKey })
}

export function useUpdateContactMutation() {
  const invalidate = useInvalidateEmployees()
  return useMutation({
    mutationFn: (vars: { id: string; patch: { phone?: string | null; location?: string | null } }) =>
      api.updateEmployeeContact(vars.id, vars.patch),
    onSuccess: invalidate,
  })
}

export function useUpdateEmploymentMutation() {
  const invalidate = useInvalidateEmployees()
  return useMutation({
    mutationFn: (vars: { id: string; patch: api.EmploymentPatch }) =>
      api.updateEmployeeEmployment(vars.id, vars.patch),
    onSuccess: invalidate,
  })
}

export function useSetEmploymentStatusMutation() {
  const invalidate = useInvalidateEmployees()
  return useMutation({
    mutationFn: (vars: { id: string; status: EmploymentStatus }) =>
      api.updateEmployeeEmployment(vars.id, { employment_status: vars.status }),
    onSuccess: invalidate,
  })
}

export function useCreateEmployeeMutation() {
  const invalidate = useInvalidateEmployees()
  return useMutation({
    mutationFn: api.createEmployee,
    onSuccess: invalidate,
  })
}
