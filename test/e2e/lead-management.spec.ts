import { test, expect } from '@playwright/test';
import { setupAuthenticatedTest, TEST_USERS } from './helpers/auth';

/**
 * E2E Test: Lead Management Flow
 *
 * Tests the complete CRUD operations for leads:
 * - Create new lead
 * - View lead list
 * - View lead details
 * - Update lead information
 * - Update lead status
 * - Delete lead
 *
 * Prerequisites:
 * - Test database with seeded organizations
 * - Test users with appropriate permissions
 */

test.describe('Lead Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as owner with full permissions
    await setupAuthenticatedTest(page, TEST_USERS.owner);
  });

  test('should display leads list page', async ({ page }) => {
    // Navigate to leads page
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Check page title
    await expect(page.getByRole('heading', { name: /リード一覧|Leads/i })).toBeVisible();

    // Check if table is visible
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: /名前|Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /メール|Email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /ステータス|Status/i })).toBeVisible();
  });

  test('should create a new lead', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Click "New Lead" button
    await page.click('[data-testid="new-lead-button"]');

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in lead form
    const timestamp = Date.now();
    const testEmail = `test-lead-${timestamp}@example.com`;

    await page.fill('input[name="name"]', `Test Lead ${timestamp}`);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="company"]', 'Test Company');
    await page.fill('input[name="phone"]', '+81-90-1234-5678');

    // Select status
    await page.click('[data-testid="status-select"]');
    await page.click('[data-value="new"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success toast
    await expect(page.getByText(/リードを作成しました|Lead created/i)).toBeVisible();

    // Verify lead appears in the table
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test('should view lead details', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead in the table
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet to open
    await expect(page.getByRole('complementary')).toBeVisible();

    // Verify lead details are displayed
    await expect(page.getByText(/リード詳細|Lead Details/i)).toBeVisible();

    // Check that key information is displayed
    await expect(page.locator('[data-testid="lead-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-status"]')).toBeVisible();
  });

  test('should update lead information', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Click edit button
    await page.click('[data-testid="edit-lead-button"]');

    // Wait for edit dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Update name
    const updatedName = `Updated Lead ${Date.now()}`;
    await page.fill('input[name="name"]', updatedName);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success toast
    await expect(page.getByText(/リードを更新しました|Lead updated/i)).toBeVisible();

    // Verify updated name appears in the table
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should update lead status', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Click edit button
    await page.click('[data-testid="edit-lead-button"]');

    // Wait for edit dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Change status to "contacted"
    await page.click('[data-testid="status-select"]');
    await page.click('[data-value="contacted"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success toast
    await expect(page.getByText(/リードを更新しました|Lead updated/i)).toBeVisible();

    // Verify status badge updated
    await expect(page.getByText(/連絡済み|Contacted/i)).toBeVisible();
  });

  test('should delete a lead', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // First, create a lead to delete
    await page.click('[data-testid="new-lead-button"]');
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    const testEmail = `delete-test-${timestamp}@example.com`;

    await page.fill('input[name="name"]', `To Delete ${timestamp}`);
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Wait for lead to be created
    await expect(page.getByText(/リードを作成しました|Lead created/i)).toBeVisible();

    // Find and click on the created lead
    await page.getByText(testEmail).click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Click delete button
    await page.click('[data-testid="delete-lead-button"]');

    // Wait for confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Wait for success toast
    await expect(page.getByText(/リードを削除しました|Lead deleted/i)).toBeVisible();

    // Verify lead is no longer in the table
    await expect(page.getByText(testEmail)).not.toBeVisible();
  });

  test('should filter leads by status', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click status filter
    await page.click('[data-testid="status-filter"]');

    // Select "new" status
    await page.click('[data-value="new"]');

    // Wait for table to update
    await page.waitForTimeout(500);

    // Verify all visible leads have "new" status
    const statusBadges = await page.locator('[data-testid="lead-status-badge"]').all();
    for (const badge of statusBadges) {
      await expect(badge).toHaveText(/新規|New/i);
    }
  });

  test('should search leads by email', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Get first lead's email
    const firstEmail = await page.locator('table tbody tr td:nth-child(2)').first().textContent();

    if (firstEmail) {
      // Enter search query
      await page.fill('[data-testid="search-input"]', firstEmail);

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify only matching lead is visible
      await expect(page.getByText(firstEmail)).toBeVisible();

      // Count visible rows (should be 1 or more if duplicates)
      const visibleRows = await page.locator('table tbody tr').count();
      expect(visibleRows).toBeGreaterThanOrEqual(1);
    }
  });

  test('should paginate through leads', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Check if pagination controls exist
    const nextButton = page.locator('[data-testid="next-page-button"]');

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      // Get first lead's email before pagination
      const firstLeadEmail = await page.locator('table tbody tr td:nth-child(2)').first().textContent();

      // Click next page
      await nextButton.click();

      // Wait for table to update
      await page.waitForTimeout(500);

      // Get first lead's email after pagination
      const newFirstLeadEmail = await page.locator('table tbody tr td:nth-child(2)').first().textContent();

      // Verify leads changed
      expect(firstLeadEmail).not.toBe(newFirstLeadEmail);

      // Click previous page
      await page.click('[data-testid="prev-page-button"]');

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify we're back to the original lead
      const backToFirstEmail = await page.locator('table tbody tr td:nth-child(2)').first().textContent();
      expect(backToFirstEmail).toBe(firstLeadEmail);
    }
  });
});
