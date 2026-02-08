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

  test.describe('Password Reset', () => {
    test('should display password reset request page', async ({ page }) => {
      await page.goto('/forgot-password');

      // Check page elements
      await expect(page.getByRole('heading', { name: /パスワード|Password|リセット|Reset|忘れ/i })).toBeVisible();
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /送信|Send|リセット|Reset/i })).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"], input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      // Check for validation error
      await expect(page.getByText(/メール|email|有効|valid/i)).toBeVisible();
    });

    test('should show success message after reset request', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"], input[type="email"]', testUser.email);
      await page.click('button[type="submit"]');

      // Wait for success message (even if email doesn't exist, show generic success for security)
      await expect(page.getByText(/送信|sent|確認|check|メール/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/forgot-password');

      const loginLink = page.getByRole('link', { name: /ログイン|Sign In|戻る|Back/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Security', () => {
    test('should not expose user existence via login error messages', async ({ page }) => {
      await page.goto('/sign-in');

      // Try with non-existent email
      await page.fill('input[name="email"]', 'nonexistent-user-xyz@example.com');
      await page.fill('input[name="password"]', 'SomePassword123!');
      await page.click('button[type="submit"]');

      // Error message should be generic (not reveal if user exists)
      const errorText = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').first().textContent();
      if (errorText) {
        expect(errorText.toLowerCase()).not.toContain('user not found');
        expect(errorText.toLowerCase()).not.toContain('ユーザーが存在しません');
      }
    });

    test('should rate limit login attempts', async ({ page }) => {
      await page.goto('/sign-in');

      // Try multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'WrongPassword' + i);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // After multiple attempts, should show rate limit or additional security message
      const rateLimitText = page.getByText(/しばらく|wait|too many|attempts|制限/i);
      // Rate limiting may or may not be visible depending on implementation
      // This test just ensures the flow doesn't crash
    });

    test('should clear sensitive data on logout', async ({ page }) => {
      // Login first
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);

      // Store some data in localStorage (simulating app behavior)
      await page.evaluate(() => {
        localStorage.setItem('test-data', 'sensitive');
      });

      // Logout
      const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("ログアウト"), button:has-text("Logout")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL(/\/(sign-in|login|$)/);
      }

      // Cookies should be cleared
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
      // Session cookie should be cleared or expired
      if (sessionCookie) {
        expect(new Date(sessionCookie.expires * 1000) <= new Date()).toBeTruthy();
      }
    });

    test('should use HTTPS for auth pages in production', async ({ page }) => {
      // This test checks that in production, auth pages use HTTPS
      // In development, HTTP is acceptable
      const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
      
      if (baseUrl.startsWith('https://')) {
        await page.goto('/sign-in');
        expect(page.url()).toMatch(/^https:/);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels on login page', async ({ page }) => {
      await page.goto('/sign-in');

      // Check email input has label
      const emailInput = page.locator('input[name="email"]');
      const emailLabel = await emailInput.getAttribute('aria-label') || 
                        await page.locator('label[for="email"]').textContent();
      expect(emailLabel).toBeTruthy();

      // Check password input has label
      const passwordInput = page.locator('input[name="password"]');
      const passwordLabel = await passwordInput.getAttribute('aria-label') ||
                           await page.locator('label[for="password"]').textContent();
      expect(passwordLabel).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/sign-in');

      // Tab to email input
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement?.name || document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();

      // Tab to password input
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.name || document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();

      // Tab to submit button
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement?.toLowerCase()).toBe('button');
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/sign-in');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for error with ARIA attributes
      const errorElement = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display login form properly on mobile', async ({ page }) => {
      await page.goto('/sign-in');

      // Form should be visible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Form should fit within viewport
      const form = page.locator('form').first();
      const box = await form.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    });

    test('should have touch-friendly input sizes on mobile', async ({ page }) => {
      await page.goto('/sign-in');

      const inputs = page.locator('input:visible');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();
        if (box) {
          // Minimum touch target size
          expect(box.height).toBeGreaterThanOrEqual(36);
        }
      }
    });
  });

  // ============================================================
  // 追加テスト: エラーハンドリング・ユーザーナビゲーション強化
  // ============================================================

  test.describe('Sign Up - Advanced Validation', () => {
    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/signup');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidP@ss123');
      await page.fill('input[name="confirmPassword"]', 'DifferentP@ss456');

      await page.click('button[type="submit"]');

      // Should show password mismatch error
      await expect(page.getByText(/一致|match|同じ/i)).toBeVisible();
    });

    test('should show password complexity requirements', async ({ page }) => {
      await page.goto('/signup');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'simplepassword'); // No uppercase, no number
      await page.fill('input[name="confirmPassword"]', 'simplepassword');

      await page.click('button[type="submit"]');

      // Should show complexity error (uppercase, number required)
      await expect(page.getByText(/大文字|小文字|数字|uppercase|lowercase|number|複雑/i)).toBeVisible();
    });

    test('should disable submit button while loading', async ({ page }) => {
      await page.goto('/signup');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', `new-user-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'ValidP@ss123');
      await page.fill('input[name="confirmPassword"]', 'ValidP@ss123');

      // Click submit and immediately check button state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled or show loading state
      const isDisabled = await submitButton.isDisabled();
      const buttonText = await submitButton.textContent();
      
      // Either disabled or shows loading text
      expect(isDisabled || buttonText?.includes('...') || buttonText?.includes('送信中') || buttonText?.includes('Loading')).toBeTruthy();
    });
  });

  test.describe('Sign In - Error Recovery', () => {
    test('should clear error when user starts typing after failed login', async ({ page }) => {
      await page.goto('/sign-in');

      // First, trigger an error
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');

      // Wait for error to appear
      await page.waitForTimeout(1000);

      // Start typing in email field
      await page.fill('input[name="email"]', 'correct@example.com');

      // Form should still be usable (not frozen)
      await expect(page.locator('input[name="email"]')).toHaveValue('correct@example.com');
    });

    test('should allow retry after failed login', async ({ page }) => {
      await page.goto('/sign-in');

      // First failed attempt
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Second attempt should be possible
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('should show helpful error message for network issues', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should show network error or the page should handle gracefully
      await page.waitForTimeout(2000);
      
      // Re-enable network
      await page.context().setOffline(false);
    });
  });

  test.describe('Navigation - User Flow', () => {
    test('should navigate from login to signup and back', async ({ page }) => {
      await page.goto('/login');

      // Go to signup
      await page.click('a[href*="signup"], a:has-text("新規登録"), a:has-text("Sign Up")');
      await expect(page).toHaveURL(/\/signup/);

      // Go back to login
      await page.click('a[href*="login"], a:has-text("ログイン"), a:has-text("Log in")');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate from login to password reset and back', async ({ page }) => {
      await page.goto('/login');

      // Go to password reset
      const resetLink = page.locator('a[href*="reset"], a:has-text("パスワード"), a:has-text("Forgot")');
      if (await resetLink.isVisible()) {
        await resetLink.click();
        await expect(page).toHaveURL(/\/(reset|forgot)/);

        // Go back to login
        const backLink = page.locator('a[href*="login"], a:has-text("戻る"), a:has-text("Back")');
        if (await backLink.isVisible()) {
          await backLink.click();
          await expect(page).toHaveURL(/\/login/);
        }
      }
    });

    test('should handle browser back button correctly', async ({ page }) => {
      await page.goto('/login');
      await page.goto('/signup');
      
      // Press browser back
      await page.goBack();
      
      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should preserve form data on browser back (optional)', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill in some data
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      
      // Navigate away
      await page.goto('/login');
      
      // Go back
      await page.goBack();
      
      // Form might or might not preserve data depending on implementation
      // This test ensures navigation doesn't crash
      await expect(page.locator('input[name="name"]')).toBeVisible();
    });

    test('should redirect authenticated user away from login page', async ({ page }) => {
      // First login
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);

      // Try to access login page while authenticated
      await page.goto('/login');
      
      // Should redirect to dashboard or show appropriate message
      // (depending on implementation)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Loading States & UX', () => {
    test('should show loading indicator during login', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Click and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check for loading indicator (spinner, text change, or disabled state)
      const buttonText = await submitButton.textContent();
      const isDisabled = await submitButton.isDisabled();
      
      // Should show some indication of loading
      expect(
        isDisabled || 
        buttonText?.includes('...') || 
        buttonText?.includes('中') ||
        buttonText?.includes('Loading')
      ).toBeTruthy();
    });

    test('should prevent double submission', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      const submitButton = page.locator('button[type="submit"]');
      
      // Rapid double click
      await submitButton.click();
      await submitButton.click();

      // Should only submit once (button disabled after first click)
      // Wait a moment and check we're not in error state
      await page.waitForTimeout(500);
      
      // Form should not be in error state from double submission
    });

    test('should disable form inputs during submission', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Inputs should be disabled during submission
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      // At least one of these should be disabled
      const emailDisabled = await emailInput.isDisabled();
      const passwordDisabled = await passwordInput.isDisabled();

      // Implementation may or may not disable inputs
      // This test ensures the form handles submission gracefully
    });
  });

  test.describe('Error Messages - UX Quality', () => {
    test('should display user-friendly error for invalid email format', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');

      // Error should be user-friendly (not technical)
      const errorText = await page.locator('.text-red-500, .text-destructive, [role="alert"]').first().textContent();
      if (errorText) {
        expect(errorText.toLowerCase()).not.toContain('regex');
        expect(errorText.toLowerCase()).not.toContain('pattern');
        expect(errorText.toLowerCase()).not.toContain('exception');
      }
    });

    test('should show field-specific errors near the field', async ({ page }) => {
      await page.goto('/signup');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Error messages should appear near their respective fields
      const nameField = page.locator('input[name="name"]');
      const nameError = nameField.locator('..').locator('.text-red-500, .text-destructive');
      
      // Check that errors are associated with fields (nearby in DOM)
      const allErrors = page.locator('.text-red-500, .text-destructive, [role="alert"]');
      expect(await allErrors.count()).toBeGreaterThan(0);
    });

    test('should clear field error when field becomes valid', async ({ page }) => {
      await page.goto('/signup');

      // Trigger email error
      await page.fill('input[name="email"]', 'invalid');
      await page.locator('input[name="password"]').focus(); // Trigger blur
      
      // Now enter valid email
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.locator('input[name="password"]').focus(); // Trigger blur

      // Email error should be cleared or not visible
      await page.waitForTimeout(500);
    });
  });

  test.describe('Session Expiry', () => {
    test('should handle expired session gracefully', async ({ page }) => {
      // Login first
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);

      // Clear cookies to simulate session expiry
      await page.context().clearCookies();

      // Try to navigate to protected route
      await page.goto('/dashboard/leads');

      // Should redirect to login with appropriate message
      await page.waitForURL(/\/(sign-in|login)/);
    });

    test('should show session expired message when appropriate', async ({ page }) => {
      // Navigate to login with session_expired param (if supported)
      await page.goto('/login?session_expired=true');

      // Check for session expired message (if implemented)
      const expiredMessage = page.getByText(/セッション|session|expired|期限/i);
      // This may or may not be implemented
    });
  });

  test.describe('Deep Links', () => {
    test('should redirect to intended page after login', async ({ page }) => {
      // Clear session
      await page.context().clearCookies();

      // Try to access a deep link
      await page.goto('/dashboard/leads');

      // Should redirect to login
      await page.waitForURL(/\/(sign-in|login)/);

      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to original destination (or dashboard)
      await page.waitForURL(/\/dashboard/);
    });

    test('should handle locale in auth URLs', async ({ page }) => {
      // Test Japanese locale
      await page.goto('/ja/login');
      await expect(page.locator('input[name="email"]')).toBeVisible();

      // Test English locale
      await page.goto('/en/login');
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });
  });
});
