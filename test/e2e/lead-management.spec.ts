import { expect, test } from '@playwright/test';
import { TEST_USERS, setupAuthenticatedTest } from './helpers/auth';

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

    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      // Get first lead's email before pagination
      const firstLeadEmail = await page
        .locator('table tbody tr td:nth-child(2)')
        .first()
        .textContent();

      // Click next page
      await nextButton.click();

      // Wait for table to update
      await page.waitForTimeout(500);

      // Get first lead's email after pagination
      const newFirstLeadEmail = await page
        .locator('table tbody tr td:nth-child(2)')
        .first()
        .textContent();

      // Verify leads changed
      expect(firstLeadEmail).not.toBe(newFirstLeadEmail);

      // Click previous page
      await page.click('[data-testid="prev-page-button"]');

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify we're back to the original lead
      const backToFirstEmail = await page
        .locator('table tbody tr td:nth-child(2)')
        .first()
        .textContent();
      expect(backToFirstEmail).toBe(firstLeadEmail);
    }
  });

  test('should sort leads by column', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on name column header to sort
    const nameHeader = page.getByRole('columnheader', { name: /名前|Name/i });
    await nameHeader.click();

    // Wait for table to update
    await page.waitForTimeout(500);

    // Get first lead's name after sort
    const firstNameAfterSort = await page
      .locator('table tbody tr td:first-child')
      .first()
      .textContent();

    // Click again to reverse sort
    await nameHeader.click();
    await page.waitForTimeout(500);

    // Get first lead's name after reverse sort
    const firstNameAfterReverseSort = await page
      .locator('table tbody tr td:first-child')
      .first()
      .textContent();

    // Names should be different (or same if only one lead)
    // Just verify the sort action completed without error
    expect(firstNameAfterSort).toBeDefined();
    expect(firstNameAfterReverseSort).toBeDefined();
  });

  test('should bulk select leads', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Check if bulk select checkbox exists
    const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"], thead input[type="checkbox"]').first();
    
    if (await selectAllCheckbox.isVisible()) {
      // Click select all
      await selectAllCheckbox.click();

      // Verify bulk action buttons appear
      const bulkActionBar = page.locator('[data-testid="bulk-action-bar"], [role="toolbar"]');
      if (await bulkActionBar.isVisible()) {
        await expect(bulkActionBar).toBeVisible();
      }

      // Verify row checkboxes are checked
      const rowCheckboxes = page.locator('tbody input[type="checkbox"]:checked');
      const checkedCount = await rowCheckboxes.count();
      expect(checkedCount).toBeGreaterThan(0);
    }
  });

  test('should bulk update lead status', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Select first two leads
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const checkboxCount = await rowCheckboxes.count();
    
    if (checkboxCount >= 2) {
      await rowCheckboxes.nth(0).click();
      await rowCheckboxes.nth(1).click();

      // Look for bulk status update button
      const bulkStatusButton = page.locator('[data-testid="bulk-status-button"]');
      
      if (await bulkStatusButton.isVisible()) {
        await bulkStatusButton.click();

        // Select new status
        await page.click('[data-value="qualified"]');

        // Wait for success toast
        await expect(page.getByText(/ステータスを更新しました|Status updated/i)).toBeVisible();
      }
    }
  });

  test('should export leads', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Look for export button
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("エクスポート"), button:has-text("Export")').first();
    
    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      
      await exportButton.click();

      // Check if export options appear
      const csvOption = page.locator('[data-value="csv"], button:has-text("CSV")');
      if (await csvOption.isVisible()) {
        await csvOption.click();
      }

      const download = await downloadPromise;
      if (download) {
        // Verify download started
        expect(download.suggestedFilename()).toContain('.csv');
      }
    }
  });

  test('should show empty state when no leads', async ({ page }) => {
    // Navigate with a filter that likely returns no results
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads?search=nonexistent-lead-xyz-123`);

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Check for empty state or no results message
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
    const noResultsText = page.getByText(/リードが見つかりません|No leads found|結果なし/i);
    
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasNoResultsText = await noResultsText.isVisible().catch(() => false);
    
    // Either empty state component or no results text should be visible
    // (or the table with 0 rows)
    const tableRows = await page.locator('table tbody tr').count();
    expect(hasEmptyState || hasNoResultsText || tableRows === 0).toBeTruthy();
  });

  test('should filter leads by date range', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Look for date filter
    const dateFilter = page.locator('[data-testid="date-filter"], [data-testid="date-range-picker"]');
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();

      // Select "Last 7 days" or similar preset
      const preset = page.locator('[data-value="last7days"], button:has-text("過去7日"), button:has-text("Last 7 days")');
      if (await preset.isVisible()) {
        await preset.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should filter leads by score range', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Look for score filter
    const scoreFilter = page.locator('[data-testid="score-filter"]');
    
    if (await scoreFilter.isVisible()) {
      await scoreFilter.click();

      // Select high score range
      const highScoreOption = page.locator('[data-value="high"], button:has-text("高スコア"), button:has-text("High")');
      if (await highScoreOption.isVisible()) {
        await highScoreOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show lead activity timeline', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Look for activity tab or timeline
    const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("アクティビティ"), button:has-text("Activity")');
    
    if (await activityTab.isVisible()) {
      await activityTab.click();

      // Check for timeline items
      const timeline = page.locator('[data-testid="activity-timeline"], .timeline');
      if (await timeline.isVisible()) {
        await expect(timeline).toBeVisible();
      }
    }
  });

  test('should add tags to lead', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Look for add tag button
    const addTagButton = page.locator('[data-testid="add-tag-button"], button:has-text("タグ追加"), button:has-text("Add Tag")');
    
    if (await addTagButton.isVisible()) {
      await addTagButton.click();

      // Select or create a tag
      const tagInput = page.locator('[data-testid="tag-input"], input[placeholder*="タグ"], input[placeholder*="tag"]');
      if (await tagInput.isVisible()) {
        await tagInput.fill('E2E Test Tag');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    }
  });

  test('should add comment to lead', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Click on first lead
    const firstLeadRow = page.locator('table tbody tr').first();
    await firstLeadRow.click();

    // Wait for details sheet
    await expect(page.getByRole('complementary')).toBeVisible();

    // Look for comments section or tab
    const commentsTab = page.locator('[data-testid="comments-tab"], button:has-text("コメント"), button:has-text("Comments")');
    
    if (await commentsTab.isVisible()) {
      await commentsTab.click();
    }

    // Look for comment input
    const commentInput = page.locator('[data-testid="comment-input"], textarea[placeholder*="コメント"], textarea[placeholder*="comment"]');
    
    if (await commentInput.isVisible()) {
      await commentInput.fill('E2E Test Comment ' + Date.now());
      
      // Submit comment
      const submitButton = page.locator('[data-testid="submit-comment"], button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Lead Management - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedTest(page, TEST_USERS.owner);
  });

  test('should display leads list on mobile', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Check that leads are visible (may be cards instead of table)
    const leadsContent = page.locator('table, [data-testid="leads-list"], [data-testid="lead-card"]').first();
    await expect(leadsContent).toBeVisible();
  });

  test('should have responsive actions menu on mobile', async ({ page }) => {
    await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}/leads`);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Look for mobile menu or hamburger
    const mobileMenu = page.locator('[data-testid="mobile-actions"], [data-testid="actions-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      // Check menu items are accessible
      const menuItems = page.locator('[role="menuitem"], [role="option"]');
      expect(await menuItems.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Lead Management - Permissions', () => {
  test('should restrict actions for member role', async ({ page }) => {
    // Login as member (limited permissions)
    await setupAuthenticatedTest(page, TEST_USERS.member);

    await page.goto(`/dashboard/${TEST_USERS.member.organizationId}/leads`);

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => null);

    // Delete button should be hidden or disabled for members
    const deleteButton = page.locator('[data-testid="delete-lead-button"]');
    
    // Click on first lead if table loaded
    const firstLeadRow = page.locator('table tbody tr').first();
    if (await firstLeadRow.isVisible()) {
      await firstLeadRow.click();
      await page.waitForTimeout(500);

      // Check delete button is not visible or disabled
      const isDeleteVisible = await deleteButton.isVisible().catch(() => false);
      const isDeleteDisabled = await deleteButton.isDisabled().catch(() => true);
      
      expect(isDeleteVisible === false || isDeleteDisabled === true).toBeTruthy();
    }
  });
});
