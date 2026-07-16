import { expect, test } from "@playwright/test";

const allowWrites =
  process.env.E2E_WRITE_ENABLED === "true" ||
  process.env.E2E_ALLOW_WRITES === "1";

test("German homepage", async ({ page }) => {
  await page.goto("/de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("h1")).toBeVisible();
});

test("English homepage", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toBeVisible();
});

for (const [locale, path, query] of [
  ["de", "/de/suche", "Rosinen"],
  ["en", "/en/search", "Raisins"],
] as const) {
  test(`${locale === "de" ? "German" : "English"} product search`, async ({
    page,
  }) => {
    await page.goto(`${path}?q=${encodeURIComponent(query)}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main")).toBeVisible();
  });
}

test("product variant selection", async ({ page }) => {
  await page.goto("/en/product/black-raisins");
  const variants = page.locator(".variant-grid button");
  test.skip(
    (await variants.count()) < 2,
    "Requires a product with two variants",
  );
  await variants.nth(1).click();
  await expect(variants.nth(1)).toHaveClass(/selected/);
});

test("standard product add-to-cart", async ({ page }) => {
  await page.goto("/en/product/black-raisins");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/en/cart");
  await expect(page.locator("main")).toContainText("Black Raisins");
});

test("checkout review", async ({ page }) => {
  await page.goto("/en/product/black-raisins");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/en/checkout");
  await expect(page.locator("main")).toBeVisible();
});

test("gift-box builder loads capacity-controlled data", async ({ page }) => {
  await page.goto("/en/gift-boxes/build-your-own");
  await expect(page.locator(".builder-layout")).toBeVisible();
  await expect(page.locator(".option-card").first()).toBeVisible();
});

test("composite gift box can be placed in cart", async ({ page }) => {
  test.skip(
    !allowWrites,
    "Set E2E_WRITE_ENABLED=true against isolated safe data",
  );
  await page.goto("/en/gift-boxes/build-your-own");
  await page.locator(".option-card").first().click();
  const addButtons = page
    .locator(".builder-product-list button")
    .filter({ hasText: "+" });
  for (let index = 0; index < Math.min(3, await addButtons.count()); index += 1)
    await addButtons.nth(index).click();
  const submit = page.locator(".builder-summary button").last();
  test.skip(
    await submit.isDisabled(),
    "Seeded capacity selection is not sufficient",
  );
  await submit.click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto("/en/cart");
  await expect(page.locator("main")).toContainText(/gift box/i);
});

test("wholesale submission is write-gated", async ({ page }) => {
  test.skip(
    !allowWrites,
    "Set E2E_WRITE_ENABLED=true with an isolated test identity",
  );
  await page.goto("/en/wholesale");
  await expect(page.locator('form input[name="companyName"]')).toBeVisible();
});

test("contact submission is write-gated", async ({ page }) => {
  test.skip(
    !allowWrites,
    "Set E2E_WRITE_ENABLED=true with an isolated test identity",
  );
  await page.goto("/en/contact");
  await expect(page.locator('form textarea[name="message"]')).toBeVisible();
});

test("account requires sign-in", async ({ page }) => {
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in/);
});

for (const [locale, expected] of [
  ["en", "Page not found"],
  ["de", "Seite nicht gefunden"],
] as const) {
  test(`${locale === "en" ? "English" : "German"} 404`, async ({ page }) => {
    const response = await page.goto(
      `/${locale}/does-not-exist-production-smoke`,
    );
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: expected })).toBeVisible();
  });
}
