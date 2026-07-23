import { describe, expect, it } from "vitest";

import {
  buildContactAdminEmail,
  buildContactReceivedEmail,
  buildNewOrderAdminEmail,
  buildOrderReceiptEmail,
  buildOrderStatusEmail,
  buildWholesaleAdminEmail,
  buildWholesaleReceivedEmail,
  hasOrderStatusEmail,
} from "./templates";

const EMAILED_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

describe("order status emails", () => {
  it("localises the status notification in both languages", () => {
    for (const locale of ["de", "en"] as const) {
      const mail = buildOrderStatusEmail({
        locale,
        to: "kunde@example.com",
        customerName: "Alex Beispiel",
        orderNumber: "KDF-2026-ABCD1234",
        status: "SHIPPED",
        total: "€14.98",
      });
      expect(mail.locale).toBe(locale);
      expect(mail.subject).toContain("KDF-2026-ABCD1234");
      expect(mail.text).toContain("Alex Beispiel");
      expect(mail.text).toContain("€14.98");
      // Never leave an unresolved translation key in customer-facing copy.
      expect(mail.subject).not.toContain("emails.orderStatus");
      expect(mail.text).not.toContain("emails.orderStatus");
      expect(mail.html).not.toContain("emails.orderStatus");
    }
  });

  it("covers every status the admin can transition to", () => {
    for (const status of EMAILED_STATUSES)
      for (const locale of ["de", "en"] as const) {
        expect(hasOrderStatusEmail(locale, status)).toBe(true);
        const mail = buildOrderStatusEmail({
          locale,
          to: "kunde@example.com",
          customerName: "Alex",
          orderNumber: "KDF-1",
          status,
        });
        expect(mail.text).not.toContain("emails.orderStatus");
        expect(mail.subject).not.toContain("emails.orderStatus");
      }
  });

  it("appends tracking details when a shipment exists", () => {
    const mail = buildOrderStatusEmail({
      locale: "en",
      to: "kunde@example.com",
      customerName: "Alex",
      orderNumber: "KDF-1",
      status: "SHIPPED",
      tracking: {
        provider: "DHL",
        number: "00340434",
        url: "https://track.example/00340434",
      },
    });
    expect(mail.text).toContain("DHL");
    expect(mail.text).toContain("00340434");
    expect(mail.text).toContain("https://track.example/00340434");
  });

  it("omits tracking lines when no shipment is attached", () => {
    const mail = buildOrderStatusEmail({
      locale: "en",
      to: "kunde@example.com",
      customerName: "Alex",
      orderNumber: "KDF-1",
      status: "PAID",
    });
    expect(mail.text).not.toContain("Tracking number");
  });

  it("reports unknown statuses as having no customer copy", () => {
    expect(hasOrderStatusEmail("en", "PENDING")).toBe(false);
    expect(hasOrderStatusEmail("de", "NOT_A_STATUS")).toBe(false);
  });

  it("escapes HTML in customer-supplied names", () => {
    const mail = buildOrderStatusEmail({
      locale: "en",
      to: "kunde@example.com",
      customerName: "<script>alert(1)</script>",
      orderNumber: "KDF-1",
      status: "PAID",
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

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

const LINES = [
  {
    name: "Dried Apricots",
    detail: "SKU-1 · 500 g",
    quantity: 2,
    total: "€19.98",
  },
  {
    name: "Classic Selection",
    detail: "Medium · Kraft",
    quantity: 1,
    total: "€38.96",
  },
];
const TOTALS = {
  subtotal: "€58.94",
  shipping: "€4.99",
  tax: "€4.19",
  total: "€63.93",
};
const ADDRESS = ["Alex Beispiel", "Musterstraße 12", "47051 Duisburg", "DE"];

describe("order receipt email", () => {
  it("lists every line and total in both languages", () => {
    for (const locale of ["de", "en"] as const) {
      const mail = buildOrderReceiptEmail({
        locale,
        to: "kunde@example.com",
        customerName: "Alex Beispiel",
        orderNumber: "#0042",
        orderDate: "2026-07-23T10:00:00.000Z",
        lines: LINES,
        totals: TOTALS,
        deliveryAddress: ADDRESS,
      });
      expect(mail.subject).toContain("#0042");
      for (const line of LINES) {
        expect(mail.text).toContain(line.name);
        expect(mail.text).toContain(line.total);
        expect(mail.html).toContain(line.name);
      }
      expect(mail.text).toContain(TOTALS.total);
      expect(mail.text).toContain("Musterstraße 12");
      // No unresolved translation keys may reach a customer.
      expect(mail.subject).not.toContain("emails.order");
      expect(mail.text).not.toContain("emails.order");
      expect(mail.html).not.toContain("emails.order");
    }
  });

  it("shows a discount row only when there is one", () => {
    const without = buildOrderReceiptEmail({
      locale: "en",
      to: "a@b.c",
      customerName: "A",
      orderNumber: "#1",
      orderDate: "",
      lines: LINES,
      totals: TOTALS,
      deliveryAddress: ADDRESS,
    });
    expect(without.text).not.toContain("Discount");
    const with_ = buildOrderReceiptEmail({
      locale: "en",
      to: "a@b.c",
      customerName: "A",
      orderNumber: "#1",
      orderDate: "",
      lines: LINES,
      totals: { ...TOTALS, discount: "€5.00" },
      deliveryAddress: ADDRESS,
    });
    expect(with_.text).toContain("Discount");
    expect(with_.text).toContain("€5.00");
  });

  it("escapes product names so a rogue name cannot inject markup", () => {
    const mail = buildOrderReceiptEmail({
      locale: "en",
      to: "a@b.c",
      customerName: "A",
      orderNumber: "#1",
      orderDate: "",
      lines: [{ name: "<script>alert(1)</script>", quantity: 1, total: "€1" }],
      totals: TOTALS,
      deliveryAddress: ADDRESS,
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("new order admin email", () => {
  it("carries the customer, totals and a link into the admin", () => {
    const mail = buildNewOrderAdminEmail({
      to: "orders@shop.test",
      orderNumber: "#0042",
      customerName: "Alex Beispiel",
      customerEmail: "kunde@example.com",
      lines: LINES,
      totals: TOTALS,
      deliveryAddress: ADDRESS,
      adminUrl: "https://shop.test/admin/orders/0042",
    });
    expect(mail.to).toBe("orders@shop.test");
    expect(mail.subject).toContain("#0042");
    expect(mail.subject).toContain("€63.93");
    expect(mail.text).toContain("kunde@example.com");
    expect(mail.text).toContain("https://shop.test/admin/orders/0042");
    expect(mail.text).toContain("Dried Apricots");
    expect(mail.text).not.toContain("emails.order");
  });
});
