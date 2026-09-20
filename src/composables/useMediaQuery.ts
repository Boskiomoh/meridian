import { onUnmounted, ref, type Ref } from 'vue'

/**
 * Reactive media query.
 *
 * Used so the inspector renders in exactly one place. Hiding the desktop column
 * with `lg:hidden` and rendering the mobile sheet as well would put the same
 * content in the DOM twice — duplicating element ids, giving assistive tech two
 * copies of every control, and leaving a hidden focusable form on the page.
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || !window.matchMedia) return matches

  const list = window.matchMedia(query)
  matches.value = list.matches

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }
  list.addEventListener('change', onChange)
  onUnmounted(() => list.removeEventListener('change', onChange))

  return matches
}

/** Tailwind's `lg` breakpoint, where the shell gains its third column. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
