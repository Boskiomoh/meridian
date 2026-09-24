import { reactive } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  description?: string
}

/**
 * Module-level singleton, not a Pinia store: toasts are fire-and-forget
 * feedback, not domain state anything else needs to read or persist.
 */
const toasts = reactive<Toast[]>([])
let nextId = 0

function dismiss(id: number) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

function push(variant: ToastVariant, title: string, description?: string, duration = 5000) {
  const id = ++nextId
  toasts.push({ id, variant, title, description })
  if (duration > 0) window.setTimeout(() => dismiss(id), duration)
  return id
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (title: string, description?: string) => push('success', title, description),
    // Errors stay up longer -- they usually need to be read, not just noticed.
    error: (title: string, description?: string) => push('error', title, description, 8000),
    info: (title: string, description?: string) => push('info', title, description),
  }
}
