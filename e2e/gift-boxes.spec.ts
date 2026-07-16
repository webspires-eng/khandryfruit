import { expect, test } from "@playwright/test";

test("browses the fixed gift-box catalogue and detail page", async ({ page }) => {
  await page.goto("/en/gift-boxes");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Gift boxes",
  );
  await page.getByRole("link", { name: /View box/i }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Classic Selection/i,
  );
  await expect(page.getByText(/Black Raisins/i).first()).toBeVisible();
});

test("serves the German gift-box routes", async ({ page }) => {
  await page.goto("/de/geschenkboxen");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Geschenkboxen",
  );
  await page.goto("/de/geschenkboxen/selbst-zusammenstellen");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ihre Box",
  );
});

async function chooseSize(
  page: import("@playwright/test").Page,
  name: RegExp,
) {
  const button = page.getByRole("button", { name });
  // Retry the first interaction until hydration has attached the handler.
  await expect(async () => {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true", {
      timeout: 1_000,
    });
  }).toPass({ timeout: 30_000 });
}

test("enforces the minimum selection before a box can be added", async ({
  page,
}) => {
  await page.goto("/en/gift-boxes/build-your-own");
  await chooseSize(page, /Medium gift box/i);
  await expect(page.getByText(/at least 3 items/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add gift box to cart" }),
  ).toBeDisabled();
});

test("builds a custom gift box and adds it to the cart", async ({ page }) => {
  await page.goto("/en/gift-boxes/build-your-own");
  await chooseSize(page, /Medium gift box/i);
  const plus = page.getByRole("button", { name: "Black Raisins +" }).first();
  await plus.click();
  await plus.click();
  await plus.click();
  await expect(page.getByText(/3 of 5 slots used/i)).toBeVisible();
  await page.getByRole("button", { name: /Premium wrap/i }).click();
  await page.getByLabel(/Gift message/).fill("Happy Eid from the E2E suite!");
  await page.getByRole("button", { name: "Add gift box to cart" }).click();
  await expect(
    page.getByRole("heading", { name: /Your gift box is in the cart/i }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Go to cart" }).click();
  await expect(page).toHaveURL(/\/en\/cart/);
  await expect(page.getByText(/Gift box ·/i)).toBeVisible();
  await expect(page.getByText(/Black Raisins/i).first()).toBeVisible();
  await expect(page.getByText(/Happy Eid from the E2E suite!/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit box" })).toBeVisible();
});
