import { describe, expect, it } from "vitest";

import {
  ACTIVE_APPLICATION_STATUSES,
  hasActiveApplication,
  isActiveApplicationStatus,
} from "./wholesale";

describe("duplicate wholesale application handling", () => {
  it("treats submitted, in-review and info-required applications as active", () => {
    expect(ACTIVE_APPLICATION_STATUSES).toEqual([
      "SUBMITTED",
      "UNDER_REVIEW",
      "MORE_INFORMATION_REQUIRED",
    ]);
    for (const status of ACTIVE_APPLICATION_STATUSES)
      expect(isActiveApplicationStatus(status)).toBe(true);
  });

  it("allows fresh applications after a final decision", () => {
    expect(isActiveApplicationStatus("APPROVED")).toBe(false);
    expect(isActiveApplicationStatus("REJECTED")).toBe(false);
    expect(hasActiveApplication([{ status: "REJECTED" }, { status: "APPROVED" }])).toBe(
      false,
    );
  });

  it("flags an email with any pending application as duplicate", () => {
    expect(
      hasActiveApplication([{ status: "REJECTED" }, { status: "UNDER_REVIEW" }]),
    ).toBe(true);
  });
});
