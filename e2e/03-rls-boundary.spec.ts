import { expect, test, type Page } from '@playwright/test'
import { signIn, supabaseConfig } from './helpers'

/**
 * The claim this whole project exists to back up.
 *
 * These specs do not click anything. They take the signed-in user's own access
 * token straight out of the browser session and call the REST API with it,
 * bypassing the interface entirely. If the boundary were only enforced in Vue,
 * every one of these would come back with data.
 */

interface Ctx {
  url: string
  key: string
  token: string
}

/** Pull the live session token out of the page, the way an attacker would. */
async function apiContext(page: Page): Promise<Ctx> {
  const { url, key } = supabaseConfig()

  const token = await page.evaluate(() => {
    let found = ''
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('sb-') || !k.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        found = parsed.access_token ?? parsed?.currentSession?.access_token ?? ''
      } catch {
        /* not the entry we want */
      }
    }
    return found
  })

  return { url, key, token }
}

async function apiGet(page: Page, ctx: Ctx, path: string) {
  return page.evaluate(
    async ({ ctx, path }) => {
      const res = await fetch(`${ctx.url}/rest/v1/${path}`, {
        headers: { apikey: ctx.key, Authorization: `Bearer ${ctx.token}` },
      })
      return { status: res.status, body: await res.json() }
    },
    { ctx, path },
  )
}

async function apiPatch(page: Page, ctx: Ctx, path: string, payload: unknown) {
  return page.evaluate(
    async ({ ctx, path, payload }) => {
      const res = await fetch(`${ctx.url}/rest/v1/${path}`, {
        method: 'PATCH',
        headers: {
          apikey: ctx.key,
          Authorization: `Bearer ${ctx.token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      })
      return { status: res.status, body: await res.json() }
    },
    { ctx, path, payload },
  )
}

test.describe('RLS is enforced in Postgres, not in the interface', () => {
  // Ids are discovered as admin, then attacked as the employee.
  let outsiderId = ''
  let selfId = ''

  test.beforeAll(async ({ browser }) => {
    const ctxBrowser = await browser.newContext()
    const page = await ctxBrowser.newPage()
    await signIn(page, 'admin')
    const ctx = await apiContext(page)

    const lena = await apiGet(page, ctx, 'profiles?select=id&full_name=eq.Lena%20Kowalski')
    const maya = await apiGet(page, ctx, 'profiles?select=id&full_name=eq.Maya%20Okonkwo')
    outsiderId = lena.body[0].id
    selfId = maya.body[0].id

    expect(outsiderId, 'fixture: Lena Kowalski must exist').toBeTruthy()
    expect(selfId, 'fixture: Maya Okonkwo must exist').toBeTruthy()
    await ctxBrowser.close()
  })

  test("an employee's token cannot read another employee's record", async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)
    expect(ctx.token, 'the session token should be readable').toBeTruthy()

    const own = await apiGet(page, ctx, `employees?select=*&id=eq.${selfId}`)
    expect(own.status).toBe(200)
    expect(own.body, 'an employee can read their own record').toHaveLength(1)

    const other = await apiGet(page, ctx, `employees?select=*&id=eq.${outsiderId}`)
    expect(other.status).toBe(200)
    expect(other.body, "another employee's record must not be returned").toHaveLength(0)
  })

  test("an employee's token cannot read another team's leave requests", async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)

    const other = await apiGet(page, ctx, `leave_requests?select=*&employee_id=eq.${outsiderId}`)
    expect(other.status).toBe(200)
    expect(other.body, "another team's leave must not be returned").toHaveLength(0)

    // And an unfiltered read returns only their own rows, never the whole table.
    const all = await apiGet(page, ctx, 'leave_requests?select=employee_id')
    expect(all.status).toBe(200)
    const foreign = (all.body as { employee_id: string }[]).filter((r) => r.employee_id !== selfId)
    expect(foreign, 'an unfiltered read must still be scoped to self').toHaveLength(0)
  })

  test("an employee's token cannot read another employee's attendance", async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)

    const other = await apiGet(page, ctx, `attendance_records?select=*&employee_id=eq.${outsiderId}`)
    expect(other.status).toBe(200)
    expect(other.body).toHaveLength(0)
  })

  test('an employee cannot promote themselves to admin', async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)

    const attempt = await apiPatch(page, ctx, `profiles?id=eq.${selfId}`, { role: 'admin' })
    expect(attempt.status, 'the column guard should refuse this outright').toBe(403)

    // And the role really did not move.
    const after = await apiGet(page, ctx, `profiles?select=role&id=eq.${selfId}`)
    expect(after.body[0].role).toBe('employee')
  })

  test('an employee cannot approve their own leave request', async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)

    const pending = await apiGet(
      page,
      ctx,
      `leave_requests?select=id,status&employee_id=eq.${selfId}&status=eq.pending&limit=1`,
    )
    expect(pending.body.length, 'fixture: the demo employee has a pending request').toBe(1)
    const id = pending.body[0].id

    const attempt = await apiPatch(page, ctx, `leave_requests?id=eq.${id}`, { status: 'approved' })
    // RLS matches no row, so this is a no-op rather than an error. Asserting on
    // the empty array alone would be weak -- assert the row did not move.
    expect(attempt.body).toHaveLength(0)

    const after = await apiGet(page, ctx, `leave_requests?select=status&id=eq.${id}`)
    expect(after.body[0].status, 'the request must still be pending').toBe('pending')
  })

  test('a manager can read their reports but not another team', async ({ page }) => {
    await signIn(page, 'manager')
    const ctx = await apiContext(page)

    const report = await apiGet(page, ctx, `employees?select=id&id=eq.${selfId}`)
    expect(report.body, 'a manager can read a direct report').toHaveLength(1)

    const outsider = await apiGet(page, ctx, `employees?select=id&id=eq.${outsiderId}`)
    expect(outsider.body, "a manager cannot read another manager's report").toHaveLength(0)
  })

  test('only an HR admin may call the create-employee function', async ({ page }) => {
    await signIn(page, 'employee')
    const ctx = await apiContext(page)

    const res = await page.evaluate(
      async ({ ctx }) => {
        const r = await fetch(`${ctx.url}/functions/v1/create-employee`, {
          method: 'POST',
          headers: {
            apikey: ctx.key,
            Authorization: `Bearer ${ctx.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: 'Mallory Intruder',
            email: 'mallory.intruder@northlane.studio',
            title: 'Unauthorised',
            start_date: '2026-09-16',
          }),
        })
        return { status: r.status, body: await r.json() }
      },
      { ctx },
    )

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/only an hr admin/i)
  })
})
