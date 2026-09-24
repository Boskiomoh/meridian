/**
 * Design inspection captures. Not a test -- this exists so the build can be
 * looked at on desktop and mobile in one batch.
 *
 *   node scripts/shots.mjs [baseURL]
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.env.SHOT_DIR ?? 'shots'

const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }

const ACCOUNTS = {
  admin: 'Priya Raghunathan',
  manager: 'Tobias Lind',
  employee: 'Maya Okonkwo',
}

async function signIn(page, who) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: new RegExp(ACCOUNTS[who], 'i') }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
  await page.waitForLoadState('networkidle')
}

async function shot(page, name) {
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log('  ', name)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()

  // --- desktop -------------------------------------------------------------
  const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 })
  const page = await desktop.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })

  console.log('desktop')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await shot(page, '01-login')

  await signIn(page, 'admin')
  await page.waitForTimeout(1000)
  await shot(page, '02-admin-directory')

  await page.locator('ul li button').first().click()
  await shot(page, '03-admin-directory-selected')

  await page.goto(`${BASE}/leave`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await shot(page, '04-admin-leave')

  await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await shot(page, '05-admin-attendance')

  await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await shot(page, '06-admin-analytics')

  await page.goto(`${BASE}/me`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await shot(page, '07-admin-profile')

  // Manager: the approval queue with a pending request open.
  await desktop.clearCookies()
  await page.evaluate(() => window.localStorage.clear()).catch(() => {})
  await signIn(page, 'manager')
  await page.goto(`${BASE}/leave`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  const pending = page.locator('ul li button').first()
  if (await pending.count()) await pending.click()
  await shot(page, '08-manager-leave-queue')

  // Employee: the narrowest view of the same product.
  await desktop.clearCookies()
  await page.evaluate(() => window.localStorage.clear()).catch(() => {})
  await signIn(page, 'employee')
  await shot(page, '09-employee-profile')
  await page.goto(`${BASE}/leave`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await shot(page, '10-employee-leave')

  await desktop.close()

  // --- mobile --------------------------------------------------------------
  console.log('mobile')
  const mobile = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const m = await mobile.newPage()
  m.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`))

  await m.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await shot(m, '11-mobile-login')

  await signIn(m, 'admin')
  await m.waitForTimeout(1200)
  await shot(m, '12-mobile-directory')

  await m.locator('ul li button').first().click()
  await shot(m, '13-mobile-inspector-sheet')

  await m.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' })
  await m.waitForTimeout(1400)
  await shot(m, '14-mobile-analytics')

  await mobile.close()
  await browser.close()

  if (errors.length) {
    console.log('\nRuntime errors captured:')
    for (const e of [...new Set(errors)]) console.log('  -', e)
  } else {
    console.log('\nNo runtime errors.')
  }
}

main().catch((e) => {
  console.error('shots failed:', e.message)
  process.exit(1)
})
