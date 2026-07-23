import { db } from "@/lib/db/client";
import { requireAdmin } from "@/server/policies/authorization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin("customers");
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      disabled: true,
      marketingConsentAt: true,
      marketingConsentSource: true,
      consentVersion: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      addresses: true,
      orders: {
        select: {
          number: true,
          email: true,
          status: true,
          paymentStatus: true,
          currency: true,
          subtotalCents: true,
          discountCents: true,
          shippingCents: true,
          taxCents: true,
          totalCents: true,
          createdAt: true,
          // Guest-checkout delivery details are personal data too, so a
          // subject-access export has to include them.
          addresses: true,
        },
      },
      wholesaleApplications: true,
    },
  });
  if (!user)
    return Response.json({ error: "Customer not found" }, { status: 404 });
  return Response.json(user, {
    headers: {
      "content-disposition": `attachment; filename="customer-${user.id}.json"`,
    },
  });
}
