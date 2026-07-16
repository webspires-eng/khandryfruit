"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import type { AppLocale } from "@/config/site";
import { useCart } from "@/features/cart/store";
import { formatMoney } from "@/lib/commerce/money";
import { localiseCheckoutError } from "@/lib/i18n/content";

export function CheckoutReview({ locale }: { locale: AppLocale }) {
  const items = useCart((state) => state.items);
  const giftBoxes = useCart((state) => state.giftBoxes);
  const de = locale === "de";
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const startCheckout = async () => {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          email,
          countryCode: "DE",
          shippingMethodId: "de-standard",
          legalAccepted: accepted,
          lines: items.map(({ variantId, quantity }) => ({
            variantId,
            quantity,
          })),
          giftBoxes: giftBoxes.map(({ configurationId, quantity }) => ({
            configurationId,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: { url: string };
        error?: { code: string };
      };
      if (!response.ok || !result.success || !result.data)
        throw new Error(localiseCheckoutError(locale, result.error?.code));
      window.location.assign(result.data.url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : localiseCheckoutError(locale, "CHECKOUT_FAILED"),
      );
      setPending(false);
    }
  };
  if (!items.length && !giftBoxes.length)
    return (
      <div className="empty-state">
        <h2>{de ? "Keine Artikel zur Kasse" : "No items to check out"}</h2>
        <a href={`/${locale}/shop`} className="button">
          {de ? "Zum Shop" : "Browse shop"}
        </a>
      </div>
    );
  return (
    <div className="checkout-grid">
      <section className="checkout-form">
        <h2>{de ? "Kontaktdaten" : "Contact details"}</h2>
        <label htmlFor="checkout-email">E-Mail</label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <h2>{de ? "Versand" : "Shipping"}</h2>
        <div className="selected-shipping">
          <span>
            <strong>{de ? "Standard Deutschland" : "Germany standard"}</strong>
            <small>
              {de
                ? "Ziel 3–4 Werktage, noch nicht als Versandversprechen freigegeben"
                : "3–4 working day target, not yet enabled as a shipping promise"}
            </small>
          </span>
          <b>{de ? "berechnet" : "calculated"}</b>
        </div>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            {de
              ? "Ich akzeptiere die AGB und bestätige, die Widerrufsbelehrung gelesen zu haben."
              : "I accept the terms and confirm that I have read the withdrawal information."}
          </span>
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button
          className="button full"
          onClick={startCheckout}
          disabled={pending || !accepted || !email}
        >
          <LockKeyhole size={18} />{" "}
          {pending
            ? de
              ? "Wird geprüft…"
              : "Validating…"
            : de
              ? "Sicher mit Stripe bezahlen"
              : "Pay securely with Stripe"}
        </button>
      </section>
      <aside className="order-summary">
        <h2>{de ? "Ihre Bestellung" : "Your order"}</h2>
        {items.map((item) => (
          <div className="review-line" key={item.variantId}>
            <span>
              {item.quantity}× {item.name}
              <small>{item.weightGrams} g</small>
            </span>
            <strong>
              {formatMoney(item.unitPriceCents * item.quantity, locale)}
            </strong>
          </div>
        ))}
        {giftBoxes.map((box) => (
          <div className="review-line" key={box.configurationId}>
            <span>
              {box.quantity}× {box.name}
              <small>
                {de ? "Geschenkbox" : "Gift box"} · {box.sizeName}
              </small>
            </span>
            <strong>
              {formatMoney(box.totalCents * box.quantity, locale)}
            </strong>
          </div>
        ))}
        <p className="muted">
          {de
            ? "Der endgültige Gesamtbetrag erscheint nach der serverseitigen Prüfung."
            : "The final total appears after secure server validation."}
        </p>
      </aside>
    </div>
  );
}
