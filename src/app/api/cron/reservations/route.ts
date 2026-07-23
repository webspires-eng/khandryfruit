import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  if (
    !env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const idempotencyKey = `release-reservations:${new Date().toISOString().slice(0, 16)}`;
  const prior = await db.jobRun.findUnique({ where: { idempotencyKey } });
  if (prior?.status === "COMPLETED")
    return Response.json({ released: 0, duplicate: true });
  const job = await db.jobRun.upsert({
    where: { idempotencyKey },
    create: {
      jobName: "release-reservations",
      idempotencyKey,
      status: "RUNNING",
      correlationId: crypto.randomUUID(),
    },
    update: { status: "RUNNING", error: null },
  });
  try {
    const reservations = await db.stockReservation.findMany({
      where: {
        expiresAt: { lt: new Date() },
        releasedAt: null,
        convertedAt: null,
      },
    });
    let released = 0;
    for (const reservation of reservations) {
      await db.$transaction(async (tx) => {
        const updated = await tx.stockReservation.updateMany({
          where: { id: reservation.id, releasedAt: null, convertedAt: null },
          data: { releasedAt: new Date() },
        });
        if (!updated.count) return;
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: {
            reserved: { decrement: reservation.quantity },
            version: { increment: 1 },
            adjustments: {
              create: {
                type: "RELEASE",
                quantity: -reservation.quantity,
                reason: "Checkout reservation expired",
                reference: reservation.orderId,
              },
            },
          },
        });
        await tx.order.updateMany({
          where: { id: reservation.orderId, paymentStatus: "UNPAID" },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        released += 1;
      });
    }
    await db.jobRun.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return Response.json({ released });
  } catch (error) {
    await db.jobRun.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Unknown error",
      },
    });
    logger.error("background_job_failed", {
      job: "release-reservations",
      correlationId: job.correlationId,
    });
    return Response.json({ error: "Job failed" }, { status: 500 });
  }
}

export const GET = POST;
