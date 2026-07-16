"use client";

import { ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { useCart } from "@/features/cart/store";
import { Link } from "@/i18n/navigation";

export function CartLink() {
  const count = useCart(
    (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0) +
      state.giftBoxes.reduce((sum, line) => sum + line.quantity, 0),
  );
  const params = useParams<{ locale: string }>();
  return (
    <Link
      href="/cart"
      locale={params.locale === "en" ? "en" : "de"}
      className="icon-link"
      aria-label={`${params.locale === "en" ? "Cart" : "Warenkorb"}, ${count}`}
    >
      <ShoppingBag aria-hidden="true" size={20} />
      {count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
