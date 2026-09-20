import type { z } from 'zod'

/**
 * Validates every row of a Supabase response against its schema -- the trust
 * boundary described in src/schemas/index.ts. A single malformed row is
 * dropped and logged loudly (visible in devtools) rather than blanking the
 * whole list: one bad row should not take out the entire directory, but it
 * must never pass through silently either.
 */
export function parseRows<T>(schema: z.ZodType<T>, rows: unknown[], context: string): T[] {
  const out: T[] = []
  for (const row of rows) {
    const result = schema.safeParse(row)
    if (result.success) {
      out.push(result.data)
    } else {
      console.error(`[${context}] a row failed validation and was dropped`, result.error.issues, row)
    }
  }
  return out
}

/**
 * The single-row counterpart. There is no list to gracefully shrink here, so
 * a malformed row throws -- the caller (a mutation or a by-id fetch) should
 * surface that as an error rather than silently returning nothing.
 */
export function parseRow<T>(schema: z.ZodType<T>, row: unknown, context: string): T {
  const result = schema.safeParse(row)
  if (!result.success) {
    console.error(`[${context}] failed validation`, result.error.issues, row)
    throw new Error(`${context}: received malformed data from the server.`)
  }
  return result.data
}
