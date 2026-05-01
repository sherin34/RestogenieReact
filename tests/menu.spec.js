import { test, expect } from '@playwright/test';

test('QR Menu loads correctly for Tenant 1', async ({ page }) => {
  // 1. Navigate to the QR menu page for tenant 1
  await page.goto('/qr/1');

  // 2. Wait for the loading spinner/skeleton to disappear and categories to show up
  // Adjust the selector if your categories have a different class/id
  const categoryList = page.locator('div, section').filter({ hasText: /Categories/i });
  await expect(categoryList).toBeVisible({ timeout: 10000 });

  // 3. Verify that at least one menu item is visible
  // Search for common elements like "Biryani" or price symbols if needed
  const menuItems = page.locator('div').filter({ hasText: /₹|Rs\.|Price/i });
  const count = await menuItems.count();
  
  console.log(`Found ${count} potential menu items`);
  expect(count).toBeGreaterThan(0);

  // 4. Take a screenshot for verification
  await page.screenshot({ path: 'tests/screenshots/menu-load.png' });
});
