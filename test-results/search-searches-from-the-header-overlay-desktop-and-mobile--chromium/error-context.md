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
        - button "Open search" [active] [ref=e21]:
          - img [ref=e22]
        - link "DE" [ref=e25] [cursor=pointer]:
          - /url: /de
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
    - generic [ref=e44]:
      - generic [ref=e45]:
        - paragraph [ref=e46]: Selected specialities · Duisburg
        - heading "Premium Afghan Dry Fruits" [level=1] [ref=e47]
        - paragraph [ref=e48]: Discover carefully selected raisins, figs, apricots, mulberries and other Afghan specialities, packed with care and delivered across Germany.
        - generic [ref=e49]:
          - link "Shop Now" [ref=e50] [cursor=pointer]:
            - /url: /en/shop
            - text: Shop Now
            - img [ref=e51]
          - link "Discover Our Sourcing" [ref=e53] [cursor=pointer]:
            - /url: /en/sourcing
        - generic [ref=e54]:
          - generic [ref=e55]:
            - img [ref=e56]
            - text: Stripe
          - generic [ref=e59]:
            - img [ref=e60]
            - text: Duisburg
          - generic [ref=e63]:
            - img [ref=e64]
            - text: Packed with care
      - img "Arrangement of selected dry fruits in warm natural tones" [ref=e69]:
        - generic [ref=e71]:
          - generic [ref=e72]: Selected in
          - strong [ref=e73]: Duisburg
    - generic [ref=e75]:
      - generic [ref=e76]:
        - img [ref=e77]
        - generic [ref=e80]:
          - strong [ref=e81]: Afghan selection
          - generic [ref=e82]: Confirmed regions clearly named
      - generic [ref=e83]:
        - img [ref=e84]
        - generic [ref=e86]:
          - strong [ref=e87]: Secure payment
          - generic [ref=e88]: Stripe Checkout
      - generic [ref=e89]:
        - img [ref=e90]
        - generic [ref=e93]:
          - strong [ref=e94]: Gift-worthy
          - generic [ref=e95]: Warm, premium presentation
    - generic [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e98]:
          - paragraph [ref=e99]: Collection
          - heading "Explore by variety" [level=2] [ref=e100]
        - link "View all" [ref=e101] [cursor=pointer]:
          - /url: /en/shop
          - text: View all
          - img [ref=e102]
      - generic [ref=e104]:
        - link "01 Raisins From dark and soft to light and delicate." [ref=e105] [cursor=pointer]:
          - /url: /en/category/rosinen
          - generic [ref=e106]: "01"
          - generic [ref=e107]:
            - heading "Raisins" [level=3] [ref=e108]
            - paragraph [ref=e109]: From dark and soft to light and delicate.
          - img [ref=e110]
        - 'link "02 Figs Confirmed sourcing example: Kandahar." [ref=e112] [cursor=pointer]':
          - /url: /en/category/feigen
          - generic [ref=e113]: "02"
          - generic [ref=e114]:
            - heading "Figs" [level=3] [ref=e115]
            - paragraph [ref=e116]: "Confirmed sourcing example: Kandahar."
          - img [ref=e117]
        - link "03 Mulberries From the Shamali region." [ref=e119] [cursor=pointer]:
          - /url: /en/category/maulbeeren
          - generic [ref=e120]: "03"
          - generic [ref=e121]:
            - heading "Mulberries" [level=3] [ref=e122]
            - paragraph [ref=e123]: From the Shamali region.
          - img [ref=e124]
        - link "04 Gift boxes Composed for meaningful occasions." [ref=e126] [cursor=pointer]:
          - /url: /en/gift-boxes
          - generic [ref=e127]: "04"
          - generic [ref=e128]:
            - heading "Gift boxes" [level=3] [ref=e129]
            - paragraph [ref=e130]: Composed for meaningful occasions.
          - img [ref=e131]
    - generic [ref=e134]:
      - generic [ref=e135]:
        - generic [ref=e136]:
          - paragraph [ref=e137]: Selected for launch
          - heading "Customer favourites" [level=2] [ref=e138]
        - paragraph [ref=e139]: Visible items remain development drafts until mandatory data is approved.
      - generic [ref=e140]:
        - article [ref=e141]:
          - link "Black Raisins" [ref=e142] [cursor=pointer]:
            - /url: /en/product/black-raisins
            - generic [ref=e144]: Draft product
            - generic [ref=e145]: Kabul
          - generic [ref=e146]:
            - paragraph [ref=e147]: Raisins
            - heading "Black Raisins" [level=3] [ref=e148]:
              - link "Black Raisins" [ref=e149] [cursor=pointer]:
                - /url: /en/product/black-raisins
            - paragraph [ref=e150]: Dark raisins from Kabul with a soft texture and balanced character.
            - generic [ref=e151]:
              - generic [ref=e152]:
                - text: from
                - strong [ref=e153]: €8.99
              - generic [ref=e154]: €17.98/kg
            - link "View product" [ref=e155] [cursor=pointer]:
              - /url: /en/product/black-raisins
              - text: View product
              - img [ref=e156]
        - article [ref=e159]:
          - link "Green Raisins" [ref=e160] [cursor=pointer]:
            - /url: /en/product/green-raisins
            - generic [ref=e162]: Draft product
            - generic [ref=e163]: Kabul
          - generic [ref=e164]:
            - paragraph [ref=e165]: Raisins
            - heading "Green Raisins" [level=3] [ref=e166]:
              - link "Green Raisins" [ref=e167] [cursor=pointer]:
                - /url: /en/product/green-raisins
            - paragraph [ref=e168]: Light Afghan raisins from Kabul, created as a development product.
            - generic [ref=e169]:
              - generic [ref=e170]:
                - text: from
                - strong [ref=e171]: €9.99
              - generic [ref=e172]: €19.98/kg
            - link "View product" [ref=e173] [cursor=pointer]:
              - /url: /en/product/green-raisins
              - text: View product
              - img [ref=e174]
        - article [ref=e177]:
          - link "Afghan Figs" [ref=e178] [cursor=pointer]:
            - /url: /en/product/afghan-figs
            - generic [ref=e180]: Draft product
            - generic [ref=e181]: Kandahar
          - generic [ref=e182]:
            - paragraph [ref=e183]: Figs
            - heading "Afghan Figs" [level=3] [ref=e184]:
              - link "Afghan Figs" [ref=e185] [cursor=pointer]:
                - /url: /en/product/afghan-figs
            - paragraph [ref=e186]: Figs from Kandahar, created for the development catalogue.
            - generic [ref=e187]:
              - generic [ref=e188]:
                - text: from
                - strong [ref=e189]: €12.99
              - generic [ref=e190]: €25.98/kg
            - link "View product" [ref=e191] [cursor=pointer]:
              - /url: /en/product/afghan-figs
              - text: View product
              - img [ref=e192]
        - article [ref=e195]:
          - link "Dried Mulberries" [ref=e196] [cursor=pointer]:
            - /url: /en/product/dried-mulberries
            - generic [ref=e198]: Draft product
            - generic [ref=e199]: Shamali
          - generic [ref=e200]:
            - paragraph [ref=e201]: Mulberries
            - heading "Dried Mulberries" [level=3] [ref=e202]:
              - link "Dried Mulberries" [ref=e203] [cursor=pointer]:
                - /url: /en/product/dried-mulberries
            - paragraph [ref=e204]: Mulberries from the Shamali region, presented as a development example.
            - generic [ref=e205]:
              - generic [ref=e206]:
                - text: from
                - strong [ref=e207]: €10.99
              - generic [ref=e208]: €21.98/kg
            - link "View product" [ref=e209] [cursor=pointer]:
              - /url: /en/product/dried-mulberries
              - text: View product
              - img [ref=e210]
    - generic [ref=e214]:
      - generic [ref=e215]:
        - generic [ref=e217]: Kabul
        - generic [ref=e218]: Kandahar
        - generic [ref=e219]: Logar
        - generic [ref=e220]: Shamali
      - generic [ref=e221]:
        - paragraph [ref=e222]: Sourcing with clarity
        - heading "Four regions. One considered selection." [level=2] [ref=e223]
        - paragraph [ref=e224]: Our confirmed sourcing examples span figs from Kandahar, peaches from Logar, raisins from Kabul and mulberries from Shamali.
        - paragraph [ref=e225]: We do not publish grower, organic or fair-trade claims without verified evidence.
        - link "Explore sourcing" [ref=e226] [cursor=pointer]:
          - /url: /en/sourcing
          - text: Explore sourcing
          - img [ref=e227]
    - generic [ref=e230]:
      - generic [ref=e231]:
        - paragraph [ref=e232]: Khan Dry Fruit
        - heading "What matters to us" [level=2] [ref=e233]
      - generic [ref=e234]:
        - generic [ref=e235]:
          - strong [ref=e236]: "01"
          - generic [ref=e237]:
            - generic [ref=e238]: Facts before claims
            - generic [ref=e239]: Only verified product information is published.
        - generic [ref=e240]:
          - strong [ref=e241]: "02"
          - generic [ref=e242]:
            - generic [ref=e243]: Clear food information
            - generic [ref=e244]: Ingredients, allergens, origin and nutrition are part of publishing.
        - generic [ref=e245]:
          - strong [ref=e246]: "03"
          - generic [ref=e247]:
            - generic [ref=e248]: Reliable commerce
            - generic [ref=e249]: Prices and stock are verified server-side.
    - generic [ref=e251]:
      - generic [ref=e252]:
        - paragraph [ref=e253]: Newsletter
        - heading "Notes from our pantry" [level=2] [ref=e254]
        - paragraph [ref=e255]: Receive product arrivals, recipes and gifting ideas. Optional subscription, unsubscribe at any time.
      - generic [ref=e256]:
        - generic [ref=e257]: E-Mail
        - generic [ref=e258]:
          - textbox "E-Mail" [ref=e259]:
            - /placeholder: name@example.com
          - button "Subscribe" [ref=e260] [cursor=pointer]
        - generic [ref=e261]: By subscribing you agree to processing under the privacy notice.
  - contentinfo [ref=e262]:
    - generic [ref=e263]:
      - generic [ref=e264]:
        - generic [ref=e265]:
          - generic [ref=e266]: K
          - generic [ref=e267]:
            - strong [ref=e268]: Khan
            - generic [ref=e269]: Dry Fruit
        - paragraph [ref=e270]: Selected Afghan dry fruits, thoughtfully presented in Duisburg.
        - paragraph [ref=e271]: "@khandryfruit"
      - generic [ref=e272]:
        - heading "Explore" [level=2] [ref=e273]
        - link "All products" [ref=e274] [cursor=pointer]:
          - /url: /en/shop
        - link "Gift boxes" [ref=e275] [cursor=pointer]:
          - /url: /en/gift-boxes
        - link "Wholesale" [ref=e276] [cursor=pointer]:
          - /url: /en/wholesale
        - link "Our story" [ref=e277] [cursor=pointer]:
          - /url: /en/our-story
      - generic [ref=e278]:
        - heading "Help" [level=2] [ref=e279]
        - link "FAQ" [ref=e280] [cursor=pointer]:
          - /url: /en/faq
        - link "Shipping" [ref=e281] [cursor=pointer]:
          - /url: /en/shipping
        - link "Returns" [ref=e282] [cursor=pointer]:
          - /url: /en/returns
        - link "Contact" [ref=e283] [cursor=pointer]:
          - /url: /en/contact
      - generic [ref=e284]:
        - heading "Legal" [level=2] [ref=e285]
        - link "Impressum" [ref=e286] [cursor=pointer]:
          - /url: /en/impressum
        - link "Privacy" [ref=e287] [cursor=pointer]:
          - /url: /en/privacy
        - link "AGB / Terms" [ref=e288] [cursor=pointer]:
          - /url: /en/terms
        - link "Withdrawal" [ref=e289] [cursor=pointer]:
          - /url: /en/withdrawal
        - link "Cookies" [ref=e290] [cursor=pointer]:
          - /url: /en/cookie-settings
    - generic [ref=e291]:
      - generic [ref=e292]: © 2026 Khan Dry Fruit
      - generic [ref=e293]: Duisburg, Germany
  - link "Contact Khan Dry Fruit on WhatsApp (opens a new tab)" [ref=e294] [cursor=pointer]:
    - /url: https://wa.me/4917621809185?text=Hello%2C%20I%20have%20a%20question%20about%20Khan%20Dry%20Fruit.
    - img [ref=e295]
    - generic [ref=e297]: WhatsApp
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