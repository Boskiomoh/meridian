const PAGE = 1000

interface PageResult<T> {
  data: T[] | null
  error: { message: string } | null
}

/**
 * PostgREST caps a single response at the project's max-rows (1000 by default),
 * and it does so silently — `.range(0, 9999)` just returns the first 1000 and
 * looks like a complete result. Attendance alone exceeds that, and a truncated
 * read made the org attendance rate read far lower than it really is.
 *
 * Pass a function that applies `.range(from, to)` to a freshly built query.
 */
export async function fetchPaged<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: string | null }> {
  const all: T[] = []

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) return { data: all, error: error.message }

    const rows = data ?? []
    all.push(...rows)

    if (rows.length < PAGE) break
    // Guard against a pathological loop if the server ignores the range.
    if (from > 200_000) break
  }

  return { data: all, error: null }
}
