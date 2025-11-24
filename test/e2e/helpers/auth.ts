import { Page } from '@playwright/test';

/**
 * E2E test authentication helper
 *
 * Note: In a real-world scenario, you would:
 * 1. Use a dedicated test database
 * 2. Seed test users and organizations
 * 3. Use Playwright's storageState to persist authentication
 *
 * For now, this is a placeholder that demonstrates the flow.
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
}

export const TEST_USERS = {
  owner: {
    email: 'test-owner@example.com',
    password: 'TestPassword123!',
    name: 'Test Owner',
    organizationId: 'test-org-1',
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'TestPassword123!',
    name: 'Test Admin',
    organizationId: 'test-org-1',
  },
  member: {
    email: 'test-member@example.com',
    password: 'TestPassword123!',
    name: 'Test Member',
    organizationId: 'test-org-1',
  },
} as const;

/**
 * Navigate to login page and authenticate
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/sign-in');

  // Fill in login form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for navigation to sign-in page
  await page.waitForURL('/sign-in');
}

/**
 * Navigate to a specific organization's dashboard
 */
export async function switchOrganization(
  page: Page,
  organizationSlug: string
): Promise<void> {
  // Click organization switcher
  await page.click('[data-testid="organization-switcher"]');

  // Select organization
  await page.click(`[data-testid="org-${organizationSlug}"]`);

  // Wait for navigation
  await page.waitForURL(`/dashboard/${organizationSlug}`);
}

/**
 * Setup authenticated test context
 * This should be called in beforeEach hooks
 */
export async function setupAuthenticatedTest(
  page: Page,
  user: TestUser = TEST_USERS.owner
): Promise<void> {
  await login(page, user);

  // Navigate to the organization dashboard if specified
  if (user.organizationId) {
    await page.goto(`/dashboard/${user.organizationId}`);
    await page.waitForLoadState('networkidle');
  }
}
