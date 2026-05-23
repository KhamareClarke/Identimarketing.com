import { expect, test } from '@playwright/test';

test.describe('Public smoke tests', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Identimarketing|Identi/i);
    // Home page should mention the agency in some heading.
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.length).toBeGreaterThan(100);
  });

  test('login page is reachable', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('Auth gating', () => {
  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    const response = await page.goto('/dashboard');
    // Either redirected to /auth/login (302) or rendered the login form.
    const url = page.url();
    expect(url).toMatch(/auth\/login|login|signin/i);
    // Response should not 500.
    if (response) expect(response.status()).toBeLessThan(500);
  });
});
