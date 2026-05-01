# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: menu.spec.js >> QR Menu loads correctly for Tenant 1
- Location: tests/menu.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div, section').filter({ hasText: /Categories/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('div, section').filter({ hasText: /Categories/i })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e7]:
      - generic [ref=e8]: 🍽️
      - heading "test" [level=1] [ref=e9]
      - paragraph [ref=e10]: Welcome to our Restaurant
      - generic [ref=e12]:
        - generic [ref=e13]: Table
        - text: "1"
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: 🔍
        - textbox "Search for dishes..." [ref=e17]
      - generic [ref=e18]:
        - button "All Items" [ref=e19] [cursor=pointer]
        - button "Main course" [ref=e20] [cursor=pointer]
        - button "Beverages" [ref=e21] [cursor=pointer]
        - button "Snacks" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "Main course 7 items" [level=2] [ref=e25]:
            - text: Main course
            - generic [ref=e27]: 7 items
          - generic [ref=e28]:
            - generic [ref=e29]:
              - img "Velleppam combo" [ref=e31]
              - generic [ref=e32]:
                - heading "Velleppam combo" [level=3] [ref=e33]
                - paragraph [ref=e34]: Velleppam combo desc
                - generic [ref=e35]:
                  - generic [ref=e36]: ₹150.00
                  - button "Add" [ref=e37] [cursor=pointer]
            - generic [ref=e38]:
              - img "Biriyani" [ref=e40]
              - generic [ref=e41]:
                - heading "Biriyani" [level=3] [ref=e42]
                - paragraph [ref=e43]: Test desc
                - generic [ref=e44]:
                  - generic [ref=e45]: ₹100.00
                  - button "Add" [ref=e46] [cursor=pointer]
            - generic [ref=e47]:
              - img "Kadala curry" [ref=e49]
              - generic [ref=e50]:
                - heading "Kadala curry" [level=3] [ref=e51]
                - paragraph [ref=e52]: Desc for kadala curry
                - generic [ref=e53]:
                  - generic [ref=e54]: ₹50.00
                  - button "Add" [ref=e55] [cursor=pointer]
            - generic [ref=e56]:
              - img "Idiyappam Combo" [ref=e58]
              - generic [ref=e59]:
                - heading "Idiyappam Combo" [level=3] [ref=e60]
                - paragraph [ref=e61]: Desc
                - generic [ref=e62]:
                  - generic [ref=e63]: ₹120.00
                  - button "Add" [ref=e64] [cursor=pointer]
            - generic [ref=e65]:
              - img "Puttu combo" [ref=e67]
              - generic [ref=e68]:
                - heading "Puttu combo" [level=3] [ref=e69]
                - paragraph [ref=e70]: Desc
                - generic [ref=e71]:
                  - generic [ref=e72]: ₹160.00
                  - button "Add" [ref=e73] [cursor=pointer]
            - generic [ref=e74]:
              - img "Pothichoru" [ref=e76]
              - generic [ref=e77]:
                - heading "Pothichoru" [level=3] [ref=e78]
                - paragraph [ref=e79]: Desc
                - generic [ref=e80]:
                  - generic [ref=e81]: ₹200.00
                  - button "Add" [ref=e82] [cursor=pointer]
            - generic [ref=e83]:
              - img "Fish fry" [ref=e85]
              - generic [ref=e86]:
                - heading "Fish fry" [level=3] [ref=e87]
                - paragraph [ref=e88]: Desc
                - generic [ref=e89]:
                  - generic [ref=e90]: ₹70.00
                  - button "Add" [ref=e91] [cursor=pointer]
        - generic [ref=e92]:
          - heading "Beverages 4 items" [level=2] [ref=e93]:
            - text: Beverages
            - generic [ref=e95]: 4 items
          - generic [ref=e96]:
            - generic [ref=e97]:
              - img "Blue ocean" [ref=e99]
              - generic [ref=e100]:
                - heading "Blue ocean" [level=3] [ref=e101]
                - paragraph [ref=e102]: Desc
                - generic [ref=e103]:
                  - generic [ref=e104]: ₹149.00
                  - button "Add" [ref=e105] [cursor=pointer]
            - generic [ref=e106]:
              - img "Mixed fruit mojito" [ref=e108]
              - generic [ref=e109]:
                - heading "Mixed fruit mojito" [level=3] [ref=e110]
                - paragraph [ref=e111]: Desc
                - generic [ref=e112]:
                  - generic [ref=e113]: ₹149.00
                  - button "Add" [ref=e114] [cursor=pointer]
            - generic [ref=e115]:
              - img "Apple Cherry mojito" [ref=e117]
              - generic [ref=e118]:
                - heading "Apple Cherry mojito" [level=3] [ref=e119]
                - paragraph [ref=e120]: Desc
                - generic [ref=e121]:
                  - generic [ref=e122]: ₹149.00
                  - button "Add" [ref=e123] [cursor=pointer]
            - generic [ref=e124]:
              - img "Mint magic Mojito" [ref=e126]
              - generic [ref=e127]:
                - heading "Mint magic Mojito" [level=3] [ref=e128]
                - paragraph [ref=e129]: Desc
                - generic [ref=e130]:
                  - generic [ref=e131]: ₹129.00
                  - button "Add" [ref=e132] [cursor=pointer]
        - generic [ref=e133]:
          - heading "Snacks 4 items" [level=2] [ref=e134]:
            - text: Snacks
            - generic [ref=e136]: 4 items
          - generic [ref=e137]:
            - generic [ref=e138]:
              - img "Snack 1" [ref=e140]
              - generic [ref=e141]:
                - heading "Snack 1" [level=3] [ref=e142]
                - paragraph [ref=e143]: Desc
                - generic [ref=e144]:
                  - generic [ref=e145]: ₹20.00
                  - button "Add" [ref=e146] [cursor=pointer]
            - generic [ref=e147]:
              - img "Snack 2" [ref=e149]
              - generic [ref=e150]:
                - heading "Snack 2" [level=3] [ref=e151]
                - paragraph [ref=e152]: Desc
                - generic [ref=e153]:
                  - generic [ref=e154]: ₹20.00
                  - button "Add" [ref=e155] [cursor=pointer]
            - generic [ref=e156]:
              - img "Snack 3" [ref=e158]
              - generic [ref=e159]:
                - heading "Snack 3" [level=3] [ref=e160]
                - generic [ref=e161]:
                  - generic [ref=e162]: ₹20.00
                  - button "Add" [ref=e163] [cursor=pointer]
            - generic [ref=e164]:
              - img "Kilikkood" [ref=e166]
              - generic [ref=e167]:
                - heading "Kilikkood" [level=3] [ref=e168]
                - generic [ref=e169]:
                  - generic [ref=e170]: ₹25.00
                  - button "Add" [ref=e171] [cursor=pointer]
    - generic [ref=e172]:
      - paragraph [ref=e173]:
        - text: © 2026
        - strong [ref=e174]: test
      - paragraph [ref=e175]: Experience by RestoGenie
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('QR Menu loads correctly for Tenant 1', async ({ page }) => {
  4  |   // 1. Navigate to the QR menu page for tenant 1
  5  |   await page.goto('/qr/1');
  6  | 
  7  |   // 2. Wait for the loading spinner/skeleton to disappear and categories to show up
  8  |   // Adjust the selector if your categories have a different class/id
  9  |   const categoryList = page.locator('div, section').filter({ hasText: /Categories/i });
> 10 |   await expect(categoryList).toBeVisible({ timeout: 10000 });
     |                              ^ Error: expect(locator).toBeVisible() failed
  11 | 
  12 |   // 3. Verify that at least one menu item is visible
  13 |   // Search for common elements like "Biryani" or price symbols if needed
  14 |   const menuItems = page.locator('div').filter({ hasText: /₹|Rs\.|Price/i });
  15 |   const count = await menuItems.count();
  16 |   
  17 |   console.log(`Found ${count} potential menu items`);
  18 |   expect(count).toBeGreaterThan(0);
  19 | 
  20 |   // 4. Take a screenshot for verification
  21 |   await page.screenshot({ path: 'tests/screenshots/menu-load.png' });
  22 | });
  23 | 
```