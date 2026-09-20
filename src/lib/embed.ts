/**
 * PostgREST returns an embedded to-one relation as a plain object, but its
 * TypeScript types (and ours) allow either an object or an array depending on
 * how the relationship is inferred. This normalizes it once, everywhere an
 * embedded select is flattened.
 */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
