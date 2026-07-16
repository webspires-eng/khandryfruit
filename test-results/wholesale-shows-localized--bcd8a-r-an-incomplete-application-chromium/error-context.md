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
          - /url: /de/wholesale
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
      - navigation "Breadcrumbs" [ref=e44]:
        - link "Home" [ref=e45] [cursor=pointer]:
          - /url: /en
        - img [ref=e46]
        - generic [ref=e48]: Wholesale
      - generic [ref=e49]:
        - paragraph [ref=e50]: For trade customers
        - heading "Wholesale Afghan dry fruits, straight from one source" [level=1] [ref=e51]
        - paragraph [ref=e52]: We supply grocery shops, hospitality businesses and corporate buyers with carefully selected Afghan dry fruits – in trade quantities, with consistent quality and a personal point of contact in Duisburg.
      - generic [ref=e53]:
        - heading "Trade purchasing with Khan Dry Fruit" [level=2] [ref=e55]
        - paragraph [ref=e56]: As a specialist importer of Afghan dry fruits, we work directly with our sourcing partners and pack in Germany. Trade customers order from the same curated range as our retail shop – raisins, figs, mulberries, apricots and seasonal specialities – in larger units and at trade conditions.
        - paragraph [ref=e57]: Every wholesale relationship starts with a short application. Once we have reviewed your details, we get in touch personally to discuss assortment, quantities and delivery. Conditions such as price lists and minimum order values are agreed individually and confirmed in writing.
      - generic [ref=e58]:
        - heading "Our trade assortment" [level=2] [ref=e60]
        - paragraph [ref=e61]: "The current range – availability varies by season:"
        - list [ref=e62]:
          - listitem [ref=e63]: Raisins
          - listitem [ref=e64]: Figs
          - listitem [ref=e65]: Mulberries
          - listitem [ref=e66]: Peaches
          - listitem [ref=e67]: Apricots
      - generic [ref=e68]:
        - heading "Who we supply" [level=2] [ref=e70]
        - paragraph [ref=e71]: "Our wholesale programme is designed for businesses of every size:"
        - generic [ref=e72]:
          - heading "Grocery shops and international supermarkets" [level=3] [ref=e74]
          - heading "Retailers and delicatessens" [level=3] [ref=e76]
          - heading "Restaurants and caterers" [level=3] [ref=e78]
          - heading "Cafés and coffee shops" [level=3] [ref=e80]
          - heading "Bakeries and patisseries" [level=3] [ref=e82]
          - heading "Confectioners and chocolatiers" [level=3] [ref=e84]
          - heading "Corporate buyers and employee gifting" [level=3] [ref=e86]
          - heading "Bulk buyers and market traders" [level=3] [ref=e88]
      - generic [ref=e89]:
        - heading "How ordering works" [level=2] [ref=e91]
        - generic [ref=e92]:
          - generic [ref=e93]:
            - heading "1. Apply" [level=3] [ref=e94]
            - paragraph [ref=e95]: Send us the application form with your company details. It takes about five minutes.
          - generic [ref=e96]:
            - heading "2. Review" [level=3] [ref=e97]
            - paragraph [ref=e98]: We check your details and normally reply within a few working days. Sometimes we ask a follow-up question.
          - generic [ref=e99]:
            - heading "3. Conditions" [level=3] [ref=e100]
            - paragraph [ref=e101]: Once approved, you receive your trade conditions and current availability from your personal contact.
          - generic [ref=e102]:
            - heading "4. Order" [level=3] [ref=e103]
            - paragraph [ref=e104]: Order by email, phone or WhatsApp. We confirm every order in writing before dispatch.
      - generic [ref=e105]:
        - heading "Delivery coverage" [level=2] [ref=e107]
        - paragraph [ref=e108]: We deliver throughout Germany. Deliveries to Austria and other EU countries are possible on request – tell us your delivery destinations in the application and we will confirm what is feasible. Local pickup in Duisburg can also be arranged.
      - generic [ref=e109]:
        - heading "Trade pricing" [level=2] [ref=e111]
        - paragraph [ref=e112]: Wholesale prices depend on product, pack size and volume, and are shared as an individual price list after approval. We do not publish trade prices on the website.
        - paragraph [ref=e113]: Approval, payment terms and any minimum order values are agreed individually per account and confirmed in writing. Submitting an application does not create any entitlement to a trade account or specific conditions.
      - generic [ref=e114]:
        - heading "Frequently asked questions" [level=2] [ref=e116]
        - generic [ref=e117]:
          - group [ref=e118]:
            - generic "Who can apply for a wholesale account? +" [ref=e119] [cursor=pointer]
          - group [ref=e120]:
            - generic "Is there a minimum order value? +" [ref=e121] [cursor=pointer]
          - group [ref=e122]:
            - generic "How quickly will I hear back? +" [ref=e123] [cursor=pointer]
          - group [ref=e124]:
            - generic "Do you deliver outside Germany? +" [ref=e125] [cursor=pointer]
          - group [ref=e126]:
            - generic "Can I order samples first? +" [ref=e127] [cursor=pointer]
          - group [ref=e128]:
            - generic "Do I need a VAT ID? +" [ref=e129] [cursor=pointer]
      - generic [ref=e130]:
        - generic [ref=e131]:
          - heading "Become a trade customer" [level=2] [ref=e132]
          - paragraph [ref=e133]: Tell us about your business – we will get back to you personally.
        - link "Apply now" [ref=e134] [cursor=pointer]:
          - /url: "#apply"
      - generic [ref=e135]:
        - heading "Questions about wholesale?" [level=2] [ref=e137]
        - paragraph [ref=e138]: Reach the wholesale team directly – by phone, WhatsApp or through the contact form.
        - generic [ref=e139]:
          - link "Go to contact page" [ref=e140] [cursor=pointer]:
            - /url: /en/contact
          - link "+49 176 21809185" [ref=e141] [cursor=pointer]:
            - /url: tel:+4917621809185
      - generic [ref=e142]:
        - heading "Wholesale application" [level=2] [ref=e144]
        - paragraph [ref=e145]: Please complete the form below. We treat your details confidentially and only use them to process your application.
        - paragraph [ref=e146]: Fields marked * are required.
        - generic [ref=e147]:
          - group "Company" [ref=e148]:
            - generic [ref=e149]: Company
            - generic [ref=e150]:
              - generic [ref=e151]:
                - generic [ref=e152]: Company name *
                - textbox "Company name *" [ref=e153]
              - generic [ref=e154]:
                - generic [ref=e155]: Business address (street and number) *
                - textbox "Business address (street and number) *" [ref=e156]
              - generic [ref=e157]:
                - generic [ref=e158]: City *
                - textbox "City *" [ref=e159]
              - generic [ref=e160]:
                - generic [ref=e161]: Postcode *
                - textbox "Postcode *" [ref=e162]
              - generic [ref=e163]:
                - generic [ref=e164]: Country *
                - combobox "Country *" [ref=e165]:
                  - option "Country"
                  - option "Germany" [selected]
                  - option "Austria"
                  - option "Switzerland"
                  - option "Netherlands"
                  - option "Belgium"
                  - option "France"
              - generic [ref=e166]:
                - generic [ref=e167]: Type of business *
                - combobox "Type of business *" [ref=e168]:
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
              - generic [ref=e169]:
                - generic [ref=e170]: VAT ID
                - textbox "VAT ID Please provide at least a VAT ID or a registration number." [ref=e171]
                - generic [ref=e172]: Please provide at least a VAT ID or a registration number.
              - generic [ref=e173]:
                - generic [ref=e174]: Company registration number
                - textbox "Company registration number" [ref=e175]
              - generic [ref=e176]:
                - generic [ref=e177]: Website
                - textbox "Website" [ref=e178]
          - group "Contact person" [ref=e179]:
            - generic [ref=e180]: Contact person
            - generic [ref=e181]:
              - generic [ref=e182]:
                - generic [ref=e183]: Contact name *
                - textbox "Contact name *" [ref=e184]
              - generic [ref=e185]:
                - generic [ref=e186]: Email address *
                - textbox "Email address *" [ref=e187]
              - generic [ref=e188]:
                - generic [ref=e189]: Phone number *
                - textbox "Phone number * International format, e.g. +49 176 1234567" [ref=e190]
                - generic [ref=e191]: International format, e.g. +49 176 1234567
              - generic [ref=e192]:
                - generic [ref=e193]: Preferred contact method *
                - combobox "Preferred contact method *" [ref=e194]:
                  - option "Preferred contact method" [selected]
                  - option "Email"
                  - option "Phone"
                  - option "WhatsApp"
          - group "Business details" [ref=e195]:
            - generic [ref=e196]: Business details
            - generic [ref=e197]:
              - generic [ref=e198]:
                - generic [ref=e199]: Expected monthly order volume *
                - combobox "Expected monthly order volume *" [ref=e200]:
                  - option "Expected monthly order volume" [selected]
                  - option "Up to €500"
                  - option "€500 – €1,500"
                  - option "€1,500 – €5,000"
                  - option "More than €5,000"
                  - option "Not sure yet"
              - group "Products of interest" [ref=e201]:
                - generic [ref=e202]: Products of interest *
                - generic [ref=e203]:
                  - generic [ref=e204]:
                    - checkbox "Raisins" [ref=e205]
                    - generic [ref=e206]: Raisins
                  - generic [ref=e207]:
                    - checkbox "Figs" [ref=e208]
                    - generic [ref=e209]: Figs
                  - generic [ref=e210]:
                    - checkbox "Mulberries" [ref=e211]
                    - generic [ref=e212]: Mulberries
                  - generic [ref=e213]:
                    - checkbox "Peaches" [ref=e214]
                    - generic [ref=e215]: Peaches
                  - generic [ref=e216]:
                    - checkbox "Apricots" [ref=e217]
                    - generic [ref=e218]: Apricots
              - group "Delivery countries" [ref=e219]:
                - generic [ref=e220]: Delivery countries *
                - generic [ref=e221]:
                  - generic [ref=e222]:
                    - checkbox "Germany" [checked] [ref=e223]
                    - generic [ref=e224]: Germany
                  - generic [ref=e225]:
                    - checkbox "Austria" [ref=e226]
                    - generic [ref=e227]: Austria
                  - generic [ref=e228]:
                    - checkbox "Switzerland" [ref=e229]
                    - generic [ref=e230]: Switzerland
                  - generic [ref=e231]:
                    - checkbox "Netherlands" [ref=e232]
                    - generic [ref=e233]: Netherlands
                  - generic [ref=e234]:
                    - checkbox "Belgium" [ref=e235]
                    - generic [ref=e236]: Belgium
                  - generic [ref=e237]:
                    - checkbox "France" [ref=e238]
                    - generic [ref=e239]: France
                  - generic [ref=e240]:
                    - checkbox "Other EU country" [ref=e241]
                    - generic [ref=e242]: Other EU country
              - generic [ref=e243]:
                - generic [ref=e244]: Additional message
                - textbox "Additional message" [ref=e245]:
                  - /placeholder: Tell us more about your business, sample requests or planned quantities.
          - generic [ref=e247]:
            - text: Fax
            - textbox [ref=e248]
          - generic [ref=e249]:
            - checkbox "I have read the privacy policy and agree that my details are processed to handle this application." [ref=e250]
            - generic [ref=e251]: I have read the privacy policy and agree that my details are processed to handle this application.
          - generic [ref=e252]:
            - checkbox "I confirm that the information provided is accurate." [ref=e253]
            - generic [ref=e254]: I confirm that the information provided is accurate.
          - button "Submit application" [ref=e255] [cursor=pointer]
  - contentinfo [ref=e256]:
    - generic [ref=e257]:
      - generic [ref=e258]:
        - generic [ref=e259]:
          - generic [ref=e260]: K
          - generic [ref=e261]:
            - strong [ref=e262]: Khan
            - generic [ref=e263]: Dry Fruit
        - paragraph [ref=e264]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e265]: "@khandryfruit"
      - generic [ref=e266]:
        - heading "Explore" [level=2] [ref=e267]
        - link "All products" [ref=e268] [cursor=pointer]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e269] [cursor=pointer]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e270] [cursor=pointer]:
          - /url: /en/wholesale
        - link "Our story" [ref=e271] [cursor=pointer]:
          - /url: /en/our-story
      - generic [ref=e272]:
        - heading "Help" [level=2] [ref=e273]
        - link "FAQ" [ref=e274] [cursor=pointer]:
          - /url: /en/faq
        - link "Shipping" [ref=e275] [cursor=pointer]:
          - /url: /en/shipping
        - link "Returns" [ref=e276] [cursor=pointer]:
          - /url: /en/returns
        - link "Contact" [ref=e277] [cursor=pointer]:
          - /url: /en/contact
      - generic [ref=e278]:
        - heading "Legal" [level=2] [ref=e279]
        - link "Impressum" [ref=e280] [cursor=pointer]:
          - /url: /en/impressum
        - link "Privacy" [ref=e281] [cursor=pointer]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e282] [cursor=pointer]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e283] [cursor=pointer]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e284] [cursor=pointer]:
          - /url: /en/cookie-settings
    - generic [ref=e285]:
      - generic [ref=e286]: © 2026 Khan Dry Fruit
      - generic [ref=e287]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e288] [cursor=pointer]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e289]
    - generic [ref=e291]: WhatsApp
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