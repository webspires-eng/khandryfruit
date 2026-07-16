import { describe, expect, it } from "vitest";

import {
  buildContactAdminEmail,
  buildContactReceivedEmail,
  buildWholesaleAdminEmail,
  buildWholesaleReceivedEmail,
} from "./templates";

describe("wholesale emails", () => {
  it("localises the applicant confirmation", () => {
    const german = buildWholesaleReceivedEmail({
      locale: "de",
      to: "einkauf@example.com",
      contactName: "Alex",
      companyName: "Feinkost GmbH",
      reference: "ABC12345",
    });
    expect(german.locale).toBe("de");
    expect(german.subject).toContain("Großhandelsbewerbung");
    expect(german.text).toContain("Feinkost GmbH");
    expect(german.text).toContain("ABC12345");

    const english = buildWholesaleReceivedEmail({
      locale: "en",
      to: "einkauf@example.com",
      contactName: "Alex",
      companyName: "Feinkost GmbH",
      reference: "ABC12345",
    });
    expect(english.subject).toContain("wholesale application");
    // The confirmation must never promise approval.
    expect(english.text).not.toMatch(/approved|guarantee/i);
  });

  it("notifies the admin with the application summary", () => {
    const email = buildWholesaleAdminEmail({
      to: "orders@example.com",
      companyName: "Feinkost GmbH",
      contactName: "Alex",
      email: "einkauf@example.com",
      phone: "+4917612345678",
      businessType: "GROCERY_RETAILER",
      city: "Duisburg",
      countryCode: "DE",
      monthlyOrderVolume: "FROM_500_TO_1500",
      applicationId: "app_123",
    });
    expect(email.to).toBe("orders@example.com");
    expect(email.subject).toContain("Feinkost GmbH");
    expect(email.text).toContain("app_123");
  });

  it("escapes HTML in user-provided values", () => {
    const email = buildWholesaleReceivedEmail({
      locale: "en",
      to: "x@example.com",
      contactName: "<script>alert(1)</script>",
      companyName: "Safe & Sound",
      reference: "REF",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

describe("contact emails", () => {
  it("localises the customer acknowledgement", () => {
    const german = buildContactReceivedEmail({
      locale: "de",
      to: "sam@example.com",
      name: "Sam",
      type: "ORDER",
      subject: "Lieferdatum",
    });
    expect(german.subject).toContain("Anfrage");
    expect(german.text).toContain("Bestehende Bestellung");

    const english = buildContactReceivedEmail({
      locale: "en",
      to: "sam@example.com",
      name: "Sam",
      type: "ORDER",
      subject: "Delivery date",
    });
    expect(english.text).toContain("Existing order");
  });

  it("notifies the admin without leaking internal notes", () => {
    const email = buildContactAdminEmail({
      to: "orders@example.com",
      name: "Sam",
      email: "sam@example.com",
      type: "RETURNS",
      subject: "Return request",
      orderNumber: "KDF-2026-AB12",
      enquiryId: "enq_1",
    });
    expect(email.subject).toContain("Return request");
    expect(email.text).toContain("KDF-2026-AB12");
    expect(email.text).not.toMatch(/internal/i);
  });
});
