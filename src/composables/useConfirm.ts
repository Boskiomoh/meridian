import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' reads as a destructive, hard-to-reverse action. */
  variant?: 'default' | 'danger'
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'body'>> {
  open: boolean
  body?: string
  resolve: ((value: boolean) => void) | null
}

// Same module-singleton shape as useToast: one dialog, imperatively driven,
// so any component can ask a yes/no question without mounting its own.
const state = reactive<ConfirmState>({
  open: false,
  title: '',
  body: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  resolve: null,
})

function settle(value: boolean) {
  state.open = false
  state.resolve?.(value)
  state.resolve = null
}

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // A second call while one is open shouldn't happen in practice (this is a
    // modal), but resolving the stale one false keeps a promise from dangling.
    if (state.resolve) settle(false)

    return new Promise<boolean>((resolve) => {
      state.title = options.title
      state.body = options.body
      state.confirmLabel = options.confirmLabel ?? 'Confirm'
      state.cancelLabel = options.cancelLabel ?? 'Cancel'
      state.variant = options.variant ?? 'default'
      state.resolve = resolve
      state.open = true
    })
  }

  return { confirm }
}

/** For ConfirmDialog.vue only -- everyone else uses `confirm()` above. */
export function useConfirmState() {
  return { state, settle }
}
