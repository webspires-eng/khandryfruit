# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contact.spec.ts >> shows localized validation errors for an incomplete enquiry
- Location: e2e/contact.spec.ts:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.form-error')
Expected: visible
Timeout: 2000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2000ms
  - waiting for locator('.form-error')


Call Log:
- Test timeout of 30000ms exceeded
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - /url: /de/contact
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
        - paragraph [ref=e45]: We're here for you
        - heading "Contact us" [level=1] [ref=e46]
        - paragraph [ref=e47]: Whether it's a question about your order, our products or a trade enquiry – we're happy to help, in German or English.
      - generic [ref=e49]:
        - generic [ref=e50]:
          - heading "Phone" [level=3] [ref=e51]:
            - img [ref=e52]
            - text: Phone
          - link "+49 176 21809185" [ref=e54] [cursor=pointer]:
            - /url: tel:+4917621809185
        - generic [ref=e55]:
          - heading "WhatsApp" [level=3] [ref=e56]:
            - img [ref=e57]
            - text: WhatsApp
          - link "Open a WhatsApp chat with Khan Dry Fruit in a new tab" [ref=e59] [cursor=pointer]:
            - /url: https://wa.me/4917621809185?text=Hello%20Khan%20Dry%20Fruit%2C%20I%20have%20a%20question.
            - text: Start WhatsApp chat
        - generic [ref=e60]:
          - heading "Email" [level=3] [ref=e61]:
            - img [ref=e62]
            - text: Email
          - paragraph [ref=e65]: The customer email address will be published here once confirmed.
        - generic [ref=e66]:
          - heading "Business address" [level=3] [ref=e67]:
            - img [ref=e68]
            - text: Business address
          - paragraph [ref=e71]: The business address will be published here once confirmed.
        - generic [ref=e72]:
          - heading "Opening hours" [level=3] [ref=e73]:
            - img [ref=e74]
            - text: Opening hours
          - paragraph [ref=e77]: Opening hours will be published here once confirmed.
        - generic [ref=e78]:
          - heading "Social media" [level=3] [ref=e79]:
            - img [ref=e80]
            - text: Social media
          - paragraph [ref=e83]: "@khandryfruit"
      - generic [ref=e84]:
        - heading "What is your enquiry about?" [level=2] [ref=e86]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - heading "Order support" [level=3] [ref=e89]
            - paragraph [ref=e90]: Questions about an existing order, delivery or returns – have your order number ready.
          - generic [ref=e91]:
            - heading "Wholesale" [level=3] [ref=e92]
            - paragraph [ref=e93]: Trade enquiries and applications for a wholesale account.
            - link "Go to wholesale →" [ref=e94] [cursor=pointer]:
              - /url: /en/wholesale
          - generic [ref=e95]:
            - heading "General enquiry" [level=3] [ref=e96]
            - paragraph [ref=e97]: Everything else – product questions, gift boxes, feedback.
      - generic [ref=e98]:
        - heading "Send us a message" [level=2] [ref=e99]
        - paragraph [ref=e100]: We usually reply within 1–2 working days.
        - paragraph [ref=e101]: Fields marked * are required.
        - generic [ref=e103]:
          - generic [ref=e104]:
            - generic [ref=e105]: Name *
            - textbox "Name *" [ref=e106]
          - generic [ref=e107]:
            - generic [ref=e108]: Email address *
            - textbox "Email address *" [ref=e109]
          - generic [ref=e110]:
            - generic [ref=e111]: Phone number
            - textbox "Phone number" [ref=e112]
          - generic [ref=e113]:
            - generic [ref=e114]: Preferred contact method *
            - combobox "Preferred contact method *" [ref=e115]:
              - option "Email" [selected]
              - option "Phone"
              - option "WhatsApp"
          - generic [ref=e116]:
            - generic [ref=e117]: Enquiry type *
            - combobox "Enquiry type *" [ref=e118]:
              - option "General question" [selected]
              - option "Existing order"
              - option "Product information"
              - option "Delivery question"
              - option "Wholesale"
              - option "Gift boxes"
              - option "Returns"
              - option "Other"
          - generic [ref=e119]:
            - generic [ref=e120]: Subject *
            - textbox "Subject *" [ref=e121]
          - generic [ref=e122]:
            - generic [ref=e123]: Message *
            - textbox "Message *" [ref=e124]
          - generic [ref=e126]:
            - text: Website
            - textbox [ref=e127]
          - generic [ref=e128]:
            - checkbox "I have read the privacy policy and agree that my details are processed to answer my enquiry." [ref=e129]
            - generic [ref=e130]: I have read the privacy policy and agree that my details are processed to answer my enquiry.
          - button "Send message" [ref=e131] [cursor=pointer]
  - contentinfo [ref=e132]:
    - generic [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]: K
          - generic [ref=e137]:
            - strong [ref=e138]: Khan
            - generic [ref=e139]: Dry Fruit
        - paragraph [ref=e140]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e141]: "@khandryfruit"
      - generic [ref=e142]:
        - heading "Explore" [level=2] [ref=e143]
        - link "All products" [ref=e144] [cursor=pointer]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e145] [cursor=pointer]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e146] [cursor=pointer]:
          - /url: /en/wholesale
        - link "Our story" [ref=e147] [cursor=pointer]:
          - /url: /en/our-story
      - generic [ref=e148]:
        - heading "Help" [level=2] [ref=e149]
        - link "FAQ" [ref=e150] [cursor=pointer]:
          - /url: /en/faq
        - link "Shipping" [ref=e151] [cursor=pointer]:
          - /url: /en/shipping
        - link "Returns" [ref=e152] [cursor=pointer]:
          - /url: /en/returns
        - link "Contact" [ref=e153] [cursor=pointer]:
          - /url: /en/contact
      - generic [ref=e154]:
        - heading "Legal" [level=2] [ref=e155]
        - link "Impressum" [ref=e156] [cursor=pointer]:
          - /url: /en/impressum
        - link "Privacy" [ref=e157] [cursor=pointer]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e158] [cursor=pointer]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e159] [cursor=pointer]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e160] [cursor=pointer]:
          - /url: /en/cookie-settings
    - generic [ref=e161]:
      - generic [ref=e162]: © 2026 Khan Dry Fruit
      - generic [ref=e163]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e164] [cursor=pointer]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e165]
    - generic [ref=e167]: WhatsApp
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const dbAvailable = Boolean(process.env.E2E_DATABASE_AVAILABLE);
  4  | 
  5  | test("shows contact channels with a safe WhatsApp link", async ({ page }) => {
  6  |   await page.goto("/de/kontakt");
  7  |   await expect(page.getByRole("heading", { level: 1 })).toContainText("Kontakt");
  8  |   const whatsapp = page.getByRole("link", { name: /WhatsApp-Chat/i });
  9  |   await expect(whatsapp).toHaveAttribute("href", /wa\.me\/4917621809185/);
  10 |   await expect(whatsapp).toHaveAttribute("target", "_blank");
  11 |   await expect(whatsapp).toHaveAttribute("rel", /noopener/);
  12 | });
  13 | 
  14 | test("shows localized validation errors for an incomplete enquiry", async ({
  15 |   page,
  16 | }) => {
  17 |   await page.goto("/en/contact");
  18 |   await page.getByLabel(/Name/, { exact: false }).first().fill("E2E Tester");
  19 |   const submit = page.getByRole("button", { name: "Send message" });
  20 |   // Retry the first interaction until hydration has attached the handler.
  21 |   await expect(async () => {
  22 |     await submit.click();
  23 |     await expect(page.locator(".form-error")).toBeVisible({ timeout: 2_000 });
> 24 |   }).toPass({ timeout: 30_000 });
     |      ^ Error: expect(locator).toBeVisible() failed
  25 |   await expect(page.locator(".field-error").first()).toBeVisible();
  26 | });
  27 | 
  28 | test("submits a contact enquiry and shows the confirmation", async ({ page }) => {
  29 |   test.skip(!dbAvailable, "requires a database (set E2E_DATABASE_AVAILABLE=1)");
  30 |   await page.goto("/en/contact");
  31 |   await page.getByLabel(/^Name/).fill("E2E Tester");
  32 |   await page.getByLabel(/Email address/).fill("e2e-contact@example.com");
  33 |   await page.getByLabel(/Preferred contact method/).selectOption("EMAIL");
  34 |   await page.getByLabel(/Enquiry type/).selectOption("GENERAL");
  35 |   await page.getByLabel(/Subject/).fill("Question about raisins");
  36 |   await page
  37 |     .getByLabel(/Message/)
  38 |     .fill("Hello, do you offer bulk discounts on raisins for private buyers?");
  39 |   await page.getByLabel(/I have read the privacy policy/).check();
  40 |   await page.getByRole("button", { name: "Send message" }).click();
  41 |   await expect(
  42 |     page.getByRole("heading", { name: /Thank you for your message/i }),
  43 |   ).toBeVisible({ timeout: 15_000 });
  44 | });
  45 | 
```