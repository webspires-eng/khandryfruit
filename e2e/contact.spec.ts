import { expect, test } from "@playwright/test";

const dbAvailable = Boolean(process.env.E2E_DATABASE_AVAILABLE);

test("shows contact channels with a safe WhatsApp link", async ({ page }) => {
  await page.goto("/de/kontakt");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kontakt");
  const whatsapp = page.getByRole("link", { name: /WhatsApp-Chat/i });
  await expect(whatsapp).toHaveAttribute("href", /wa\.me\/4917621809185/);
  await expect(whatsapp).toHaveAttribute("target", "_blank");
  await expect(whatsapp).toHaveAttribute("rel", /noopener/);
});

test("shows localized validation errors for an incomplete enquiry", async ({
  page,
}) => {
  await page.goto("/en/contact");
  await page.getByLabel(/Name/, { exact: false }).first().fill("E2E Tester");
  const submit = page.getByRole("button", { name: "Send message" });
  // Retry the first interaction until hydration has attached the handler.
  await expect(async () => {
    await submit.click();
    await expect(page.locator(".form-error")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.locator(".field-error").first()).toBeVisible();
});

test("submits a contact enquiry and shows the confirmation", async ({ page }) => {
  test.skip(!dbAvailable, "requires a database (set E2E_DATABASE_AVAILABLE=1)");
  await page.goto("/en/contact");
  await page.getByLabel(/^Name/).fill("E2E Tester");
  await page.getByLabel(/Email address/).fill("e2e-contact@example.com");
  await page.getByLabel(/Preferred contact method/).selectOption("EMAIL");
  await page.getByLabel(/Enquiry type/).selectOption("GENERAL");
  await page.getByLabel(/Subject/).fill("Question about raisins");
  await page
    .getByLabel(/Message/)
    .fill("Hello, do you offer bulk discounts on raisins for private buyers?");
  await page.getByLabel(/I have read the privacy policy/).check();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", { name: /Thank you for your message/i }),
  ).toBeVisible({ timeout: 15_000 });
});
