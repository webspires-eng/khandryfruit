import { beforeEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimits } from "./rate-limit";

describe("rate limiter", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit and then blocks", async () => {
    const options = { limit: 3, windowMs: 60_000 };
    const now = 1_000_000;
    expect(
      (await checkRateLimit("contact:1.2.3.4", options, now)).allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit("contact:1.2.3.4", options, now + 1)).allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit("contact:1.2.3.4", options, now + 2)).allowed,
    ).toBe(true);
    const blocked = await checkRateLimit("contact:1.2.3.4", options, now + 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", async () => {
    const options = { limit: 1, windowMs: 60_000 };
    expect((await checkRateLimit("wholesale:a", options)).allowed).toBe(true);
    expect((await checkRateLimit("wholesale:b", options)).allowed).toBe(true);
    expect((await checkRateLimit("wholesale:a", options)).allowed).toBe(false);
  });

  it("frees capacity once the window has passed", async () => {
    const options = { limit: 1, windowMs: 1_000 };
    const now = 5_000;
    expect((await checkRateLimit("key", options, now)).allowed).toBe(true);
    expect((await checkRateLimit("key", options, now + 500)).allowed).toBe(
      false,
    );
    expect((await checkRateLimit("key", options, now + 1_500)).allowed).toBe(
      true,
    );
  });
});
