import { describe, expect, it } from "vitest";
import {
  expectsPayment,
  fulfilmentStepIndex,
  isRecommendedTransition,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  orderTransitions,
  PAYMENT_STATUS_LABELS,
  type DomainOrderStatus,
} from "./order-state";

describe("recommended path", () => {
  it("walks the happy path from pending to completed", () => {
    const path: DomainOrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
    ];
    for (let i = 0; i < path.length - 1; i += 1)
      expect(isRecommendedTransition(path[i], path[i + 1])).toBe(true);
  });

  it("flags out-of-sequence corrections without forbidding them", () => {
    // Staff may still make these moves; they are logged as corrections.
    for (const [from, to] of [
      ["PENDING", "DELIVERED"],
      ["CONFIRMED", "SHIPPED"],
      ["DELIVERED", "PENDING"],
      ["COMPLETED", "PROCESSING"],
      ["CANCELLED", "CONFIRMED"],
    ] as const)
      expect(isRecommendedTransition(from, to), from + "->" + to).toBe(false);
  });

  it("treats completed and cancelled as having no expected next step", () => {
    expect(orderTransitions.COMPLETED).toEqual([]);
    expect(orderTransitions.CANCELLED).toEqual([]);
  });

  it("carries no money state on the fulfilment axis", () => {
    for (const status of ORDER_STATUSES)
      expect(status).not.toMatch(/PAID|REFUND|PAYMENT/);
  });
});

describe("payment expectation", () => {
  it("marks the statuses that imply the goods were handled", () => {
    for (const status of [
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
    ] as const)
      expect(expectsPayment(status), status).toBe(true);
  });

  it("does not expect payment before the goods move", () => {
    for (const status of ["PENDING", "CONFIRMED", "CANCELLED"] as const)
      expect(expectsPayment(status), status).toBe(false);
  });
});

describe("labels and progress", () => {
  it("labels every status on both axes", () => {
    for (const status of ORDER_STATUSES)
      expect(ORDER_STATUS_LABELS[status], status).toBeTruthy();
    for (const status of ["UNPAID", "PAID", "REFUNDED"] as const)
      expect(PAYMENT_STATUS_LABELS[status], status).toBeTruthy();
  });

  it("places each status on the progress rail", () => {
    expect(fulfilmentStepIndex("PENDING")).toBe(0);
    expect(fulfilmentStepIndex("CONFIRMED")).toBe(1);
    expect(fulfilmentStepIndex("SHIPPED")).toBe(3);
    expect(fulfilmentStepIndex("COMPLETED")).toBe(5);
    // Cancelled is off the rail entirely and must not report progress.
    expect(fulfilmentStepIndex("CANCELLED")).toBe(0);
  });
});
