import { expect, test } from "@playwright/test";

test("CSP supplies a unique nonce and stages strict enforcement", async ({
  request,
}) => {
  const first = await request.get("/en");
  const second = await request.get("/en");
  const reportOnly =
    first.headers()["content-security-policy-report-only"] ?? "";
  const enforced = first.headers()["content-security-policy"] ?? "";
  expect(reportOnly).toContain("script-src 'self' 'nonce-");
  expect(reportOnly).toContain("script-src-attr 'none'");
  expect(reportOnly).toContain("object-src 'none'");
  expect(enforced).toContain("'unsafe-inline'");
  expect(reportOnly).not.toBe(
    second.headers()["content-security-policy-report-only"],
  );
});

test("cross-origin checkout creation is rejected", async ({ request }) => {
  const response = await request.post("/api/checkout", {
    headers: { Origin: "https://cross-origin.invalid" },
    data: {},
  });
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    error: { code: "UNTRUSTED_ORIGIN" },
  });
});

test("cross-origin authentication mutation is rejected", async ({
  request,
}) => {
  const response = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: "https://cross-origin.invalid" },
    data: { email: "nobody@example.invalid", password: "synthetic-password" },
  });
  expect(response.status()).toBe(403);
});
