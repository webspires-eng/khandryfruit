"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The Stripe webhook is what marks an order paid, and it usually lands a
 * second or two after the customer returns. Rather than showing a stale
 * "being confirmed" state until a manual reload, poll the server component a
 * handful of times and then stop, so an genuinely stuck payment does not
 * refresh forever.
 */
export function PendingPaymentRefresh({
  attempts = 10,
}: {
  attempts?: number;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(attempts);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => {
      setRemaining((count) => count - 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(timer);
  }, [remaining, router]);

  return null;
}
