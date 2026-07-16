# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gift-boxes.spec.ts >> enforces the minimum selection before a box can be added
- Location: e2e/gift-boxes.spec.ts:40:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('button', { name: /Medium gift box/i })
Expected: "true"
Received: "false"
Timeout:  1000ms

Call log:
  - Expect "toHaveAttribute" with timeout 1000ms
  - waiting for getByRole('button', { name: /Medium gift box/i })
    11 × locator resolved to <button type="button" class="option-card" aria-pressed="false">…</button>
       - unexpected value "false"


Call Log:
- Test timeout of 30000ms exceeded
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2]:
    - /url: "#main"
  - generic [ref=e3]: Secure payment · Packed with care · WhatsApp support
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Khan Dry Fruit home" [ref=e6]:
        - /url: /en
        - generic [ref=e7]: K
        - strong [ref=e9]: Khan
      - generic [ref=e10]:
        - button "Open search" [ref=e12]:
          - img [ref=e13]
        - link "DE" [ref=e16]:
          - /url: /de/gift-boxes/build-your-own
        - link "Account" [ref=e17]:
          - /url: /en/account
          - img [ref=e18]
        - link "Cart, 0" [ref=e21]:
          - /url: /en/cart
          - img [ref=e22]
  - main [ref=e25]:
    - generic [ref=e26]:
      - generic [ref=e27]:
        - paragraph [ref=e28]: Build your own
        - heading "Your box, your selection" [level=1] [ref=e29]
        - paragraph [ref=e30]: "In a few steps to a personal gift: choose a size, fill the box with Afghan dry fruits, pick the packaging and add your message."
      - generic [ref=e31]:
        - generic [ref=e32]:
          - region "1. Choose your box size" [ref=e33]:
            - heading "1. Choose your box size" [level=2] [ref=e34]
            - paragraph [ref=e35]: Each size includes a box charge and holds a set number of items.
            - generic [ref=e36]:
              - 'button "Small gift box 3 item slots Box charge: €3.99" [ref=e37] [cursor=pointer]':
                - strong [ref=e38]: Small gift box
                - generic [ref=e39]: 3 item slots
                - generic [ref=e40]: "Box charge: €3.99"
              - 'button "Medium gift box 5 item slots Box charge: €5.99" [ref=e41] [cursor=pointer]':
                - strong [ref=e42]: Medium gift box
                - generic [ref=e43]: 5 item slots
                - generic [ref=e44]: "Box charge: €5.99"
              - 'button "Large gift box 8 item slots Box charge: €7.99" [ref=e45] [cursor=pointer]':
                - strong [ref=e46]: Large gift box
                - generic [ref=e47]: 8 item slots
                - generic [ref=e48]: "Box charge: €7.99"
          - region "2. Fill your box" [ref=e49]:
            - heading "2. Fill your box" [level=2] [ref=e50]
            - paragraph [ref=e51]: Choose from our dry fruits and set the quantity per product. Each pack uses one slot.
          - region "3. Choose packaging" [ref=e52]:
            - heading "3. Choose packaging" [level=2] [ref=e53]
            - paragraph [ref=e54]: How would you like your box wrapped?
            - generic [ref=e55]:
              - button "Classic box Sturdy gift box with tissue paper. Included" [pressed] [ref=e56] [cursor=pointer]:
                - strong [ref=e57]: Classic box
                - generic [ref=e58]: Sturdy gift box with tissue paper.
                - generic [ref=e59]: Included
              - button "Premium wrap Ribbon, card and festive wrapping. €4.90" [ref=e60] [cursor=pointer]:
                - strong [ref=e61]: Premium wrap
                - generic [ref=e62]: Ribbon, card and festive wrapping.
                - generic [ref=e63]: €4.90
          - region "4. Add a gift message" [ref=e64]:
            - heading "4. Add a gift message" [level=2] [ref=e65]
            - paragraph [ref=e66]: We print your message on a card and place it inside the box – no prices are visible on gift boxes.
            - generic [ref=e67]:
              - generic [ref=e68]:
                - generic [ref=e69]: Occasion
                - combobox "Occasion" [ref=e70]:
                  - option "No specific occasion" [selected]
                  - option "Ramadan"
                  - option "Eid"
                  - option "Christmas"
                  - option "Nowruz"
                  - option "Wedding"
                  - option "Corporate gifting"
                  - option "Thank you"
                  - option "General gift"
              - generic [ref=e71]:
                - generic [ref=e72]: Gift message
                - textbox "Gift message The message is optional." [ref=e73]:
                  - /placeholder: e.g. Eid Mubarak! With warm wishes from the whole team.
                - generic [ref=e74]: The message is optional.
            - generic [ref=e75]: 240 characters left
        - complementary "5. Review and add to cart" [ref=e76]:
          - heading "5. Review and add to cart" [level=2] [ref=e77]
          - paragraph [ref=e78]: Prices are calculated and verified on our server when you add the box to your cart.
          - paragraph [ref=e79]: No products selected yet.
          - generic [ref=e80]:
            - generic [ref=e81]:
              - term [ref=e82]: Selected products
              - definition [ref=e83]: €0.00
            - generic [ref=e84]:
              - term [ref=e85]: Box charge
              - definition [ref=e86]: €0.00
            - generic [ref=e87]:
              - term [ref=e88]: Packaging
              - definition [ref=e89]: €0.00
            - generic [ref=e90]:
              - term [ref=e91]: Box total
              - definition [ref=e92]: €0.00
          - status [ref=e93]: Please choose a box size first.
          - button "Add gift box to cart" [disabled] [ref=e94]
  - contentinfo [ref=e95]:
    - generic [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]: K
          - strong [ref=e101]: Khan
        - paragraph [ref=e102]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e103]: "@khandryfruit"
      - generic [ref=e104]:
        - heading "Explore" [level=2] [ref=e105]
        - link "All products" [ref=e106]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e107]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e108]:
          - /url: /en/wholesale
        - link "Our story" [ref=e109]:
          - /url: /en/our-story
      - generic [ref=e110]:
        - heading "Help" [level=2] [ref=e111]
        - link "FAQ" [ref=e112]:
          - /url: /en/faq
        - link "Shipping" [ref=e113]:
          - /url: /en/shipping
        - link "Returns" [ref=e114]:
          - /url: /en/returns
        - link "Contact" [ref=e115]:
          - /url: /en/contact
      - generic [ref=e116]:
        - heading "Legal" [level=2] [ref=e117]
        - link "Impressum" [ref=e118]:
          - /url: /en/impressum
        - link "Privacy" [ref=e119]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e120]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e121]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e122]:
          - /url: /en/cookie-settings
    - generic [ref=e123]:
      - generic [ref=e124]: © 2026 Khan Dry Fruit
      - generic [ref=e125]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e126]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e127]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("browses the fixed gift-box catalogue and detail page", async ({ page }) => {
  4  |   await page.goto("/en/gift-boxes");
  5  |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  6  |     "Gift boxes",
  7  |   );
  8  |   await page.getByRole("link", { name: /View box/i }).first().click();
  9  |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  10 |     /Classic Selection/i,
  11 |   );
  12 |   await expect(page.getByText(/Black Raisins/i).first()).toBeVisible();
  13 | });
  14 | 
  15 | test("serves the German gift-box routes", async ({ page }) => {
  16 |   await page.goto("/de/geschenkboxen");
  17 |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  18 |     "Geschenkboxen",
  19 |   );
  20 |   await page.goto("/de/geschenkboxen/selbst-zusammenstellen");
  21 |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  22 |     "Ihre Box",
  23 |   );
  24 | });
  25 | 
  26 | async function chooseSize(
  27 |   page: import("@playwright/test").Page,
  28 |   name: RegExp,
  29 | ) {
  30 |   const button = page.getByRole("button", { name });
  31 |   // Retry the first interaction until hydration has attached the handler.
  32 |   await expect(async () => {
  33 |     await button.click();
  34 |     await expect(button).toHaveAttribute("aria-pressed", "true", {
  35 |       timeout: 1_000,
  36 |     });
> 37 |   }).toPass({ timeout: 30_000 });
     |      ^ Error: expect(locator).toHaveAttribute(expected) failed
  38 | }
  39 | 
  40 | test("enforces the minimum selection before a box can be added", async ({
  41 |   page,
  42 | }) => {
  43 |   await page.goto("/en/gift-boxes/build-your-own");
  44 |   await chooseSize(page, /Medium gift box/i);
  45 |   await expect(page.getByText(/at least 3 items/i).first()).toBeVisible();
  46 |   await expect(
  47 |     page.getByRole("button", { name: "Add gift box to cart" }),
  48 |   ).toBeDisabled();
  49 | });
  50 | 
  51 | test("builds a custom gift box and adds it to the cart", async ({ page }) => {
  52 |   await page.goto("/en/gift-boxes/build-your-own");
  53 |   await chooseSize(page, /Medium gift box/i);
  54 |   const plus = page.getByRole("button", { name: "Black Raisins +" }).first();
  55 |   await plus.click();
  56 |   await plus.click();
  57 |   await plus.click();
  58 |   await expect(page.getByText(/3 of 5 slots used/i)).toBeVisible();
  59 |   await page.getByRole("button", { name: /Premium wrap/i }).click();
  60 |   await page.getByLabel(/Gift message/).fill("Happy Eid from the E2E suite!");
  61 |   await page.getByRole("button", { name: "Add gift box to cart" }).click();
  62 |   await expect(
  63 |     page.getByRole("heading", { name: /Your gift box is in the cart/i }),
  64 |   ).toBeVisible({ timeout: 15_000 });
  65 | 
  66 |   await page.getByRole("link", { name: "Go to cart" }).click();
  67 |   await expect(page).toHaveURL(/\/en\/cart/);
  68 |   await expect(page.getByText(/Gift box ·/i)).toBeVisible();
  69 |   await expect(page.getByText(/Black Raisins/i).first()).toBeVisible();
  70 |   await expect(page.getByText(/Happy Eid from the E2E suite!/)).toBeVisible();
  71 |   await expect(page.getByRole("link", { name: "Edit box" })).toBeVisible();
  72 | });
  73 | 
```