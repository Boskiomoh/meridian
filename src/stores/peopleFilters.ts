import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Pure client UI state for the directory: what the user is searching or
 * filtering by, never server data. The employee list itself lives in the
 * TanStack Query cache (see src/queries/people.ts) -- this store owns nothing
 * that would ever need to be fetched or invalidated.
 */
export const usePeopleFiltersStore = defineStore('peopleFilters', () => {
  const search = ref('')
  const departmentFilter = ref<string>('all')
  const statusFilter = ref<string>('all')
  const roleFilter = ref<string>('all')

  const hasFilters = computed(
    () =>
      search.value.trim() !== '' ||
      departmentFilter.value !== 'all' ||
      statusFilter.value !== 'all' ||
      roleFilter.value !== 'all',
  )

  function clearFilters() {
    search.value = ''
    departmentFilter.value = 'all'
    statusFilter.value = 'all'
    roleFilter.value = 'all'
  }

  return { search, departmentFilter, statusFilter, roleFilter, hasFilters, clearFilters }
})
