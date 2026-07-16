"use client";

import { Gift, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/config/site";
import { localizedPath } from "@/config/routes";
import { useCart } from "@/features/cart/store";
import { formatMoney } from "@/lib/commerce/money";

export function CartPageClient({ locale }: { locale: AppLocale }) {
  const { items, giftBoxes, update, remove, removeGiftBox } = useCart();
  const tGift = useTranslations("giftBoxCart");
  const de = locale === "de";
  const subtotal =
    items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0) +
    giftBoxes.reduce((sum, line) => sum + line.totalCents * line.quantity, 0);
  if (!items.length && !giftBoxes.length)
    return (
      <div className="empty-state large">
        <ShoppingBag size={42} />
        <h1>{de ? "Ihr Warenkorb ist leer" : "Your cart is empty"}</h1>
        <p>
          {de
            ? "Entdecken Sie unsere Auswahl und fügen Sie eine Variante hinzu."
            : "Explore the selection and add a product variant."}
        </p>
        <a className="button" href={`/${locale}/shop`}>
          {de ? "Zum Shop" : "Browse shop"}
        </a>
      </div>
    );
  return (
    <div className="cart-layout">
      <section
        className="cart-lines"
        aria-label={de ? "Warenkorbartikel" : "Cart items"}
      >
        {items.map((item) => (
          <article className="cart-line" key={item.variantId}>
            <div className="cart-thumb">
              <span />
            </div>
            <div>
              <h2>{item.name}</h2>
              <p>
                {item.weightGrams >= 1000
                  ? `${item.weightGrams / 1000} kg`
                  : `${item.weightGrams} g`}
              </p>
              <strong>{formatMoney(item.unitPriceCents, locale)}</strong>
            </div>
            <div className="quantity">
              <button
                onClick={() => update(item.variantId, item.quantity - 1)}
                aria-label={de ? "Menge verringern" : "Decrease quantity"}
              >
                <Minus size={15} />
              </button>
              <output>{item.quantity}</output>
              <button
                onClick={() => update(item.variantId, item.quantity + 1)}
                aria-label={de ? "Menge erhöhen" : "Increase quantity"}
              >
                <Plus size={15} />
              </button>
            </div>
            <strong className="line-total">
              {formatMoney(item.unitPriceCents * item.quantity, locale)}
            </strong>
            <button
              className="remove-button"
              onClick={() => remove(item.variantId)}
              aria-label={`${item.name} ${de ? "entfernen" : "remove"}`}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
        {giftBoxes.map((line) => (
          <article className="cart-line" key={line.configurationId}>
            <div className="cart-thumb">
              <Gift size={22} aria-hidden="true" />
            </div>
            <div>
              <h2>
                {tGift("label")} · {line.name}
              </h2>
              <div className="cart-line-meta">
                <span>
                  {tGift("size")}: {line.sizeName}
                </span>
                {line.packagingName && (
                  <span>
                    {tGift("packaging")}: {line.packagingName}
                  </span>
                )}
                {line.giftMessage && (
                  <span>
                    {tGift("message")}: “{line.giftMessage}”
                  </span>
                )}
              </div>
              <p>{tGift("contents")}:</p>
              <ul className="cart-gift-contents">
                {line.items.map((item, index) => (
                  <li key={`${line.configurationId}-${index}`}>
                    {item.quantity} × {item.name} (
                    {item.weightGrams >= 1000
                      ? `${item.weightGrams / 1000} kg`
                      : `${item.weightGrams} g`}
                    )
                  </li>
                ))}
              </ul>
              <div className="cart-line-actions">
                <a
                  className="text-link"
                  href={`/${locale}${localizedPath("giftBoxBuilder", locale)}?edit=${line.configurationId}`}
                >
                  {tGift("edit")}
                </a>
              </div>
            </div>
            <strong className="line-total">
              {formatMoney(line.totalCents * line.quantity, locale)}
            </strong>
            <button
              className="remove-button"
              onClick={() => removeGiftBox(line.configurationId)}
              aria-label={`${line.name} ${tGift("remove")}`}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </section>
      <aside className="order-summary">
        <h2>{de ? "Zusammenfassung" : "Summary"}</h2>
        <dl>
          <div>
            <dt>{de ? "Zwischensumme" : "Subtotal"}</dt>
            <dd>{formatMoney(subtotal, locale)}</dd>
          </div>
          <div>
            <dt>{de ? "Versand" : "Shipping"}</dt>
            <dd>{de ? "Im nächsten Schritt" : "Next step"}</dd>
          </div>
          <div>
            <dt>{de ? "Enthaltene MwSt." : "Included VAT"}</dt>
            <dd>
              {de ? "Wird serverseitig berechnet" : "Calculated server-side"}
            </dd>
          </div>
        </dl>
        <div className="summary-total">
          <span>{de ? "Vorläufig gesamt" : "Estimated total"}</span>
          <strong>{formatMoney(subtotal, locale)}</strong>
        </div>
        <a className="button full" href={`/${locale}/checkout`}>
          {de ? "Weiter zur Kasse" : "Continue to checkout"}
        </a>
        <small>
          {de
            ? "Alle Preise, Rabatte, Versandkosten und Bestände werden vor Stripe erneut auf dem Server geprüft."
            : "All prices, discounts, shipping and stock are revalidated on the server before Stripe."}
        </small>
      </aside>
    </div>
  );
}
