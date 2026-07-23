"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/config/site";
import { useCart } from "@/features/cart/store";
import { GIFT_MESSAGE_MAX_LENGTH } from "@/lib/commerce/gift-box";
import { formatMoney } from "@/lib/commerce/money";
import type { GiftBoxPackagingChoice } from "@/types/gift-box";
import { giftOccasionValues } from "@/lib/validation/schemas";
import { addFixedGiftBoxAction } from "@/server/actions/gift-box";
import {
  FormErrorBanner,
  SelectField,
  TextAreaField,
} from "@/components/storefront/form-fields";

export function FixedGiftBoxPurchase({
  locale,
  slug,
  available,
  basePriceCents,
  packaging,
}: {
  locale: AppLocale;
  slug: string;
  available: boolean;
  basePriceCents: number;
  packaging: GiftBoxPackagingChoice[];
}) {
  const t = useTranslations("giftBoxes.detail");
  const tBuilder = useTranslations("giftBoxBuilder");
  const tOccasions = useTranslations("giftBoxes.occasions");
  const addGiftBox = useCart((state) => state.addGiftBox);
  const [message, setMessage] = useState("");
  const [occasion, setOccasion] = useState("");
  // Default to the first (included) option so the total always reflects a real
  // choice rather than starting from an unpriced state.
  const [packagingId, setPackagingId] = useState<string | null>(
    packaging[0]?.id ?? null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selectedPackaging =
    packaging.find((option) => option.id === packagingId) ?? null;
  // Preview only — the server re-prices from the catalogue on submit.
  const previewTotal = basePriceCents + (selectedPackaging?.priceCents ?? 0);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await addFixedGiftBoxAction({
        locale,
        slug,
        giftMessage: message.trim() || undefined,
        occasion: occasion || undefined,
        packagingOptionId: packagingId ?? undefined,
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
      {packaging.length > 0 && (
        <section className="fixed-box-packaging">
          <h3>{tBuilder("packagingTitle")}</h3>
          <p className="field-hint">{tBuilder("packagingLead")}</p>
          <div className="option-cards">
            {packaging.map((option) => (
              <button
                type="button"
                className="option-card"
                key={option.id}
                aria-pressed={packagingId === option.id}
                onClick={() => setPackagingId(option.id)}
              >
                <strong>{option.name}</strong>
                {option.description && <small>{option.description}</small>}
                <small>
                  {option.priceCents === 0
                    ? tBuilder("packagingIncluded")
                    : `+ ${formatMoney(option.priceCents, locale)}`}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}

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

      {selectedPackaging && selectedPackaging.priceCents > 0 && (
        <dl className="fixed-box-total" aria-live="polite">
          <div>
            <dt>{tBuilder("itemsSubtotal")}</dt>
            <dd>{formatMoney(basePriceCents, locale)}</dd>
          </div>
          <div>
            <dt>{selectedPackaging.name}</dt>
            <dd>+ {formatMoney(selectedPackaging.priceCents, locale)}</dd>
          </div>
          <div className="is-total">
            <dt>{tBuilder("totalLine")}</dt>
            <dd>{formatMoney(previewTotal, locale)}</dd>
          </div>
        </dl>
      )}

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
