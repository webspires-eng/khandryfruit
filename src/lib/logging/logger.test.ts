import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

afterEach(() => vi.restoreAllMocks());

describe("structured logger redaction", () => {
  it.each([
    "Bearer synthetic-token-value",
    "postgresql://user:password@db.example/store",
    "sk_live_synthetic123456",
    "whsec_synthetic123456",
    "AKIAIOSFODNN7EXAMPLE",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.synthetic",
    "better-auth.session_token=synthetic",
  ])("redacts secret-shaped value %s", (value) => {
    const write = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("synthetic_test", { detail: value });
    const output = String(write.mock.calls[0]?.[0]);
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain(value);
  });

  it("drops sensitive field names and keeps correlation metadata", () => {
    const write = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logger.warn("synthetic_test", {
      correlationId: "corr-123",
      authorization: "synthetic",
      recoveryCode: "synthetic",
      customerAddress: "synthetic address",
    });
    const output = JSON.parse(String(write.mock.calls[0]?.[0])) as Record<
      string,
      unknown
    >;
    expect(output.correlationId).toBe("corr-123");
    expect(output.authorization).toBeUndefined();
    expect(output.recoveryCode).toBeUndefined();
    expect(output.customerAddress).toBeUndefined();
  });
});
