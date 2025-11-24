import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the homepage correctly', async ({ page }) => {
    await page.goto('/');

    // Check for the main heading
    const heading = page.getByRole('heading', { name: /DiagnoLeads v2/i });
    await expect(heading).toBeVisible();

    // Check for the description
    const description = page.getByText(/Next.js 15 Full-Stack Diagnostic Platform/i);
    await expect(description).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/DiagnoLeads v2/i);
  });
});
