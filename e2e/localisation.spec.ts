import { expect, test } from "@playwright/test";

const forbiddenOnEnglish =
  /Veröffentlichung|Zutaten erforderlich|Allergeninformationen|Nur Vorschau|Produktentwurf|Seite nicht gefunden|Zur Startseite/;
const forbiddenOnGerman =
  /Draft product|Preview only|Page not found|Browse products|Required before publication/;

test("German shop is fully German", async ({ page }) => {
  await page.goto("/de/shop");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trockenfrüchte entdecken",
  );
  await expect(page.locator("body")).not.toContainText(forbiddenOnGerman);
});

test("English shop is fully English", async ({ page }) => {
  await page.goto("/en/shop");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore dry fruits",
  );
  await expect(page.locator("body")).not.toContainText(forbiddenOnEnglish);
});

test("German product uses German content and metadata", async ({ page }) => {
  await page.goto("/de/product/schwarze-rosinen");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Schwarze Rosinen",
  );
  await expect(page.locator("body")).toContainText(
    "Zutaten müssen vor der Veröffentlichung bestätigt werden.",
  );
  await expect(page).toHaveTitle(/Schwarze Rosinen/);
  await expect(page.locator("body")).not.toContainText(forbiddenOnGerman);
});

test("English product uses English content and metadata", async ({ page }) => {
  await page.goto("/en/product/black-raisins");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Black Raisins",
  );
  await expect(page.locator("body")).toContainText(
    "Ingredients must be confirmed before publication.",
  );
  await expect(page.locator("body")).toContainText("€8.99");
  await expect(page).toHaveTitle(/Black Raisins/);
  await expect(page.locator("body")).not.toContainText(forbiddenOnEnglish);
});

test("English draft card has an English status", async ({ page }) => {
  await page.goto("/en/shop");
  await expect(page.locator(".draft-badge").first()).toHaveText(
    "Draft product",
  );
});

test("German draft card has a German status", async ({ page }) => {
  await page.goto("/de/shop");
  await expect(page.locator(".draft-badge").first()).toHaveText(
    "Produktentwurf",
  );
});

test("German 404 is fully German", async ({ request }) => {
  const response = await request.get("/de/does-not-exist");
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toContain("Seite nicht gefunden");
  expect(html).toContain("/de/shop");
  expect(html).not.toMatch(forbiddenOnGerman);
});

test("English 404 is fully English", async ({ request }) => {
  const response = await request.get("/en/does-not-exist");
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toContain("Page not found");
  expect(html).toContain("/en/shop");
  expect(html).not.toMatch(forbiddenOnEnglish);
});

for (const locale of ["de", "en"] as const) {
  test(`${locale} checkout localises validation`, async ({ page, request }) => {
    await page.goto(`/${locale}/checkout`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      locale === "de" ? "Bestellung prüfen" : "Review your order",
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name:
          locale === "de"
            ? "Keine Artikel zur Kasse"
            : "No items to check out",
      }),
    ).toBeVisible();
    const response = await request.post("/api/checkout", {
      data: {
        locale,
        email: "buyer@example.com",
        countryCode: "DE",
        shippingMethodId: "de-standard",
        legalAccepted: true,
        lines: [{ variantId: "missing-variant", quantity: 1 }],
      },
    });
    expect(response.status()).toBe(503);
    expect((await response.json()).error.code).toBe("DATABASE_NOT_CONFIGURED");
  });
}
