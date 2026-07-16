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
          - /url: /de/contact
        - link "Account" [ref=e17]:
          - /url: /en/account
          - img [ref=e18]
        - link "Cart, 0" [ref=e21]:
          - /url: /en/cart
          - img [ref=e22]
  - main [ref=e25]:
    - generic [ref=e26]:
      - generic [ref=e27]:
        - paragraph [ref=e28]: We're here for you
        - heading "Contact us" [level=1] [ref=e29]
        - paragraph [ref=e30]: Whether it's a question about your order, our products or a trade enquiry – we're happy to help, in German or English.
      - generic [ref=e32]:
        - generic [ref=e33]:
          - heading "Phone" [level=3] [ref=e34]:
            - img [ref=e35]
            - text: Phone
          - link "+49 176 21809185" [ref=e37]:
            - /url: tel:+4917621809185
        - generic [ref=e38]:
          - heading "WhatsApp" [level=3] [ref=e39]:
            - img [ref=e40]
            - text: WhatsApp
          - link "Open a WhatsApp chat with Khan Dry Fruit in a new tab" [ref=e42]:
            - /url: https://wa.me/4917621809185?text=Hello%20Khan%20Dry%20Fruit%2C%20I%20have%20a%20question.
            - text: Start WhatsApp chat
        - generic [ref=e43]:
          - heading "Email" [level=3] [ref=e44]:
            - img [ref=e45]
            - text: Email
          - paragraph [ref=e48]: The customer email address will be published here once confirmed.
        - generic [ref=e49]:
          - heading "Business address" [level=3] [ref=e50]:
            - img [ref=e51]
            - text: Business address
          - paragraph [ref=e54]: The business address will be published here once confirmed.
        - generic [ref=e55]:
          - heading "Opening hours" [level=3] [ref=e56]:
            - img [ref=e57]
            - text: Opening hours
          - paragraph [ref=e60]: Opening hours will be published here once confirmed.
        - generic [ref=e61]:
          - heading "Social media" [level=3] [ref=e62]:
            - img [ref=e63]
            - text: Social media
          - paragraph [ref=e66]: "@khandryfruit"
      - generic [ref=e67]:
        - heading "What is your enquiry about?" [level=2] [ref=e69]
        - generic [ref=e70]:
          - generic [ref=e71]:
            - heading "Order support" [level=3] [ref=e72]
            - paragraph [ref=e73]: Questions about an existing order, delivery or returns – have your order number ready.
          - generic [ref=e74]:
            - heading "Wholesale" [level=3] [ref=e75]
            - paragraph [ref=e76]: Trade enquiries and applications for a wholesale account.
            - link "Go to wholesale →" [ref=e77] [cursor=pointer]:
              - /url: /en/wholesale
          - generic [ref=e78]:
            - heading "General enquiry" [level=3] [ref=e79]
            - paragraph [ref=e80]: Everything else – product questions, gift boxes, feedback.
      - generic [ref=e81]:
        - heading "Send us a message" [level=2] [ref=e82]
        - paragraph [ref=e83]: We usually reply within 1–2 working days.
        - paragraph [ref=e84]: Fields marked * are required.
        - generic [ref=e86]:
          - generic [ref=e87]:
            - generic [ref=e88]: Name *
            - textbox "Name *" [ref=e89]
          - generic [ref=e90]:
            - generic [ref=e91]: Email address *
            - textbox "Email address *" [ref=e92]
          - generic [ref=e93]:
            - generic [ref=e94]: Phone number
            - textbox "Phone number" [ref=e95]
          - generic [ref=e96]:
            - generic [ref=e97]: Preferred contact method *
            - combobox "Preferred contact method *" [ref=e98]:
              - option "Email" [selected]
              - option "Phone"
              - option "WhatsApp"
          - generic [ref=e99]:
            - generic [ref=e100]: Enquiry type *
            - combobox "Enquiry type *" [ref=e101]:
              - option "General question" [selected]
              - option "Existing order"
              - option "Product information"
              - option "Delivery question"
              - option "Wholesale"
              - option "Gift boxes"
              - option "Returns"
              - option "Other"
          - generic [ref=e102]:
            - generic [ref=e103]: Subject *
            - textbox "Subject *" [ref=e104]
          - generic [ref=e105]:
            - generic [ref=e106]: Message *
            - textbox "Message *" [ref=e107]
          - generic [ref=e109]:
            - text: Website
            - textbox [ref=e110]
          - generic [ref=e111]:
            - checkbox "I have read the privacy policy and agree that my details are processed to answer my enquiry." [ref=e112]
            - generic [ref=e113]: I have read the privacy policy and agree that my details are processed to answer my enquiry.
          - button "Send message" [ref=e114] [cursor=pointer]
  - contentinfo [ref=e115]:
    - generic [ref=e116]:
      - generic [ref=e117]:
        - generic [ref=e118]:
          - generic [ref=e119]: K
          - strong [ref=e121]: Khan
        - paragraph [ref=e122]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e123]: "@khandryfruit"
      - generic [ref=e124]:
        - heading "Explore" [level=2] [ref=e125]
        - link "All products" [ref=e126]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e127]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e128]:
          - /url: /en/wholesale
        - link "Our story" [ref=e129]:
          - /url: /en/our-story
      - generic [ref=e130]:
        - heading "Help" [level=2] [ref=e131]
        - link "FAQ" [ref=e132]:
          - /url: /en/faq
        - link "Shipping" [ref=e133]:
          - /url: /en/shipping
        - link "Returns" [ref=e134]:
          - /url: /en/returns
        - link "Contact" [ref=e135]:
          - /url: /en/contact
      - generic [ref=e136]:
        - heading "Legal" [level=2] [ref=e137]
        - link "Impressum" [ref=e138]:
          - /url: /en/impressum
        - link "Privacy" [ref=e139]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e140]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e141]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e142]:
          - /url: /en/cookie-settings
    - generic [ref=e143]:
      - generic [ref=e144]: © 2026 Khan Dry Fruit
      - generic [ref=e145]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e146]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e147]
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