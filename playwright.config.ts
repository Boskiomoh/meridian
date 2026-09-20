import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.MERIDIAN_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  // The approval flow mutates shared demo rows, so specs run in file order,
  // one at a time. Parallelism here would make the suite flake, and a flaky
  // suite proves nothing.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
