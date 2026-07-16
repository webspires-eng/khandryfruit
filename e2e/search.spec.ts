import { expect, test } from "@playwright/test";

test("finds products with a German query", async ({ page }) => {
  await page.goto("/de/suche?q=Rosinen");
  await expect(page.getByText(/Produkte? gefunden/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Schwarze Rosinen/ }).first(),
  ).toBeVisible();
});

test("finds products with an English query", async ({ page }) => {
  await page.goto("/en/search?q=raisins");
  await expect(page.getByText(/products? found/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Black Raisins/ }).first(),
  ).toBeVisible();
});

test("shows the no-results state with bestsellers", async ({ page }) => {
  await page.goto("/en/search?q=xyzavocado123");
  await expect(
    page.getByRole("heading", { name: /No products matched your search/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Our bestsellers/i }),
  ).toBeVisible();
});

test("searches from the header overlay (desktop and mobile)", async ({
  page,
}) => {
  await page.goto("/en");
  const trigger = page.getByRole("button", { name: "Open search" });
  const input = page.locator("#header-search");
  // Retry the first interaction until hydration has attached the handler.
  await expect(async () => {
    await trigger.click();
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await expect(input).toBeFocused();
  await input.fill("figs");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/en\/search\?q=figs/);
  await expect(
    page.getByRole("link", { name: /Afghan Figs/i }).first(),
  ).toBeVisible();
});

test("submits a search from the search page form", async ({ page }) => {
  await page.goto("/de/suche");
  const input = page.locator("#site-search");
  await input.fill("Feigen");
  await page.getByRole("button", { name: "Suchen", exact: true }).click();
  await expect(page).toHaveURL(/\/de\/suche\?q=Feigen/);
  await expect(
    page.getByRole("link", { name: /Afghanische Feigen/ }).first(),
  ).toBeVisible();
});
