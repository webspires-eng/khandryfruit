import { afterEach, describe, expect, it, vi } from "vitest";

import { hasTrustedOrigin } from "./origin";

afterEach(() => vi.unstubAllEnvs());

describe("origin validation", () => {
  it("accepts safe methods without an Origin header", () => {
    expect(
      hasTrustedOrigin(
        new Request("https://shop.example/api", { method: "GET" }),
      ),
    ).toBe(true);
  });

  it("accepts an exact configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example");
    const request = new Request("https://shop.example/api", {
      method: "POST",
      headers: { Origin: "https://shop.example" },
    });
    expect(hasTrustedOrigin(request)).toBe(true);
  });

  it("rejects missing, lookalike, and cross-site origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example");
    expect(
      hasTrustedOrigin(
        new Request("https://shop.example/api", { method: "POST" }),
      ),
    ).toBe(false);
    for (const origin of [
      "https://evil.example",
      "https://shop.example.evil.test",
    ]) {
      expect(
        hasTrustedOrigin(
          new Request("https://shop.example/api", {
            method: "POST",
            headers: { Origin: origin },
          }),
        ),
      ).toBe(false);
    }
  });
});
