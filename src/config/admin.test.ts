import { describe, expect, it } from "vitest";
import { canAccessAdmin, requiresTwoFactor, visibleAdminAreas } from "./admin";

describe("admin role permissions", () => {
  it("denies customer roles", () => {
    expect(visibleAdminAreas("CUSTOMER")).toEqual([]);
    expect(visibleAdminAreas("WHOLESALE_CUSTOMER")).toEqual([]);
  });

  it("limits editors and order managers", () => {
    expect(canAccessAdmin("CONTENT_EDITOR", "content")).toBe(true);
    expect(canAccessAdmin("CONTENT_EDITOR", "orders")).toBe(false);
    expect(canAccessAdmin("ORDER_MANAGER", "orders")).toBe(true);
    expect(canAccessAdmin("ORDER_MANAGER", "products")).toBe(false);
  });

  it("allows business settings but reserves health and audit data", () => {
    expect(canAccessAdmin("ADMIN", "settings")).toBe(true);
    expect(canAccessAdmin("ADMIN", "audit-logs")).toBe(false);
    expect(canAccessAdmin("ADMIN", "system-health")).toBe(false);
    expect(canAccessAdmin("SUPER_ADMIN", "settings")).toBe(true);
    expect(visibleAdminAreas("SUPER_ADMIN")).toHaveLength(21);
  });
});

describe("two-factor requirement", () => {
  it("requires a second factor for every role that can change data", () => {
    // ORDER_MANAGER issues refunds and was previously exempt.
    expect(requiresTwoFactor("ORDER_MANAGER")).toBe(true);
    expect(requiresTwoFactor("CONTENT_EDITOR")).toBe(true);
    expect(requiresTwoFactor("ADMIN")).toBe(true);
    expect(requiresTwoFactor("SUPER_ADMIN")).toBe(true);
  });

  it("does not require it of roles with no admin access", () => {
    expect(requiresTwoFactor("CUSTOMER")).toBe(false);
    expect(requiresTwoFactor("WHOLESALE_CUSTOMER")).toBe(false);
    expect(requiresTwoFactor("NOT_A_ROLE")).toBe(false);
  });
});
