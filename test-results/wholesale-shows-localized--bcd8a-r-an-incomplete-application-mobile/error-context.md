# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wholesale.spec.ts >> shows localized validation errors for an incomplete application
- Location: e2e/wholesale.spec.ts:33:5

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
          - /url: /de/wholesale
        - link "Account" [ref=e17]:
          - /url: /en/account
          - img [ref=e18]
        - link "Cart, 0" [ref=e21]:
          - /url: /en/cart
          - img [ref=e22]
  - main [ref=e25]:
    - generic [ref=e26]:
      - navigation "Breadcrumbs" [ref=e27]:
        - link "Home" [ref=e28]:
          - /url: /en
        - img [ref=e29]
        - generic [ref=e31]: Wholesale
      - generic [ref=e32]:
        - paragraph [ref=e33]: For trade customers
        - heading "Wholesale Afghan dry fruits, straight from one source" [level=1] [ref=e34]
        - paragraph [ref=e35]: We supply grocery shops, hospitality businesses and corporate buyers with carefully selected Afghan dry fruits – in trade quantities, with consistent quality and a personal point of contact in Duisburg.
      - generic [ref=e36]:
        - heading "Trade purchasing with Khan Dry Fruit" [level=2] [ref=e38]
        - paragraph [ref=e39]: As a specialist importer of Afghan dry fruits, we work directly with our sourcing partners and pack in Germany. Trade customers order from the same curated range as our retail shop – raisins, figs, mulberries, apricots and seasonal specialities – in larger units and at trade conditions.
        - paragraph [ref=e40]: Every wholesale relationship starts with a short application. Once we have reviewed your details, we get in touch personally to discuss assortment, quantities and delivery. Conditions such as price lists and minimum order values are agreed individually and confirmed in writing.
      - generic [ref=e41]:
        - heading "Our trade assortment" [level=2] [ref=e43]
        - paragraph [ref=e44]: "The current range – availability varies by season:"
        - list [ref=e45]:
          - listitem [ref=e46]: Raisins
          - listitem [ref=e47]: Figs
          - listitem [ref=e48]: Mulberries
          - listitem [ref=e49]: Peaches
          - listitem [ref=e50]: Apricots
      - generic [ref=e51]:
        - heading "Who we supply" [level=2] [ref=e53]
        - paragraph [ref=e54]: "Our wholesale programme is designed for businesses of every size:"
        - generic [ref=e55]:
          - heading "Grocery shops and international supermarkets" [level=3] [ref=e57]
          - heading "Retailers and delicatessens" [level=3] [ref=e59]
          - heading "Restaurants and caterers" [level=3] [ref=e61]
          - heading "Cafés and coffee shops" [level=3] [ref=e63]
          - heading "Bakeries and patisseries" [level=3] [ref=e65]
          - heading "Confectioners and chocolatiers" [level=3] [ref=e67]
          - heading "Corporate buyers and employee gifting" [level=3] [ref=e69]
          - heading "Bulk buyers and market traders" [level=3] [ref=e71]
      - generic [ref=e72]:
        - heading "How ordering works" [level=2] [ref=e74]
        - generic [ref=e75]:
          - generic [ref=e76]:
            - heading "1. Apply" [level=3] [ref=e77]
            - paragraph [ref=e78]: Send us the application form with your company details. It takes about five minutes.
          - generic [ref=e79]:
            - heading "2. Review" [level=3] [ref=e80]
            - paragraph [ref=e81]: We check your details and normally reply within a few working days. Sometimes we ask a follow-up question.
          - generic [ref=e82]:
            - heading "3. Conditions" [level=3] [ref=e83]
            - paragraph [ref=e84]: Once approved, you receive your trade conditions and current availability from your personal contact.
          - generic [ref=e85]:
            - heading "4. Order" [level=3] [ref=e86]
            - paragraph [ref=e87]: Order by email, phone or WhatsApp. We confirm every order in writing before dispatch.
      - generic [ref=e88]:
        - heading "Delivery coverage" [level=2] [ref=e90]
        - paragraph [ref=e91]: We deliver throughout Germany. Deliveries to Austria and other EU countries are possible on request – tell us your delivery destinations in the application and we will confirm what is feasible. Local pickup in Duisburg can also be arranged.
      - generic [ref=e92]:
        - heading "Trade pricing" [level=2] [ref=e94]
        - paragraph [ref=e95]: Wholesale prices depend on product, pack size and volume, and are shared as an individual price list after approval. We do not publish trade prices on the website.
        - paragraph [ref=e96]: Approval, payment terms and any minimum order values are agreed individually per account and confirmed in writing. Submitting an application does not create any entitlement to a trade account or specific conditions.
      - generic [ref=e97]:
        - heading "Frequently asked questions" [level=2] [ref=e99]
        - generic [ref=e100]:
          - group [ref=e101]:
            - generic "Who can apply for a wholesale account? +" [ref=e102] [cursor=pointer]
          - group [ref=e103]:
            - generic "Is there a minimum order value? +" [ref=e104] [cursor=pointer]
          - group [ref=e105]:
            - generic "How quickly will I hear back? +" [ref=e106] [cursor=pointer]
          - group [ref=e107]:
            - generic "Do you deliver outside Germany? +" [ref=e108] [cursor=pointer]
          - group [ref=e109]:
            - generic "Can I order samples first? +" [ref=e110] [cursor=pointer]
          - group [ref=e111]:
            - generic "Do I need a VAT ID? +" [ref=e112] [cursor=pointer]
      - generic [ref=e113]:
        - generic [ref=e114]:
          - heading "Become a trade customer" [level=2] [ref=e115]
          - paragraph [ref=e116]: Tell us about your business – we will get back to you personally.
        - link "Apply now" [ref=e117] [cursor=pointer]:
          - /url: "#apply"
      - generic [ref=e118]:
        - heading "Questions about wholesale?" [level=2] [ref=e120]
        - paragraph [ref=e121]: Reach the wholesale team directly – by phone, WhatsApp or through the contact form.
        - generic [ref=e122]:
          - link "Go to contact page" [ref=e123] [cursor=pointer]:
            - /url: /en/contact
          - link "+49 176 21809185" [ref=e124]:
            - /url: tel:+4917621809185
      - generic [ref=e125]:
        - heading "Wholesale application" [level=2] [ref=e127]
        - paragraph [ref=e128]: Please complete the form below. We treat your details confidentially and only use them to process your application.
        - paragraph [ref=e129]: Fields marked * are required.
        - generic [ref=e130]:
          - group "Company" [ref=e131]:
            - generic [ref=e132]: Company
            - generic [ref=e133]:
              - generic [ref=e134]:
                - generic [ref=e135]: Company name *
                - textbox "Company name *" [ref=e136]
              - generic [ref=e137]:
                - generic [ref=e138]: Business address (street and number) *
                - textbox "Business address (street and number) *" [ref=e139]
              - generic [ref=e140]:
                - generic [ref=e141]: City *
                - textbox "City *" [ref=e142]
              - generic [ref=e143]:
                - generic [ref=e144]: Postcode *
                - textbox "Postcode *" [ref=e145]
              - generic [ref=e146]:
                - generic [ref=e147]: Country *
                - combobox "Country *" [ref=e148]:
                  - option "Country"
                  - option "Germany" [selected]
                  - option "Austria"
                  - option "Switzerland"
                  - option "Netherlands"
                  - option "Belgium"
                  - option "France"
              - generic [ref=e149]:
                - generic [ref=e150]: Type of business *
                - combobox "Type of business *" [ref=e151]:
                  - option "Type of business" [selected]
                  - option "Grocery retailer"
                  - option "Restaurant"
                  - option "Café"
                  - option "Bakery"
                  - option "Confectioner"
                  - option "Distributor"
                  - option "Corporate buyer"
                  - option "Market trader"
                  - option "Other"
              - generic [ref=e152]:
                - generic [ref=e153]: VAT ID
                - textbox "VAT ID Please provide at least a VAT ID or a registration number." [ref=e154]
                - generic [ref=e155]: Please provide at least a VAT ID or a registration number.
              - generic [ref=e156]:
                - generic [ref=e157]: Company registration number
                - textbox "Company registration number" [ref=e158]
              - generic [ref=e159]:
                - generic [ref=e160]: Website
                - textbox "Website" [ref=e161]
          - group "Contact person" [ref=e162]:
            - generic [ref=e163]: Contact person
            - generic [ref=e164]:
              - generic [ref=e165]:
                - generic [ref=e166]: Contact name *
                - textbox "Contact name *" [ref=e167]
              - generic [ref=e168]:
                - generic [ref=e169]: Email address *
                - textbox "Email address *" [ref=e170]
              - generic [ref=e171]:
                - generic [ref=e172]: Phone number *
                - textbox "Phone number * International format, e.g. +49 176 1234567" [ref=e173]
                - generic [ref=e174]: International format, e.g. +49 176 1234567
              - generic [ref=e175]:
                - generic [ref=e176]: Preferred contact method *
                - combobox "Preferred contact method *" [ref=e177]:
                  - option "Preferred contact method" [selected]
                  - option "Email"
                  - option "Phone"
                  - option "WhatsApp"
          - group "Business details" [ref=e178]:
            - generic [ref=e179]: Business details
            - generic [ref=e180]:
              - generic [ref=e181]:
                - generic [ref=e182]: Expected monthly order volume *
                - combobox "Expected monthly order volume *" [ref=e183]:
                  - option "Expected monthly order volume" [selected]
                  - option "Up to €500"
                  - option "€500 – €1,500"
                  - option "€1,500 – €5,000"
                  - option "More than €5,000"
                  - option "Not sure yet"
              - group "Products of interest" [ref=e184]:
                - generic [ref=e185]: Products of interest *
                - generic [ref=e186]:
                  - generic [ref=e187]:
                    - checkbox "Raisins" [ref=e188]
                    - generic [ref=e189]: Raisins
                  - generic [ref=e190]:
                    - checkbox "Figs" [ref=e191]
                    - generic [ref=e192]: Figs
                  - generic [ref=e193]:
                    - checkbox "Mulberries" [ref=e194]
                    - generic [ref=e195]: Mulberries
                  - generic [ref=e196]:
                    - checkbox "Peaches" [ref=e197]
                    - generic [ref=e198]: Peaches
                  - generic [ref=e199]:
                    - checkbox "Apricots" [ref=e200]
                    - generic [ref=e201]: Apricots
              - group "Delivery countries" [ref=e202]:
                - generic [ref=e203]: Delivery countries *
                - generic [ref=e204]:
                  - generic [ref=e205]:
                    - checkbox "Germany" [checked] [ref=e206]
                    - generic [ref=e207]: Germany
                  - generic [ref=e208]:
                    - checkbox "Austria" [ref=e209]
                    - generic [ref=e210]: Austria
                  - generic [ref=e211]:
                    - checkbox "Switzerland" [ref=e212]
                    - generic [ref=e213]: Switzerland
                  - generic [ref=e214]:
                    - checkbox "Netherlands" [ref=e215]
                    - generic [ref=e216]: Netherlands
                  - generic [ref=e217]:
                    - checkbox "Belgium" [ref=e218]
                    - generic [ref=e219]: Belgium
                  - generic [ref=e220]:
                    - checkbox "France" [ref=e221]
                    - generic [ref=e222]: France
                  - generic [ref=e223]:
                    - checkbox "Other EU country" [ref=e224]
                    - generic [ref=e225]: Other EU country
              - generic [ref=e226]:
                - generic [ref=e227]: Additional message
                - textbox "Additional message" [ref=e228]:
                  - /placeholder: Tell us more about your business, sample requests or planned quantities.
          - generic [ref=e230]:
            - text: Fax
            - textbox [ref=e231]
          - generic [ref=e232]:
            - checkbox "I have read the privacy policy and agree that my details are processed to handle this application." [ref=e233]
            - generic [ref=e234]: I have read the privacy policy and agree that my details are processed to handle this application.
          - generic [ref=e235]:
            - checkbox "I confirm that the information provided is accurate." [ref=e236]
            - generic [ref=e237]: I confirm that the information provided is accurate.
          - button "Submit application" [ref=e238] [cursor=pointer]
  - contentinfo [ref=e239]:
    - generic [ref=e240]:
      - generic [ref=e241]:
        - generic [ref=e242]:
          - generic [ref=e243]: K
          - strong [ref=e245]: Khan
        - paragraph [ref=e246]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e247]: "@khandryfruit"
      - generic [ref=e248]:
        - heading "Explore" [level=2] [ref=e249]
        - link "All products" [ref=e250]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e251]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e252]:
          - /url: /en/wholesale
        - link "Our story" [ref=e253]:
          - /url: /en/our-story
      - generic [ref=e254]:
        - heading "Help" [level=2] [ref=e255]
        - link "FAQ" [ref=e256]:
          - /url: /en/faq
        - link "Shipping" [ref=e257]:
          - /url: /en/shipping
        - link "Returns" [ref=e258]:
          - /url: /en/returns
        - link "Contact" [ref=e259]:
          - /url: /en/contact
      - generic [ref=e260]:
        - heading "Legal" [level=2] [ref=e261]
        - link "Impressum" [ref=e262]:
          - /url: /en/impressum
        - link "Privacy" [ref=e263]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e264]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e265]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e266]:
          - /url: /en/cookie-settings
    - generic [ref=e267]:
      - generic [ref=e268]: © 2026 Khan Dry Fruit
      - generic [ref=e269]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e270]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e271]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | // Persisting submissions needs a reachable database behind the dev server.
  4  | // Run with E2E_DATABASE_AVAILABLE=1 against a migrated + seeded database.
  5  | const dbAvailable = Boolean(process.env.E2E_DATABASE_AVAILABLE);
  6  | 
  7  | test("shows the wholesale landing content in both languages", async ({ page }) => {
  8  |   await page.goto("/de/grosshandel");
  9  |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  10 |     "Großhandel",
  11 |   );
  12 |   await expect(page.getByText("Häufige Fragen")).toBeVisible();
  13 |   await expect(
  14 |     page.getByRole("heading", { name: /Großhandelsbewerbung/ }),
  15 |   ).toBeVisible();
  16 | 
  17 |   await page.goto("/en/wholesale");
  18 |   await expect(page.getByRole("heading", { level: 1 })).toContainText(
  19 |     "Wholesale",
  20 |   );
  21 |   await expect(page.getByText("Frequently asked questions")).toBeVisible();
  22 | });
  23 | 
  24 | test("redirects mismatched wholesale slugs to the localized URL", async ({
  25 |   page,
  26 | }) => {
  27 |   await page.goto("/de/wholesale");
  28 |   await expect(page).toHaveURL(/\/de\/grosshandel$/);
  29 |   await page.goto("/en/grosshandel");
  30 |   await expect(page).toHaveURL(/\/en\/wholesale$/);
  31 | });
  32 | 
  33 | test("shows localized validation errors for an incomplete application", async ({
  34 |   page,
  35 | }) => {
  36 |   await page.goto("/en/wholesale");
  37 |   await page.getByLabel(/Company name/).fill("E2E Trading Ltd");
  38 |   const submit = page.getByRole("button", { name: "Submit application" });
  39 |   // Retry the first interaction until hydration has attached the handler.
  40 |   await expect(async () => {
  41 |     await submit.click();
  42 |     await expect(page.locator(".form-error")).toBeVisible({ timeout: 2_000 });
> 43 |   }).toPass({ timeout: 30_000 });
     |      ^ Error: expect(locator).toBeVisible() failed
  44 |   await expect(page.locator(".field-error").first()).toBeVisible();
  45 | });
  46 | 
  47 | test("submits a wholesale application and shows the success state", async ({
  48 |   page,
  49 | }) => {
  50 |   test.skip(!dbAvailable, "requires a database (set E2E_DATABASE_AVAILABLE=1)");
  51 |   await page.goto("/en/wholesale");
  52 |   const unique = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  53 |   await page.getByLabel(/Company name/).fill("E2E Trading Ltd");
  54 |   await page.getByLabel(/Business address/).fill("Teststraße 12");
  55 |   await page.getByLabel(/City/).fill("Duisburg");
  56 |   await page.getByLabel(/Postcode/).fill("47051");
  57 |   await page.getByLabel(/Country/, { exact: false }).first().selectOption("DE");
  58 |   await page.getByLabel(/Type of business/).selectOption("GROCERY_RETAILER");
  59 |   await page.getByLabel(/VAT ID/).fill("DE123456789");
  60 |   await page.getByLabel(/Contact name/).fill("E2E Contact");
  61 |   await page.getByLabel(/Email address/).fill(`e2e-wholesale-${unique}@example.com`);
  62 |   await page.getByLabel(/Phone number/).fill("+4917612345678");
  63 |   await page
  64 |     .getByLabel(/Preferred contact method/)
  65 |     .selectOption("EMAIL");
  66 |   await page
  67 |     .getByLabel(/Expected monthly order volume/)
  68 |     .selectOption("UP_TO_500");
  69 |   await page
  70 |     .getByRole("group", { name: /Products of interest/i })
  71 |     .getByRole("checkbox")
  72 |     .first()
  73 |     .check();
  74 |   await page.getByLabel(/I have read the privacy policy/).check();
  75 |   await page.getByLabel(/information provided is accurate/).check();
  76 |   await page.getByRole("button", { name: "Submit application" }).click();
  77 |   await expect(
  78 |     page.getByRole("heading", {
  79 |       name: /your application has been received/i,
  80 |     }),
  81 |   ).toBeVisible({ timeout: 15_000 });
  82 | });
  83 | 
```