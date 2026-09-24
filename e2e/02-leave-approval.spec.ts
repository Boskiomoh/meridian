import { expect, test } from '@playwright/test'
import { rowByText, signIn, uniqueSuffix } from './helpers'

/**
 * The core product flow, end to end:
 *   admin creates an employee
 *   -> employee files a leave request
 *   -> manager approves it
 *   -> the employee's own view updates LIVE, with no reload
 *
 * The last step is the one worth having a browser for. It is asserted with two
 * contexts open at once and an explicit ban on reloading the employee's page.
 */
test.describe('leave request and approval', () => {
  test('an admin can create an employee', async ({ page }) => {
    await signIn(page, 'admin')

    const before = Number((await page.getByText(/\d+ people/).innerText()).match(/\d+/)![0])

    const suffix = uniqueSuffix()
    const name = `Testcase Probe ${suffix}`

    await page.getByRole('button', { name: 'Add employee' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Full name').fill(name)
    await dialog.getByLabel('Work email').fill(`testcase.probe.${suffix}@northlane.studio`)
    await dialog.getByLabel('Job title').fill('Automation Fixture')
    await dialog.getByLabel('Start date').fill('2026-09-01')
    await dialog.getByRole('button', { name: 'Add employee' }).click()

    await expect(dialog).toBeHidden({ timeout: 20_000 })

    // The new person is really in the directory, not just in local state.
    await page.getByRole('searchbox', { name: 'Search people' }).fill(name)
    await expect(rowByText(page, name)).toHaveCount(1)

    await page.getByRole('searchbox', { name: 'Search people' }).fill('')
    await expect(page.getByText(/\d+ people/)).toHaveText(`${before + 1} people`)

    // Leave the dataset as close to how it was found as the client can manage.
    await page.getByRole('searchbox', { name: 'Search people' }).fill(name)
    await rowByText(page, name).click()
    await page.getByRole('button', { name: 'Deactivate' }).click()
    // Scoped to the row: a bare getByText('Deactivated') also matches the
    // hidden <option> in the status filter.
    await expect(rowByText(page, name)).toContainText('Deactivated')
  })

  test('validation refuses an incomplete leave request', async ({ page }) => {
    await signIn(page, 'employee')
    await page.goto('/leave')

    await page.getByRole('button', { name: 'Request leave' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Submit request' }).click()

    // Still open, and it says what is wrong rather than failing silently.
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Choose the first day you will be away.')).toBeVisible()
    await expect(dialog.getByText('Give your manager a short reason.')).toBeVisible()
  })

  test('employee files a request, manager approves, employee sees it live', async ({ browser }) => {
    const reason = `Playwright fixture ${uniqueSuffix()}`

    const employeeCtx = await browser.newContext()
    const managerCtx = await browser.newContext()
    const employee = await employeeCtx.newPage()
    const manager = await managerCtx.newPage()

    try {
      // --- 1. the employee files a request ---------------------------------
      await signIn(employee, 'employee')
      await employee.goto('/leave')

      await employee.getByRole('button', { name: 'Request leave' }).click()
      const form = employee.getByRole('dialog')
      await form.getByLabel('First day').fill('2026-11-16')
      await form.getByLabel('Last day').fill('2026-11-20')
      await form.getByLabel('Reason').fill(reason)
      await form.getByRole('button', { name: 'Submit request' }).click()
      await expect(form).toBeHidden()

      const employeeRow = rowByText(employee, reason)
      await expect(employeeRow).toHaveCount(1)
      await expect(employeeRow).toContainText('Pending')

      // --- 2. the manager sees it in their queue ---------------------------
      await signIn(manager, 'manager')
      await manager.goto('/leave')

      const managerRow = rowByText(manager, reason)
      await expect(managerRow).toHaveCount(1, { timeout: 20_000 })
      await expect(managerRow).toContainText('Pending')

      // --- 3. the manager approves it --------------------------------------
      await managerRow.click()
      const inspector = manager.locator('aside')
      await expect(inspector.getByText('Team coverage')).toBeVisible()

      await manager.getByLabel(/Comment/).fill('Approved by the E2E suite.')
      await manager.getByRole('button', { name: 'Approve', exact: true }).click()

      await expect(rowByText(manager, reason)).toContainText('Approved', { timeout: 20_000 })

      // --- 4. the employee's page updates WITHOUT a reload ------------------
      // No employee.reload() anywhere in this test -- that is the whole point.
      await expect(rowByText(employee, reason)).toContainText('Approved', { timeout: 25_000 })

      // And the manager's comment reached the requester.
      await rowByText(employee, reason).click()
      await expect(employee.getByText('Approved by the E2E suite.')).toBeVisible()
    } finally {
      await employeeCtx.close()
      await managerCtx.close()
    }
  })

  test('an employee cannot approve their own request', async ({ page }) => {
    await signIn(page, 'employee')
    await page.goto('/leave')

    const pending = page.locator('ul > li button').filter({ hasText: 'Pending' }).first()
    await expect(pending).toBeVisible()
    await pending.click()

    // No decision controls exist for a requester, on their own request.
    await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Deny', exact: true })).toHaveCount(0)
    await expect(page.getByText(/Waiting on a decision/)).toBeVisible()
  })
})
