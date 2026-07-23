import { describe, expect, it } from "vitest";

import {
  formatAddressLines,
  formatAddressOneLine,
  formatRecipientName,
  orderCustomerName,
} from "./address";

const address = {
  firstName: "Alex",
  lastName: "Beispiel",
  company: null,
  line1: "Musterstraße 12",
  line2: null,
  postalCode: "47051",
  city: "Duisburg",
  countryCode: "DE",
  phone: null,
};

describe("postal address formatting", () => {
  it("builds label lines and skips empty optional parts", () => {
    expect(formatAddressLines(address)).toEqual([
      "Alex Beispiel",
      "Musterstraße 12",
      "47051 Duisburg",
      "DE",
    ]);
  });

  it("includes company and second address line when present", () => {
    expect(
      formatAddressLines({
        ...address,
        company: "Feinkost Beispiel GmbH",
        line2: "Hinterhof, 2. OG",
      }),
    ).toEqual([
      "Alex Beispiel",
      "Feinkost Beispiel GmbH",
      "Musterstraße 12",
      "Hinterhof, 2. OG",
      "47051 Duisburg",
      "DE",
    ]);
  });

  it("drops whitespace-only optional parts", () => {
    expect(
      formatAddressLines({ ...address, company: "   ", line2: "" }),
    ).toEqual(["Alex Beispiel", "Musterstraße 12", "47051 Duisburg", "DE"]);
  });

  it("joins to a single line for CSV export", () => {
    expect(formatAddressOneLine(address)).toBe(
      "Alex Beispiel, Musterstraße 12, 47051 Duisburg, DE",
    );
  });

  it("returns an empty recipient name for a missing address", () => {
    expect(formatRecipientName(null)).toBe("");
    expect(formatRecipientName(address)).toBe("Alex Beispiel");
  });
});

describe("order customer name", () => {
  it("prefers the signed-in account name", () => {
    expect(
      orderCustomerName({ user: { name: "Sam Sample" }, addresses: [address] }),
    ).toBe("Sam Sample");
  });

  it("falls back to the shipping recipient for guest checkouts", () => {
    expect(orderCustomerName({ user: null, addresses: [address] })).toBe(
      "Alex Beispiel",
    );
  });

  it("ignores a blank account name", () => {
    expect(
      orderCustomerName({ user: { name: "  " }, addresses: [address] }),
    ).toBe("Alex Beispiel");
  });

  it("falls back to a generic label when nothing is known", () => {
    expect(orderCustomerName({ user: null, addresses: [] })).toBe("Guest");
    expect(orderCustomerName({})).toBe("Guest");
  });
});
