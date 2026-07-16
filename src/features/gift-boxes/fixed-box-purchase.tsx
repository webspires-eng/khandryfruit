"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/config/site";
import { useCart } from "@/features/cart/store";
import { GIFT_MESSAGE_MAX_LENGTH } from "@/lib/commerce/gift-box";
import { giftOccasionValues } from "@/lib/validation/schemas";
import { addFixedGiftBoxAction } from "@/server/actions/gift-box";
import { FormErrorBanner, SelectField, TextAreaField } from "@/components/storefront/form-fields";

export function FixedGiftBoxPurchase({
  locale,
  slug,
  available,
}: {
  locale: AppLocale;
  slug: string;
  available: boolean;
}) {
  const t = useTranslations("giftBoxes.detail");
  const tBuilder = useTranslations("giftBoxBuilder");
  const tOccasions = useTranslations("giftBoxes.occasions");
  const addGiftBox = useCart((state) => state.addGiftBox);
  const [message, setMessage] = useState("");
  const [occasion, setOccasion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await addFixedGiftBoxAction({
        locale,
        slug,
        giftMessage: message.trim() || undefined,
        occasion: occasion || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      addGiftBox(result.data);
      setAdded(true);
    } finally {
      setPending(false);
    }
  };

  if (added)
    return (
      <div className="success-panel" role="status">
        <p>{tBuilder("added")}</p>
        <div className="content-actions">
          <a className="button" href={`/${locale}/cart`}>
            {tBuilder("goToCart")}
          </a>
        </div>
      </div>
    );

  return (
    <div>
      <SelectField
        label={tBuilder("occasionLabel")}
        name="occasion"
        placeholder={tBuilder("occasionNone")}
        options={giftOccasionValues.map((value) => ({
          value,
          label: tOccasions(value),
        }))}
        value={occasion}
        onChange={(event) => setOccasion(event.target.value)}
      />
      <TextAreaField
        label={tBuilder("messageLabel")}
        name="giftMessage"
        hint={tBuilder("messageOptional")}
        placeholder={tBuilder("messagePlaceholder")}
        maxLength={GIFT_MESSAGE_MAX_LENGTH}
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <span className="char-counter" aria-live="polite">
        {tBuilder("charactersLeft", {
          count: GIFT_MESSAGE_MAX_LENGTH - message.length,
        })}
      </span>
      <FormErrorBanner message={error} />
      <div className="purchase-actions">
        <button
          className="button full"
          onClick={submit}
          disabled={pending || !available}
        >
          {pending ? t("adding") : available ? t("addToCart") : t("outOfStock")}
        </button>
      </div>
      <p className="trust-note">{tBuilder("reviewLead")}</p>
    </div>
  );
}
