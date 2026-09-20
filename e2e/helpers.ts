import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page } from '@playwright/test'

/**
 * Supabase config, read in Node rather than from the page. `import.meta.env`
 * cannot be referenced inside a page.evaluate callback — Playwright serialises
 * that function to a string and the reference does not survive the trip.
 */
export function supabaseConfig() {
  const fromEnv = {
    url: process.env.VITE_SUPABASE_URL ?? '',
    key: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  }
  if (fromEnv.url && fromEnv.key) return fromEnv

  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  const read = (name: string) =>
    raw.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''

  return {
    url: read('VITE_SUPABASE_URL'),
    key: read('VITE_SUPABASE_PUBLISHABLE_KEY'),
  }
}

export const DEMO = {
  employee: { name: 'Maya Okonkwo', email: 'maya.okonkwo@northlane.studio', role: 'Employee' },
  manager: { name: 'Tobias Lind', email: 'tobias.lind@northlane.studio', role: 'Manager' },
  admin: { name: 'Priya Raghunathan', email: 'priya.raghunathan@northlane.studio', role: 'HR Admin' },
} as const

export type Who = keyof typeof DEMO

/** Quick-login, the same one-click path a visitor uses. */
export async function signIn(page: Page, who: Who) {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(DEMO[who].name, 'i') }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
  // The rail footer proves the session resolved to the right profile.
  await expect(page.getByText(DEMO[who].role, { exact: true }).first()).toBeVisible()
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
}

/** A row in any of the three list surfaces. */
export function rowByText(page: Page, text: string | RegExp) {
  return page.locator('ul > li button').filter({ hasText: text })
}

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
