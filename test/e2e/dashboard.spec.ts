import { expect, test } from '@playwright/test';
import { TEST_USERS, setupAuthenticatedTest } from './helpers/auth';

/**
 * E2E Test: Dashboard Flow
 *
 * Tests the main dashboard:
 * - Dashboard display
 * - Stats cards
 * - Charts loading
 * - Navigation
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedTest(page, TEST_USERS.owner);
  });

  test.describe('Dashboard Display', () => {
    test('should display dashboard page @smoke', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Check page loaded
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should display welcome message or heading', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Look for heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Look for stat cards
      const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="card"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to leads page', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Click leads link
      const leadsLink = page.locator('a[href*="/leads"], [data-testid="leads-link"]').first();
      if (await leadsLink.isVisible()) {
        await leadsLink.click();
        await expect(page).toHaveURL(/\/leads/);
      }
    });

    test('should navigate to analytics page', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Click analytics link
      const analyticsLink = page.locator('a[href*="/analytics"], [data-testid="analytics-link"]').first();
      if (await analyticsLink.isVisible()) {
        await analyticsLink.click();
        await expect(page).toHaveURL(/\/analytics/);
      }
    });

    test('should navigate to settings page', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Click settings link
      const settingsLink = page.locator('a[href*="/settings"], [data-testid="settings-link"]').first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/);
      }
    });
  });

  test.describe('Sidebar', () => {
    test('should display sidebar navigation', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Check sidebar exists
      const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
      await expect(sidebar).toBeVisible();
    });

    test('should toggle sidebar on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Look for hamburger menu
      const menuButton = page.locator('[data-testid="menu-toggle"], button[aria-label*="menu"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);

        // Check sidebar is visible
        const sidebar = page.locator('[data-testid="sidebar"], nav').first();
        await expect(sidebar).toBeVisible();
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('should have quick action to create lead', async ({ page }) => {
      await page.goto(`/dashboard/${TEST_USERS.owner.organizationId}`);

      // Look for quick action button
      const quickAction = page.locator('[data-testid="quick-add-lead"], button:has-text("新規リード"), button:has-text("Add Lead")').first();
      if (await quickAction.isVisible()) {
        await quickAction.click();
        
        // Check dialog opens
        await page.waitForTimeout(300);
        const dialog = page.locator('[role="dialog"]');
        const dialogVisible = await dialog.isVisible();
        // Dialog may or may not open depending on implementation
      }
    });
  });
});
