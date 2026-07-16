# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gift-boxes.spec.ts >> builds a custom gift box and adds it to the cart
- Location: e2e/gift-boxes.spec.ts:51:5

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
- generic [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e3]: Secure payment · Packed with care · WhatsApp support
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Khan Dry Fruit home" [ref=e6] [cursor=pointer]:
        - /url: /en
        - generic [ref=e7]: K
        - generic [ref=e8]:
          - strong [ref=e9]: Khan
          - generic [ref=e10]: Dry Fruit
      - navigation "Main navigation" [ref=e11]:
        - link "Shop" [ref=e12] [cursor=pointer]:
          - /url: /en/shop
        - link "Bestsellers" [ref=e13] [cursor=pointer]:
          - /url: /en/bestsellers
        - link "Gift Boxes" [ref=e14] [cursor=pointer]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e15] [cursor=pointer]:
          - /url: /en/wholesale
        - link "Our Story" [ref=e16] [cursor=pointer]:
          - /url: /en/our-story
        - link "Recipes" [ref=e17] [cursor=pointer]:
          - /url: /en/recipes
        - link "Contact" [ref=e18] [cursor=pointer]:
          - /url: /en/contact
      - generic [ref=e19]:
        - button "Open search" [ref=e21]:
          - img [ref=e22]
        - link "DE" [ref=e25] [cursor=pointer]:
          - /url: /de/gift-boxes/build-your-own
          - img [ref=e26]
          - text: DE
        - link "Account" [ref=e31] [cursor=pointer]:
          - /url: /en/account
          - img [ref=e32]
        - link "Wishlist" [ref=e35] [cursor=pointer]:
          - /url: /en/wishlist
          - img [ref=e36]
        - link "Cart, 0" [ref=e38] [cursor=pointer]:
          - /url: /en/cart
          - img [ref=e39]
  - main [ref=e42]:
    - generic [ref=e43]:
      - generic [ref=e44]:
        - paragraph [ref=e45]: Build your own
        - heading "Your box, your selection" [level=1] [ref=e46]
        - paragraph [ref=e47]: "In a few steps to a personal gift: choose a size, fill the box with Afghan dry fruits, pick the packaging and add your message."
      - generic [ref=e48]:
        - generic [ref=e49]:
          - region "1. Choose your box size" [ref=e50]:
            - heading "1. Choose your box size" [level=2] [ref=e51]
            - paragraph [ref=e52]: Each size includes a box charge and holds a set number of items.
            - generic [ref=e53]:
              - 'button "Small gift box 3 item slots Box charge: €3.99" [ref=e54] [cursor=pointer]':
                - strong [ref=e55]: Small gift box
                - generic [ref=e56]: 3 item slots
                - generic [ref=e57]: "Box charge: €3.99"
              - 'button "Medium gift box 5 item slots Box charge: €5.99" [active] [ref=e58] [cursor=pointer]':
                - strong [ref=e59]: Medium gift box
                - generic [ref=e60]: 5 item slots
                - generic [ref=e61]: "Box charge: €5.99"
              - 'button "Large gift box 8 item slots Box charge: €7.99" [ref=e62] [cursor=pointer]':
                - strong [ref=e63]: Large gift box
                - generic [ref=e64]: 8 item slots
                - generic [ref=e65]: "Box charge: €7.99"
          - region "2. Fill your box" [ref=e66]:
            - heading "2. Fill your box" [level=2] [ref=e67]
            - paragraph [ref=e68]: Choose from our dry fruits and set the quantity per product. Each pack uses one slot.
          - region "3. Choose packaging" [ref=e69]:
            - heading "3. Choose packaging" [level=2] [ref=e70]
            - paragraph [ref=e71]: How would you like your box wrapped?
            - generic [ref=e72]:
              - button "Classic box Sturdy gift box with tissue paper. Included" [pressed] [ref=e73] [cursor=pointer]:
                - strong [ref=e74]: Classic box
                - generic [ref=e75]: Sturdy gift box with tissue paper.
                - generic [ref=e76]: Included
              - button "Premium wrap Ribbon, card and festive wrapping. €4.90" [ref=e77] [cursor=pointer]:
                - strong [ref=e78]: Premium wrap
                - generic [ref=e79]: Ribbon, card and festive wrapping.
                - generic [ref=e80]: €4.90
          - region "4. Add a gift message" [ref=e81]:
            - heading "4. Add a gift message" [level=2] [ref=e82]
            - paragraph [ref=e83]: We print your message on a card and place it inside the box – no prices are visible on gift boxes.
            - generic [ref=e84]:
              - generic [ref=e85]:
                - generic [ref=e86]: Occasion
                - combobox "Occasion" [ref=e87]:
                  - option "No specific occasion" [selected]
                  - option "Ramadan"
                  - option "Eid"
                  - option "Christmas"
                  - option "Nowruz"
                  - option "Wedding"
                  - option "Corporate gifting"
                  - option "Thank you"
                  - option "General gift"
              - generic [ref=e88]:
                - generic [ref=e89]: Gift message
                - textbox "Gift message The message is optional." [ref=e90]:
                  - /placeholder: e.g. Eid Mubarak! With warm wishes from the whole team.
                - generic [ref=e91]: The message is optional.
            - generic [ref=e92]: 240 characters left
        - complementary "5. Review and add to cart" [ref=e93]:
          - heading "5. Review and add to cart" [level=2] [ref=e94]
          - paragraph [ref=e95]: Prices are calculated and verified on our server when you add the box to your cart.
          - paragraph [ref=e96]: No products selected yet.
          - generic [ref=e97]:
            - generic [ref=e98]:
              - term [ref=e99]: Selected products
              - definition [ref=e100]: €0.00
            - generic [ref=e101]:
              - term [ref=e102]: Box charge
              - definition [ref=e103]: €0.00
            - generic [ref=e104]:
              - term [ref=e105]: Packaging
              - definition [ref=e106]: €0.00
            - generic [ref=e107]:
              - term [ref=e108]: Box total
              - definition [ref=e109]: €0.00
          - status [ref=e110]: Please choose a box size first.
          - button "Add gift box to cart" [disabled] [ref=e111]
  - contentinfo [ref=e112]:
    - generic [ref=e113]:
      - generic [ref=e114]:
        - generic [ref=e115]:
          - generic [ref=e116]: K
          - generic [ref=e117]:
            - strong [ref=e118]: Khan
            - generic [ref=e119]: Dry Fruit
        - paragraph [ref=e120]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e121]: "@khandryfruit"
      - generic [ref=e122]:
        - heading "Explore" [level=2] [ref=e123]
        - link "All products" [ref=e124] [cursor=pointer]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e125] [cursor=pointer]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e126] [cursor=pointer]:
          - /url: /en/wholesale
        - link "Our story" [ref=e127] [cursor=pointer]:
          - /url: /en/our-story
      - generic [ref=e128]:
        - heading "Help" [level=2] [ref=e129]
        - link "FAQ" [ref=e130] [cursor=pointer]:
          - /url: /en/faq
        - link "Shipping" [ref=e131] [cursor=pointer]:
          - /url: /en/shipping
        - link "Returns" [ref=e132] [cursor=pointer]:
          - /url: /en/returns
        - link "Contact" [ref=e133] [cursor=pointer]:
          - /url: /en/contact
      - generic [ref=e134]:
        - heading "Legal" [level=2] [ref=e135]
        - link "Impressum" [ref=e136] [cursor=pointer]:
          - /url: /en/impressum
        - link "Privacy" [ref=e137] [cursor=pointer]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e138] [cursor=pointer]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e139] [cursor=pointer]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e140] [cursor=pointer]:
          - /url: /en/cookie-settings
    - generic [ref=e141]:
      - generic [ref=e142]: © 2026 Khan Dry Fruit
      - generic [ref=e143]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e144] [cursor=pointer]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e145]
    - generic [ref=e147]: WhatsApp
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