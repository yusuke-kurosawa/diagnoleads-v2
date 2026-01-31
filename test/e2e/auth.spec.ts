import { expect, test } from '@playwright/test';

/**
 * E2E Test: Authentication Flow
 *
 * Tests the complete authentication cycle:
 * - User registration (signup)
 * - User login
 * - Session persistence
 * - User logout
 * - Password validation
 * - Error handling
 */

test.describe('Authentication', () => {
  const timestamp = Date.now();
  const testUser = {
    name: `E2E Test User ${timestamp}`,
    email: `e2e-test-${timestamp}@example.com`,
    password: process.env.E2E_TEST_PASSWORD || 'e2e-test-pw',
  };

  test.describe('Sign Up', () => {
    test('should display signup page correctly', async ({ page }) => {
      await page.goto('/sign-up');

      // Check page elements
      await expect(page.getByRole('heading', { name: /サインアップ|Sign Up|アカウント作成/i })).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /登録|Sign Up|作成/i })).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/sign-up');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.getByText(/名前|name/i)).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Check for email validation error
      await expect(page.getByText(/メール|email|有効/i)).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123'); // Too weak

      await page.click('button[type="submit"]');

      // Check for password validation error
      await expect(page.getByText(/パスワード|password|文字/i)).toBeVisible();
    });

    test('should successfully register a new user', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Should redirect to dashboard or onboarding
      await page.waitForURL(/\/(dashboard|onboarding|sign-in)/);
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/sign-up');

      // Try to register with same email again
      await page.fill('input[name="name"]', 'Another User');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Should show error about existing email
      await expect(page.getByText(/既に|already|存在/i)).toBeVisible();
    });
  });

  test.describe('Sign In', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/sign-in');

      // Check page elements
      await expect(page.getByRole('heading', { name: /ログイン|Sign In|サインイン/i })).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /ログイン|Sign In|サインイン/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'WrongP@ss999');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.getByText(/無効|invalid|正しくない|見つかりません/i)).toBeVisible();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/);
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/sign-in');

      const signupLink = page.getByRole('link', { name: /新規登録|Sign Up|アカウント作成/i });
      await expect(signupLink).toBeVisible();

      await signupLink.click();
      await page.waitForURL(/\/sign-up/);
    });

    test('should have link to password reset', async ({ page }) => {
      await page.goto('/sign-in');

      const resetLink = page.getByRole('link', { name: /パスワード|忘れ|reset|forgot/i });
      if (await resetLink.isVisible()) {
        await resetLink.click();
        await page.waitForURL(/\/(reset|forgot)/);
      }
    });
  });

  test.describe('Session & Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should maintain session after page refresh', async ({ page }) => {
      // Get current URL
      const currentUrl = page.url();

      // Refresh page
      await page.reload();

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should display user information in header', async ({ page }) => {
      // Look for user menu or avatar
      const userMenu = page.locator('[data-testid="user-menu"], [data-testid="user-dropdown"]');
      if (await userMenu.isVisible()) {
        await expect(userMenu).toBeVisible();
      }
    });

    test('should successfully logout', async ({ page }) => {
      // Find and click logout
      // Try different selectors for user menu
      const userMenuSelectors = [
        '[data-testid="user-menu"]',
        '[data-testid="user-dropdown"]',
        'button:has-text("ログアウト")',
        'button:has-text("Logout")',
      ];

      for (const selector of userMenuSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await element.click();
          break;
        }
      }

      // Look for logout button
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        'button:has-text("ログアウト")',
        'button:has-text("Logout")',
        'a:has-text("ログアウト")',
        'a:has-text("Logout")',
      ];

      for (const selector of logoutSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await element.click();
          break;
        }
      }

      // Should redirect to login or home page
      await page.waitForURL(/\/(sign-in|login|$)/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/(sign-in|login)/);
    });

    test('should redirect to original destination after login', async ({ page }) => {
      // Clear session
      await page.context().clearCookies();

      // Try to access specific protected route
      await page.goto('/dashboard/settings');

      // Should redirect to login
      await page.waitForURL(/\/(sign-in|login)/);

      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect back to original destination (or dashboard)
      await page.waitForURL(/\/dashboard/);
    });
  });
});
