# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> searches from the header overlay (desktop and mobile)
- Location: e2e/search.spec.ts:29:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#header-search')
Expected: visible
Timeout: 1000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 1000ms
  - waiting for locator('#header-search')


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
          - /url: /de
        - link "Account" [ref=e17]:
          - /url: /en/account
          - img [ref=e18]
        - link "Cart, 0" [ref=e21]:
          - /url: /en/cart
          - img [ref=e22]
  - main [ref=e25]:
    - generic [ref=e27]:
      - generic [ref=e28]:
        - paragraph [ref=e29]: Selected specialities · Duisburg
        - heading "Premium Afghan Dry Fruits" [level=1] [ref=e30]
        - paragraph [ref=e31]: Discover carefully selected raisins, figs, apricots, mulberries and other Afghan specialities, packed with care and delivered across Germany.
        - generic [ref=e32]:
          - link "Shop Now" [ref=e33] [cursor=pointer]:
            - /url: /en/shop
            - text: Shop Now
            - img [ref=e34]
          - link "Discover Our Sourcing" [ref=e36] [cursor=pointer]:
            - /url: /en/sourcing
        - generic [ref=e37]:
          - generic [ref=e38]:
            - img [ref=e39]
            - text: Stripe
          - generic [ref=e42]:
            - img [ref=e43]
            - text: Duisburg
          - generic [ref=e46]:
            - img [ref=e47]
            - text: Packed with care
      - img "Arrangement of selected dry fruits in warm natural tones" [ref=e52]:
        - generic [ref=e54]:
          - generic [ref=e55]: Selected in
          - strong [ref=e56]: Duisburg
    - generic [ref=e58]:
      - generic [ref=e59]:
        - img [ref=e60]
        - generic [ref=e63]:
          - strong [ref=e64]: Afghan selection
          - generic [ref=e65]: Confirmed regions clearly named
      - generic [ref=e66]:
        - img [ref=e67]
        - generic [ref=e69]:
          - strong [ref=e70]: Secure payment
          - generic [ref=e71]: Stripe Checkout
      - generic [ref=e72]:
        - img [ref=e73]
        - generic [ref=e76]:
          - strong [ref=e77]: Gift-worthy
          - generic [ref=e78]: Warm, premium presentation
    - generic [ref=e79]:
      - generic [ref=e80]:
        - generic [ref=e81]:
          - paragraph [ref=e82]: Collection
          - heading "Explore by variety" [level=2] [ref=e83]
        - link "View all" [ref=e84] [cursor=pointer]:
          - /url: /en/shop
          - text: View all
          - img [ref=e85]
      - generic [ref=e87]:
        - link "01 Raisins From dark and soft to light and delicate." [ref=e88]:
          - /url: /en/category/rosinen
          - generic [ref=e89]: "01"
          - generic [ref=e90]:
            - heading "Raisins" [level=3] [ref=e91]
            - paragraph [ref=e92]: From dark and soft to light and delicate.
          - img [ref=e93]
        - 'link "02 Figs Confirmed sourcing example: Kandahar." [ref=e95]':
          - /url: /en/category/feigen
          - generic [ref=e96]: "02"
          - generic [ref=e97]:
            - heading "Figs" [level=3] [ref=e98]
            - paragraph [ref=e99]: "Confirmed sourcing example: Kandahar."
          - img [ref=e100]
        - link "03 Mulberries From the Shamali region." [ref=e102]:
          - /url: /en/category/maulbeeren
          - generic [ref=e103]: "03"
          - generic [ref=e104]:
            - heading "Mulberries" [level=3] [ref=e105]
            - paragraph [ref=e106]: From the Shamali region.
          - img [ref=e107]
        - link "04 Gift boxes Composed for meaningful occasions." [ref=e109]:
          - /url: /en/gift-boxes
          - generic [ref=e110]: "04"
          - generic [ref=e111]:
            - heading "Gift boxes" [level=3] [ref=e112]
            - paragraph [ref=e113]: Composed for meaningful occasions.
          - img [ref=e114]
    - generic [ref=e117]:
      - generic [ref=e118]:
        - generic [ref=e119]:
          - paragraph [ref=e120]: Selected for launch
          - heading "Customer favourites" [level=2] [ref=e121]
        - paragraph [ref=e122]: Visible items remain development drafts until mandatory data is approved.
      - generic [ref=e123]:
        - article [ref=e124]:
          - link "Black Raisins" [ref=e125]:
            - /url: /en/product/black-raisins
            - generic [ref=e127]: Draft product
            - generic [ref=e128]: Kabul
          - generic [ref=e129]:
            - paragraph [ref=e130]: Raisins
            - heading "Black Raisins" [level=3] [ref=e131]:
              - link "Black Raisins" [ref=e132]:
                - /url: /en/product/black-raisins
            - paragraph [ref=e133]: Dark raisins from Kabul with a soft texture and balanced character.
            - generic [ref=e134]:
              - generic [ref=e135]:
                - text: from
                - strong [ref=e136]: €8.99
              - generic [ref=e137]: €17.98/kg
            - link "View product" [ref=e138] [cursor=pointer]:
              - /url: /en/product/black-raisins
              - text: View product
              - img [ref=e139]
        - article [ref=e142]:
          - link "Green Raisins" [ref=e143]:
            - /url: /en/product/green-raisins
            - generic [ref=e145]: Draft product
            - generic [ref=e146]: Kabul
          - generic [ref=e147]:
            - paragraph [ref=e148]: Raisins
            - heading "Green Raisins" [level=3] [ref=e149]:
              - link "Green Raisins" [ref=e150]:
                - /url: /en/product/green-raisins
            - paragraph [ref=e151]: Light Afghan raisins from Kabul, created as a development product.
            - generic [ref=e152]:
              - generic [ref=e153]:
                - text: from
                - strong [ref=e154]: €9.99
              - generic [ref=e155]: €19.98/kg
            - link "View product" [ref=e156] [cursor=pointer]:
              - /url: /en/product/green-raisins
              - text: View product
              - img [ref=e157]
        - article [ref=e160]:
          - link "Afghan Figs" [ref=e161]:
            - /url: /en/product/afghan-figs
            - generic [ref=e163]: Draft product
            - generic [ref=e164]: Kandahar
          - generic [ref=e165]:
            - paragraph [ref=e166]: Figs
            - heading "Afghan Figs" [level=3] [ref=e167]:
              - link "Afghan Figs" [ref=e168]:
                - /url: /en/product/afghan-figs
            - paragraph [ref=e169]: Figs from Kandahar, created for the development catalogue.
            - generic [ref=e170]:
              - generic [ref=e171]:
                - text: from
                - strong [ref=e172]: €12.99
              - generic [ref=e173]: €25.98/kg
            - link "View product" [ref=e174] [cursor=pointer]:
              - /url: /en/product/afghan-figs
              - text: View product
              - img [ref=e175]
        - article [ref=e178]:
          - link "Dried Mulberries" [ref=e179]:
            - /url: /en/product/dried-mulberries
            - generic [ref=e181]: Draft product
            - generic [ref=e182]: Shamali
          - generic [ref=e183]:
            - paragraph [ref=e184]: Mulberries
            - heading "Dried Mulberries" [level=3] [ref=e185]:
              - link "Dried Mulberries" [ref=e186]:
                - /url: /en/product/dried-mulberries
            - paragraph [ref=e187]: Mulberries from the Shamali region, presented as a development example.
            - generic [ref=e188]:
              - generic [ref=e189]:
                - text: from
                - strong [ref=e190]: €10.99
              - generic [ref=e191]: €21.98/kg
            - link "View product" [ref=e192] [cursor=pointer]:
              - /url: /en/product/dried-mulberries
              - text: View product
              - img [ref=e193]
    - generic [ref=e197]:
      - generic [ref=e198]:
        - generic [ref=e200]: Kabul
        - generic [ref=e201]: Kandahar
        - generic [ref=e202]: Logar
        - generic [ref=e203]: Shamali
      - generic [ref=e204]:
        - paragraph [ref=e205]: Sourcing with clarity
        - heading "Four regions. One considered selection." [level=2] [ref=e206]
        - paragraph [ref=e207]: Our confirmed sourcing examples span figs from Kandahar, peaches from Logar, raisins from Kabul and mulberries from Shamali.
        - paragraph [ref=e208]: We do not publish grower, organic or fair-trade claims without verified evidence.
        - link "Explore sourcing" [ref=e209] [cursor=pointer]:
          - /url: /en/sourcing
          - text: Explore sourcing
          - img [ref=e210]
    - generic [ref=e213]:
      - generic [ref=e214]:
        - paragraph [ref=e215]: Khan Dry Fruit
        - heading "What matters to us" [level=2] [ref=e216]
      - generic [ref=e217]:
        - generic [ref=e218]:
          - strong [ref=e219]: "01"
          - generic [ref=e220]:
            - generic [ref=e221]: Facts before claims
            - generic [ref=e222]: Only verified product information is published.
        - generic [ref=e223]:
          - strong [ref=e224]: "02"
          - generic [ref=e225]:
            - generic [ref=e226]: Clear food information
            - generic [ref=e227]: Ingredients, allergens, origin and nutrition are part of publishing.
        - generic [ref=e228]:
          - strong [ref=e229]: "03"
          - generic [ref=e230]:
            - generic [ref=e231]: Reliable commerce
            - generic [ref=e232]: Prices and stock are verified server-side.
    - generic [ref=e234]:
      - generic [ref=e235]:
        - paragraph [ref=e236]: Newsletter
        - heading "Notes from our pantry" [level=2] [ref=e237]
        - paragraph [ref=e238]: Receive product arrivals, recipes and gifting ideas. Optional subscription, unsubscribe at any time.
      - generic [ref=e239]:
        - generic [ref=e240]: E-Mail
        - generic [ref=e241]:
          - textbox "E-Mail" [ref=e242]:
            - /placeholder: name@example.com
          - button "Subscribe" [ref=e243] [cursor=pointer]
        - generic [ref=e244]: By subscribing you agree to processing under the privacy notice.
  - contentinfo [ref=e245]:
    - generic [ref=e246]:
      - generic [ref=e247]:
        - generic [ref=e248]:
          - generic [ref=e249]: K
          - strong [ref=e251]: Khan
        - paragraph [ref=e252]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e253]: "@khandryfruit"
      - generic [ref=e254]:
        - heading "Explore" [level=2] [ref=e255]
        - link "All products" [ref=e256]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e257]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e258]:
          - /url: /en/wholesale
        - link "Our story" [ref=e259]:
          - /url: /en/our-story
      - generic [ref=e260]:
        - heading "Help" [level=2] [ref=e261]
        - link "FAQ" [ref=e262]:
          - /url: /en/faq
        - link "Shipping" [ref=e263]:
          - /url: /en/shipping
        - link "Returns" [ref=e264]:
          - /url: /en/returns
        - link "Contact" [ref=e265]:
          - /url: /en/contact
      - generic [ref=e266]:
        - heading "Legal" [level=2] [ref=e267]
        - link "Impressum" [ref=e268]:
          - /url: /en/impressum
        - link "Privacy" [ref=e269]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e270]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e271]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e272]:
          - /url: /en/cookie-settings
    - generic [ref=e273]:
      - generic [ref=e274]: © 2026 Khan Dry Fruit
      - generic [ref=e275]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e276]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e277]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("finds products with a German query", async ({ page }) => {
  4  |   await page.goto("/de/suche?q=Rosinen");
  5  |   await expect(page.getByText(/Produkte? gefunden/)).toBeVisible();
  6  |   await expect(
  7  |     page.getByRole("link", { name: /Schwarze Rosinen/ }).first(),
  8  |   ).toBeVisible();
  9  | });
  10 | 
  11 | test("finds products with an English query", async ({ page }) => {
  12 |   await page.goto("/en/search?q=raisins");
  13 |   await expect(page.getByText(/products? found/)).toBeVisible();
  14 |   await expect(
  15 |     page.getByRole("link", { name: /Black Raisins/ }).first(),
  16 |   ).toBeVisible();
  17 | });
  18 | 
  19 | test("shows the no-results state with bestsellers", async ({ page }) => {
  20 |   await page.goto("/en/search?q=xyzavocado123");
  21 |   await expect(
  22 |     page.getByRole("heading", { name: /No products matched your search/i }),
  23 |   ).toBeVisible();
  24 |   await expect(
  25 |     page.getByRole("heading", { name: /Our bestsellers/i }),
  26 |   ).toBeVisible();
  27 | });
  28 | 
  29 | test("searches from the header overlay (desktop and mobile)", async ({
  30 |   page,
  31 | }) => {
  32 |   await page.goto("/en");
  33 |   const trigger = page.getByRole("button", { name: "Open search" });
  34 |   const input = page.locator("#header-search");
  35 |   // Retry the first interaction until hydration has attached the handler.
  36 |   await expect(async () => {
  37 |     await trigger.click();
  38 |     await expect(input).toBeVisible({ timeout: 1_000 });
> 39 |   }).toPass({ timeout: 30_000 });
     |      ^ Error: expect(locator).toBeVisible() failed
  40 |   await expect(input).toBeFocused();
  41 |   await input.fill("figs");
  42 |   await input.press("Enter");
  43 |   await expect(page).toHaveURL(/\/en\/search\?q=figs/);
  44 |   await expect(
  45 |     page.getByRole("link", { name: /Afghan Figs/i }).first(),
  46 |   ).toBeVisible();
  47 | });
  48 | 
  49 | test("submits a search from the search page form", async ({ page }) => {
  50 |   await page.goto("/de/suche");
  51 |   const input = page.locator("#site-search");
  52 |   await input.fill("Feigen");
  53 |   await page.getByRole("button", { name: "Suchen", exact: true }).click();
  54 |   await expect(page).toHaveURL(/\/de\/suche\?q=Feigen/);
  55 |   await expect(
  56 |     page.getByRole("link", { name: /Afghanische Feigen/ }).first(),
  57 |   ).toBeVisible();
  58 | });
  59 | 
```