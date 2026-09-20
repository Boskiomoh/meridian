/**
 * Field-style performance check against the PRODUCTION build.
 *
 * Lighthouse on an auth-gated app only ever measures the login page, which is
 * the one route that does not matter here. This signs in and measures the three
 * routes the PRD actually names — directory, profile and leave — using the same
 * PerformanceObserver entries Lighthouse reads.
 *
 *   npm run build && npm run preview &   # or any served build
 *   node scripts/perf.mjs http://localhost:4173
 */
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:4173'

// Good/needs-improvement thresholds, per web.dev.
const BUDGET = { lcp: 2500, cls: 0.1, inp: 200 }

const ROUTES = [
  { name: 'directory', path: '/directory' },
  { name: 'profile', path: '/me' },
  { name: 'leave', path: '/leave' },
]

const OBSERVER = `
  window.__perf = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.hadRecentInput) window.__perf.cls += e.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
`

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(OBSERVER)

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Priya Raghunathan/i }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 })

  const results = []

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    const { lcp, cls } = await page.evaluate(() => window.__perf)

    // INP proxy: how long the UI takes to respond to a real interaction.
    let inp = 0
    const row = page.locator('ul > li button').first()
    if (await row.count()) {
      const started = Date.now()
      await row.click()
      await page.waitForTimeout(60)
      inp = Date.now() - started
    }

    results.push({ route: route.name, lcp: Math.round(lcp), cls: Number(cls.toFixed(4)), inp })
  }

  await browser.close()

  let failed = false
  console.log('\nroute        LCP        CLS        INP (interaction)')
  console.log('-'.repeat(56))
  for (const r of results) {
    const flags = [
      r.lcp <= BUDGET.lcp ? 'ok' : 'OVER',
      r.cls <= BUDGET.cls ? 'ok' : 'OVER',
      r.inp <= BUDGET.inp ? 'ok' : 'OVER',
    ]
    if (flags.includes('OVER')) failed = true
    console.log(
      `${r.route.padEnd(12)} ${String(r.lcp + 'ms').padEnd(10)} ${flags[0].padEnd(2)} ` +
        `${String(r.cls).padEnd(8)} ${flags[1].padEnd(2)} ${String(r.inp + 'ms').padEnd(7)} ${flags[2]}`,
    )
  }
  console.log(`\nbudget: LCP <= ${BUDGET.lcp}ms, CLS <= ${BUDGET.cls}, INP <= ${BUDGET.inp}ms`)
  console.log(failed ? 'RESULT: over budget' : 'RESULT: all routes within budget')
}

main().catch((e) => {
  console.error('perf failed:', e.message)
  process.exit(1)
})
