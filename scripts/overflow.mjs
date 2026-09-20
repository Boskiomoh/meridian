/**
 * Horizontal-overflow probe.
 *
 * Reports any route whose document scrolls sideways, and names the exact
 * elements sticking out past the viewport, so the fix targets the real cause
 * rather than a guess.
 *
 *   node scripts/overflow.mjs [baseURL]
 */
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const WIDTHS = [320, 360, 390, 440, 768, 1024]

const ROUTES = [
  { path: '/login', auth: false },
  { path: '/directory', auth: true },
  { path: '/me', auth: true },
  { path: '/leave', auth: true },
  { path: '/attendance', auth: true },
  { path: '/analytics', auth: true },
]

const FIND_OVERFLOW = `(() => {
  const docWidth = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > docWidth + 1 || r.left < -1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') || '').slice(0, 110),
        text: (el.textContent || '').trim().slice(0, 45),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
  }
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: docWidth,
    offenders: out.slice(0, 12),
  };
})()`

async function main() {
  const browser = await chromium.launch()
  let anyOverflow = false

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()

    // `load` rather than `networkidle`: Realtime keeps a websocket open, which
    // means "network idle" never actually arrives on an authenticated route.
    await page.goto(`${BASE}/login`, { waitUntil: 'load' })
    await page.getByRole('button', { name: /Priya Raghunathan/i }).click()
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 })

    for (const route of ROUTES) {
      if (!route.auth) {
        const anon = await browser.newContext({ viewport: { width, height: 900 } })
        const p2 = await anon.newPage()
        await p2.goto(`${BASE}${route.path}`, { waitUntil: 'load' })
        await p2.waitForTimeout(500)
        const res = await p2.evaluate(FIND_OVERFLOW)
        report(width, route.path, res)
        if (res.scrollWidth > res.clientWidth + 1) anyOverflow = true
        await anon.close()
        continue
      }

      await page.goto(`${BASE}${route.path}`, { waitUntil: 'load' })
      await page.waitForTimeout(1000)
      const res = await page.evaluate(FIND_OVERFLOW)
      report(width, route.path, res)
      if (res.scrollWidth > res.clientWidth + 1) anyOverflow = true
    }

    await context.close()
  }

  await browser.close()
  console.log(
    anyOverflow
      ? '\nRESULT: horizontal overflow found'
      : '\nRESULT: no horizontal overflow at any width',
  )
  if (anyOverflow) process.exitCode = 1
}

function report(width, path, res) {
  const over = res.scrollWidth > res.clientWidth + 1
  if (!over) {
    console.log(`  ok   ${String(width).padStart(4)}px ${path}`)
    return
  }
  console.log(
    `  OVER ${String(width).padStart(4)}px ${path}  scrollWidth=${res.scrollWidth} clientWidth=${res.clientWidth}`,
  )
  for (const o of res.offenders) {
    console.log(`        <${o.tag}> right=${o.right} w=${o.width} "${o.text}"`)
    console.log(`            class="${o.cls}"`)
  }
}

main().catch((e) => {
  console.error('overflow probe failed:', e.message)
  process.exit(1)
})
