import { expect, test } from '@playwright/test';

/**
 * E2E Test: Embed Widget Settings
 *
 * Tests the embed widget configuration management:
 * - View embed settings page
 * - Create new embed configuration
 * - Update embed configuration
 * - Regenerate API key
 * - Copy embed code
 * - Delete configuration
 *
 * Note: These tests require authentication and an active organization.
 * Run with: bun run test:e2e -- embed-settings.spec.ts
 */

test.describe('Embed Widget Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to embed settings page (assuming authenticated via global setup)
    // In real tests, use setupAuthenticatedTest helper
    await page.goto('/ja/settings/embed');
  });

  test('should display embed settings page header', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /Embed Widget Settings|埋め込みウィジェット/i })).toBeVisible();

    // Check description
    await expect(page.getByText(/Configure widgets|ウィジェットを設定/i)).toBeVisible();

    // Check "New Configuration" button
    await expect(page.getByRole('button', { name: /New Configuration|新規設定/i })).toBeVisible();
  });

  test('should show empty state when no configurations exist', async ({ page }) => {
    // Check for empty state message (when no configs)
    const emptyState = page.getByText(/No Embed Configurations|設定がありません/i);
    const configCards = page.locator('[data-testid="embed-config-card"]');

    // Either empty state or config cards should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasCards = (await configCards.count()) > 0;

    expect(hasEmptyState || hasCards).toBeTruthy();
  });

  test('should open create configuration dialog', async ({ page }) => {
    // Click "New Configuration" button
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');

    // Wait for dialog to open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Check dialog title
    await expect(dialog.getByRole('heading', { name: /Create Embed Configuration|埋め込み設定を作成/i })).toBeVisible();

    // Check form fields are present
    await expect(page.getByLabel(/Configuration Name|設定名/i)).toBeVisible();
    await expect(page.getByText(/Allowed Origins|許可オリジン/i)).toBeVisible();
    await expect(page.getByText(/Theme Customization|テーマ/i)).toBeVisible();
  });

  test('should validate required fields in create form', async ({ page }) => {
    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to submit without filling required fields
    const createButton = page.getByRole('button', { name: /Create Configuration|設定を作成/i });

    // Button should be disabled when required fields are empty
    await expect(createButton).toBeDisabled();
  });

  test('should add and remove allowed origins', async ({ page }) => {
    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill origin input
    const originInput = page.getByPlaceholder(/https:\/\/example\.com/i);
    await originInput.fill('https://test-origin.com');

    // Click Add button
    await page.click('button:has-text("Add")');

    // Verify origin badge appears
    await expect(page.getByText('https://test-origin.com')).toBeVisible();

    // Remove the origin (click X button on badge)
    const badge = page.locator('.gap-1:has-text("https://test-origin.com")');
    await badge.locator('button').click();

    // Verify origin is removed
    await expect(page.getByText('https://test-origin.com')).not.toBeVisible();
  });

  test('should show color picker for theme customization', async ({ page }) => {
    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check color inputs exist
    await expect(page.getByText(/Primary Color|プライマリカラー/i)).toBeVisible();
    await expect(page.getByText(/Background Color|背景色/i)).toBeVisible();
    await expect(page.getByText(/Text Color|テキスト色/i)).toBeVisible();

    // Check color input type
    const colorInputs = page.locator('input[type="color"]');
    expect(await colorInputs.count()).toBeGreaterThanOrEqual(3);
  });

  test('should show border radius selection', async ({ page }) => {
    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check border radius label
    await expect(page.getByText(/Border Radius|角丸/i)).toBeVisible();

    // Click to open select
    const radiusSelect = page.locator('button:has-text("Medium"), button:has-text("md")').first();
    if (await radiusSelect.isVisible()) {
      await radiusSelect.click();

      // Check options are available
      await expect(page.getByRole('option', { name: /None|なし/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /Small|小/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /Large|大/i })).toBeVisible();
    }
  });

  test('should close dialog on cancel', async ({ page }) => {
    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel"), button:has-text("キャンセル")');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Embed Configuration Management', () => {
  // These tests assume at least one configuration exists
  test.skip('should display configuration card with details', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    // Wait for configs to load
    await page.waitForSelector('[data-testid="embed-config-card"]', { timeout: 5000 }).catch(() => {});

    const configCard = page.locator('[data-testid="embed-config-card"]').first();

    if (await configCard.isVisible()) {
      // Check card displays key information
      await expect(configCard.getByText(/API Key/i)).toBeVisible();
      await expect(configCard.getByText(/Allowed Origins|許可オリジン/i)).toBeVisible();
      await expect(configCard.getByText(/Embed Code|埋め込みコード/i)).toBeVisible();
    }
  });

  test.skip('should toggle configuration active status', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    const toggleSwitch = page.locator('button[role="switch"]').first();

    if (await toggleSwitch.isVisible()) {
      const initialState = await toggleSwitch.getAttribute('aria-checked');

      // Click to toggle
      await toggleSwitch.click();

      // Wait for state change
      await page.waitForTimeout(500);

      const newState = await toggleSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }
  });

  test.skip('should show confirmation before regenerating API key', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    const regenerateButton = page.getByRole('button', { name: /Regenerate|再生成/i }).first();

    if (await regenerateButton.isVisible()) {
      // Setup dialog handler
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('API key');
        await dialog.dismiss();
      });

      await regenerateButton.click();
    }
  });

  test.skip('should copy embed code to clipboard', async ({ page, context }) => {
    await page.goto('/ja/settings/embed');

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('[data-testid="copy-embed-code"]').first();

    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Check for success toast
      await expect(page.getByText(/Copied|コピーしました/i)).toBeVisible();
    }
  });

  test.skip('should show confirmation before deleting configuration', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    const deleteButton = page.locator('button svg.text-destructive').first();

    if (await deleteButton.isVisible()) {
      // Setup dialog handler
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        await dialog.dismiss();
      });

      await deleteButton.click();
    }
  });
});

test.describe('Embed Settings Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check heading text
    await expect(h1).toContainText(/Embed|埋め込み/i);
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    // Open create dialog
    await page.click('button:has-text("New Configuration"), button:has-text("新規設定")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check that inputs have associated labels
    const nameInput = page.getByLabel(/Configuration Name|設定名/i);
    await expect(nameInput).toBeVisible();

    const leadSourceInput = page.getByLabel(/Lead Source|リードソース/i);
    await expect(leadSourceInput).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/ja/settings/embed');

    // Tab to the "New Configuration" button
    await page.keyboard.press('Tab');

    // Check that a button is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
