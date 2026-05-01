// Playwright test
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://restogenie.sheraktech.com');
  await expect(page).toHaveTitle(/RestoGenie/);
});
