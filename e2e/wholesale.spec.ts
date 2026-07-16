import { expect, test } from "@playwright/test";

// Persisting submissions needs a reachable database behind the dev server.
// Run with E2E_DATABASE_AVAILABLE=1 against a migrated + seeded database.
const dbAvailable = Boolean(process.env.E2E_DATABASE_AVAILABLE);

test("shows the wholesale landing content in both languages", async ({ page }) => {
  await page.goto("/de/grosshandel");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Großhandel",
  );
  await expect(page.getByText("Häufige Fragen")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Großhandelsbewerbung/ }),
  ).toBeVisible();

  await page.goto("/en/wholesale");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Wholesale",
  );
  await expect(page.getByText("Frequently asked questions")).toBeVisible();
});

test("redirects mismatched wholesale slugs to the localized URL", async ({
  page,
}) => {
  await page.goto("/de/wholesale");
  await expect(page).toHaveURL(/\/de\/grosshandel$/);
  await page.goto("/en/grosshandel");
  await expect(page).toHaveURL(/\/en\/wholesale$/);
});

test("shows localized validation errors for an incomplete application", async ({
  page,
}) => {
  await page.goto("/en/wholesale");
  await page.getByLabel(/Company name/).fill("E2E Trading Ltd");
  const submit = page.getByRole("button", { name: "Submit application" });
  // Retry the first interaction until hydration has attached the handler.
  await expect(async () => {
    await submit.click();
    await expect(page.locator(".form-error")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.locator(".field-error").first()).toBeVisible();
});

test("submits a wholesale application and shows the success state", async ({
  page,
}) => {
  test.skip(!dbAvailable, "requires a database (set E2E_DATABASE_AVAILABLE=1)");
  await page.goto("/en/wholesale");
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  await page.getByLabel(/Company name/).fill("E2E Trading Ltd");
  await page.getByLabel(/Business address/).fill("Teststraße 12");
  await page.getByLabel(/City/).fill("Duisburg");
  await page.getByLabel(/Postcode/).fill("47051");
  await page.getByLabel(/Country/, { exact: false }).first().selectOption("DE");
  await page.getByLabel(/Type of business/).selectOption("GROCERY_RETAILER");
  await page.getByLabel(/VAT ID/).fill("DE123456789");
  await page.getByLabel(/Contact name/).fill("E2E Contact");
  await page.getByLabel(/Email address/).fill(`e2e-wholesale-${unique}@example.com`);
  await page.getByLabel(/Phone number/).fill("+4917612345678");
  await page
    .getByLabel(/Preferred contact method/)
    .selectOption("EMAIL");
  await page
    .getByLabel(/Expected monthly order volume/)
    .selectOption("UP_TO_500");
  await page
    .getByRole("group", { name: /Products of interest/i })
    .getByRole("checkbox")
    .first()
    .check();
  await page.getByLabel(/I have read the privacy policy/).check();
  await page.getByLabel(/information provided is accurate/).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByRole("heading", {
      name: /your application has been received/i,
    }),
  ).toBeVisible({ timeout: 15_000 });
});
