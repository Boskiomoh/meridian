import { type Ref, computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import * as api from '@/api/documents'

function documentsKey(employeeId: string) {
  return ['documents', employeeId] as const
}

export function useDocumentsQuery(employeeId: Ref<string>) {
  return useQuery({
    queryKey: computed(() => documentsKey(employeeId.value)),
    queryFn: () => api.fetchDocuments(employeeId.value),
  })
}

export function useUploadDocumentMutation(employeeId: Ref<string>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.uploadDocument(employeeId.value, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentsKey(employeeId.value) }),
  })
}

export function useDeleteDocumentMutation(employeeId: Ref<string>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (doc: { id: string; storage_path: string }) => api.deleteDocument(doc),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentsKey(employeeId.value) }),
  })
}

export const getDocumentSignedUrl = api.getDocumentSignedUrl
