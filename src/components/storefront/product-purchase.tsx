"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/config/site";
import { useCart } from "@/features/cart/store";
import { formatMoney, unitPricePerKg } from "@/lib/commerce/money";
import type { CatalogueProduct } from "@/types/commerce";

export function ProductPurchase({
  product,
  locale,
}: {
  product: CatalogueProduct;
  locale: AppLocale;
}) {
  const t = useTranslations("product");
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((state) => state.add);
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return null;
  const addItem = () => {
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        weightGrams: variant.weightGrams,
        unitPriceCents: variant.priceCents,
        image: product.image,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div className="purchase-panel">
      {product.status === "DRAFT" && (
        <div className="warning-box">
          <strong>{t("developmentProduct")}</strong>
          <span>{t("draftNotice")}</span>
        </div>
      )}
      <div className="purchase-price">
        <strong>{formatMoney(variant.priceCents, locale)}</strong>
        <span>
          {formatMoney(
            unitPricePerKg(variant.priceCents, variant.weightGrams),
            locale,
          )}
          /kg
        </span>
      </div>
      <p className="muted">{t("vatShipping")}</p>
      <fieldset>
        <legend>{t("weight")}</legend>
        <div className="variant-grid">
          {product.variants.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === variantId ? "selected" : ""}
              onClick={() => setVariantId(item.id)}
            >
              {item.weightGrams >= 1000
                ? `${item.weightGrams / 1000} kg`
                : `${item.weightGrams} g`}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="stock-line">
        <Check size={17} />{" "}
        {variant.available > 0 ? t("available") : t("unavailable")}
      </div>
      <div className="purchase-actions">
        <div className="quantity">
          <button
            aria-label={t("decreaseQuantity")}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus size={16} />
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            aria-label={t("increaseQuantity")}
            onClick={() => setQuantity(Math.min(20, quantity + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          className="button add-button"
          onClick={addItem}
          disabled={variant.available < quantity}
        >
          {added ? (
            <>
              <Check size={18} /> {t("added")}
            </>
          ) : (
            <>
              <ShoppingBag size={18} /> {t("addToCart")}
            </>
          )}
        </button>
      </div>
      <div className="trust-note">{t("securePayment")}</div>
    </div>
  );
}
