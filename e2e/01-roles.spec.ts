import { expect, test } from '@playwright/test'
import { DEMO, rowByText, signIn, signOut } from './helpers'

/**
 * What each role can see. These assertions are deliberately about what EXISTS,
 * not about what is styled: the employee row count is 1 because Postgres
 * returns one row, not because the interface hid the rest.
 */
test.describe('role-scoped access', () => {
  test('employee signs in and is confined to their own record', async ({ page }) => {
    await signIn(page, 'employee')

    // An employee has no directory: one row is not a directory, so /directory
    // redirects them to their own profile.
    await page.goto('/directory')
    await expect(page).toHaveURL(/\/me$/)
    await expect(page.getByRole('heading', { name: DEMO.employee.name })).toBeVisible()

    // Admin-only sections are absent from the rail, not merely disabled.
    await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Directory|My team/ })).toHaveCount(0)

    // And the route itself refuses them.
    await page.goto('/analytics')
    await expect(page).not.toHaveURL(/\/analytics/)
  })

  test('manager sees their direct reports and an approval queue', async ({ page }) => {
    await signIn(page, 'manager')

    await page.goto('/directory')
    await expect(page.getByRole('heading', { name: 'My team' })).toBeVisible()

    // Tobias manages the Design team: himself plus four reports.
    const count = page.getByText(/\d+ (person|people)/)
    await expect(count).toBeVisible()
    await expect(count).toHaveText('5 people')

    // Someone on another team must not appear.
    await expect(page.getByText('Lena Kowalski')).toHaveCount(0)

    await page.goto('/leave')
    await expect(page.getByRole('tab', { name: /Team queue/ })).toBeVisible()

    // Managers are not admins.
    await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0)
  })

  test('admin sees the whole company and org analytics', async ({ page }) => {
    await signIn(page, 'admin')

    await expect(page.getByRole('heading', { name: 'Directory' })).toBeVisible()

    // Not asserted as an exact number: the create-employee spec adds a row, and
    // a suite that only passes on a pristine database is not a suite you re-run.
    const total = Number((await page.getByText(/\d+ people/).innerText()).match(/\d+/)![0])
    expect(total).toBeGreaterThanOrEqual(25)

    // People from several different teams are all visible to an admin.
    await expect(rowByText(page, 'Lena Kowalski')).toHaveCount(1)
    await expect(rowByText(page, 'Maya Okonkwo')).toHaveCount(1)

    await page.goto('/analytics')
    await expect(page.getByRole('heading', { name: 'Headcount by department' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Attendance rate' })).toBeVisible()
  })

  test('signing out ends the session and protects the routes', async ({ page }) => {
    await signIn(page, 'admin')
    await signOut(page)

    await page.goto('/directory')
    await expect(page).toHaveURL(/\/login/)
  })
})
