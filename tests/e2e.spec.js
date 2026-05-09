import { test, expect } from '@playwright/test';

const BASE_URL = 'https://restogenie.sheraktech.com';
const QR_URL = 'https://restogenie.sheraktech.com/qr/51018ef9-bf34-4e7f-8312-0757349e1be9/21bc1bc5-02d6-4ab6-9cb5-cff284f1a135';

test.describe('RestoGenie End-to-End Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport for testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Admin Authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'test');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    
    // Expect to land on the dashboard or admin page
    await expect(page).toHaveURL(/.*dashboard|admin/);
    await expect(page.locator('text=Admin Panel')).toBeVisible();
  });

  test('POS Full Ordering Flow', async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'test');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');

    // 2. Navigate to POS
    await page.goto(`${BASE_URL}/pos`);
    
    // 3. Select a Table
    await page.locator('.pos-tables-row .card').first().click();
    
    // 4. Add a Menu Item
    await page.locator('button:has-text("Add")').first().click();
    
    // 5. Place Order
    await page.locator('button:has-text("Place Order")').first().click();
    
    // 6. Confirm Order in Modal
    await page.locator('button:has-text("Confirm Order")').click();
    
    // 7. Verify Success
    await expect(page.locator('text=Order placed successfully')).toBeVisible({ timeout: 10000 });
  });

  test('QR Customer Ordering Flow', async ({ page }) => {
    // 1. Navigate to the specific QR URL for a table
    await page.goto(QR_URL);
    
    // 2. Verify we are on the customer menu page
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 10000 });
    
    // 3. Add an item to the cart
    await page.locator('button:has-text("+")').first().click();
    
    // 4. Click 'Order' in the cart panel
    await page.locator('button:has-text("Order")').last().click();
    
    // 5. Confirm the order in the modal if it exists
    const confirmBtn = page.locator('button:has-text("Confirm")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    // 6. Verify order submission
    await expect(page.locator('text=Order placed successfully')).toBeVisible({ timeout: 10000 });
  });

  test('Kitchen Order Processing', async ({ page }) => {
    // 1. Login as Admin/Kitchen
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'test');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');

    // 2. Navigate to Kitchen Display
    await page.goto(`${BASE_URL}/kitchen`);
    
    // 3. Wait for heading
    await expect(page.locator('h2')).toContainText('Kitchen', { timeout: 10000 });
    
    // 4. Mark first item as READY
    const readyBtn = page.locator('button:has-text("Ready")').first();
    if (await readyBtn.isVisible()) {
      await readyBtn.click();
    }
  });

  test('Billing and Finalization', async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'test');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');

    // 2. Navigate to Billing
    await page.goto(`${BASE_URL}/billing`);
    
    // 3. Wait for heading
    await expect(page.locator('h1')).toContainText('Billing', { timeout: 10000 });
    
    // 4. Process first order
    const generateBtn = page.locator('button:has-text("Bill")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.locator('button:has-text("Complete")').click();
      await expect(page.locator('text=successfully')).toBeVisible({ timeout: 10000 });
    }
  });

});
