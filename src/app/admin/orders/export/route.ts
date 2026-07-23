import { orderCustomerName } from "@/lib/commerce/address";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/server/policies/authorization";

const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  await requireAdmin("orders");
  const orders = await db.order.findMany({
    include: {
      user: true,
      addresses: { where: { type: "SHIPPING" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  const rows = [
    [
      "Order",
      "Customer",
      "Email",
      "Phone",
      "Created",
      "Payment",
      "Status",
      "Company",
      "Address line 1",
      "Address line 2",
      "Postcode",
      "City",
      "Country",
      "Total cents",
    ],
    ...orders.map((o) => {
      const shipping = o.addresses[0];
      return [
        o.number,
        orderCustomerName(o),
        o.email,
        shipping?.phone ?? "",
        o.createdAt.toISOString(),
        o.paymentStatus,
        o.status,
        shipping?.company ?? "",
        shipping?.line1 ?? "",
        shipping?.line2 ?? "",
        shipping?.postalCode ?? "",
        shipping?.city ?? "",
        shipping?.countryCode ?? "",
        o.totalCents,
      ];
    }),
  ];
  return new Response(rows.map((row) => row.map(csv).join(",")).join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="orders.csv"',
    },
  });
}
