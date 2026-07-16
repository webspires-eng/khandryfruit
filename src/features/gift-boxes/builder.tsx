"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  FormErrorBanner,
  SelectField,
  TextAreaField,
} from "@/components/storefront/form-fields";
import type { AppLocale } from "@/config/site";
import { useCart } from "@/features/cart/store";
import { GIFT_MESSAGE_MAX_LENGTH } from "@/lib/commerce/gift-box";
import { formatMoney } from "@/lib/commerce/money";
import { giftOccasionValues } from "@/lib/validation/schemas";
import { addCustomGiftBoxAction } from "@/server/actions/gift-box";
import type {
  GiftBoxBuilderProduct,
  GiftBoxBuilderTemplate,
  GiftBoxPackagingChoice,
} from "@/types/gift-box";

export type BuilderInitialState = {
  replaceConfigurationId: string | null;
  giftBoxId: string;
  packagingOptionId: string | null;
  occasion: string | null;
  giftMessage: string;
  items: Array<{ variantId: string; quantity: number }>;
};

export function GiftBoxBuilder({
  locale,
  templates,
  products,
  packaging,
  initial,
}: {
  locale: AppLocale;
  templates: GiftBoxBuilderTemplate[];
  products: GiftBoxBuilderProduct[];
  packaging: GiftBoxPackagingChoice[];
  initial: BuilderInitialState | null;
}) {
  const t = useTranslations("giftBoxBuilder");
  const tOccasions = useTranslations("giftBoxes.occasions");
  const tCommon = useTranslations("common");
  const addGiftBox = useCart((state) => state.addGiftBox);
  const removeGiftBox = useCart((state) => state.removeGiftBox);

  const [templateId, setTemplateId] = useState<string | null>(
    initial?.giftBoxId ?? null,
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (initial?.items ?? []).map((item) => [item.variantId, item.quantity]),
    ),
  );
  const [packagingId, setPackagingId] = useState<string | null>(
    initial?.packagingOptionId ?? packaging[0]?.id ?? null,
  );
  const [occasion, setOccasion] = useState(initial?.occasion ?? "");
  const [message, setMessage] = useState(initial?.giftMessage ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const template = templates.find((entry) => entry.id === templateId) ?? null;

  const variantIndex = useMemo(() => {
    const map = new Map<
      string,
      {
        product: GiftBoxBuilderProduct;
        variant: GiftBoxBuilderProduct["variants"][number];
      }
    >();
    for (const product of products)
      for (const variant of product.variants)
        map.set(variant.variantId, { product, variant });
    return map;
  }, [products]);

  const selections = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([variantId, quantity]) => ({ variantId, quantity })),
    [quantities],
  );
  const totalQuantity = selections.reduce((sum, entry) => sum + entry.quantity, 0);
  const usedSlots = selections.reduce((sum, entry) => {
    const record = variantIndex.get(entry.variantId);
    return sum + entry.quantity * (record?.variant.capacityUnits ?? 1);
  }, 0);
  const itemsTotal = selections.reduce((sum, entry) => {
    const record = variantIndex.get(entry.variantId);
    return sum + entry.quantity * (record?.variant.priceCents ?? 0);
  }, 0);
  const selectedPackaging =
    packaging.find((entry) => entry.id === packagingId) ?? null;
  const estimatedTotal =
    itemsTotal +
    (template?.boxChargeCents ?? 0) +
    (selectedPackaging?.priceCents ?? 0);

  const belowMin = template ? totalQuantity < template.minItems : true;
  const aboveMax = template ? totalQuantity > template.maxItems : false;
  const overCapacity = template ? usedSlots > template.capacityUnits : false;
  const canSubmit =
    Boolean(template) && !belowMin && !aboveMax && !overCapacity && !pending;

  const setQuantity = (variantId: string, quantity: number) => {
    setQuantities((state) => ({
      ...state,
      [variantId]: Math.max(0, Math.min(10, quantity)),
    }));
  };

  const submit = async () => {
    if (!template) {
      setError(t("validation.selectSize"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await addCustomGiftBoxAction({
        locale,
        giftBoxId: template.id,
        packagingOptionId: packagingId ?? undefined,
        occasion: occasion || undefined,
        giftMessage: message.trim() || undefined,
        items: selections,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      if (initial?.replaceConfigurationId)
        removeGiftBox(initial.replaceConfigurationId);
      addGiftBox(result.data);
      setAdded(true);
    } finally {
      setPending(false);
    }
  };

  if (added)
    return (
      <div className="success-panel" role="status">
        <h2>{t("added")}</h2>
        <div className="content-actions">
          <a className="button" href={`/${locale}/cart`}>
            {t("goToCart")}
          </a>
        </div>
      </div>
    );

  return (
    <div className="builder-layout">
      <div className="builder-steps">
        <section className="builder-step" aria-labelledby="step-size">
          <h2 id="step-size">{t("sizeTitle")}</h2>
          <p>{t("sizeLead")}</p>
          <div className="option-cards">
            {templates.map((entry) => (
              <button
                type="button"
                className="option-card"
                key={entry.id}
                aria-pressed={templateId === entry.id}
                onClick={() => setTemplateId(entry.id)}
              >
                <strong>{entry.name}</strong>
                <small>{t("capacity", { units: entry.capacityUnits })}</small>
                <small>
                  {t("boxCharge")}: {formatMoney(entry.boxChargeCents, locale)}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="builder-step" aria-labelledby="step-products">
          <h2 id="step-products">{t("productsTitle")}</h2>
          <p>{t("productsLead")}</p>
          {template && (
            <div className="slots-meter">
              <progress
                value={Math.min(usedSlots, template.capacityUnits)}
                max={template.capacityUnits}
              />
              <span aria-live="polite">
                {t("slotsUsed", {
                  used: usedSlots,
                  total: template.capacityUnits,
                })}
              </span>
            </div>
          )}
          {template && (
            <p className="field-hint">
              {t("minHint", { min: template.minItems })}{" "}
              {t("maxHint", { max: template.maxItems })}
            </p>
          )}
          <div className="builder-product-list">
            {products.flatMap((product) =>
              product.variants.map((variant) => {
                const quantity = quantities[variant.variantId] ?? 0;
                const outOfStock = variant.available < 1;
                const slotsLeft = template
                  ? template.capacityUnits - usedSlots
                  : 0;
                const addDisabled =
                  !template ||
                  outOfStock ||
                  quantity >= variant.available ||
                  slotsLeft < variant.capacityUnits ||
                  totalQuantity >= (template?.maxItems ?? 0);
                return (
                  <div className="builder-product" key={variant.variantId}>
                    <div>
                      <strong>{product.name}</strong>
                      <small>
                        {variant.weightGrams >= 1000
                          ? `${variant.weightGrams / 1000} kg`
                          : `${variant.weightGrams} g`}
                        {" · "}
                        {formatMoney(variant.priceCents, locale)}
                        {product.status === "DRAFT" &&
                          ` · ${tCommon("draftBadge")}`}
                      </small>
                      {outOfStock && (
                        <small className="field-error">
                          {tCommon("outOfStock")}
                        </small>
                      )}
                    </div>
                    <div className="builder-product-controls">
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(variant.variantId, quantity - 1)
                          }
                          disabled={quantity === 0}
                          aria-label={`${product.name} −`}
                        >
                          <Minus size={15} />
                        </button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(variant.variantId, quantity + 1)
                          }
                          disabled={addDisabled}
                          aria-label={`${product.name} +`}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </section>

        <section className="builder-step" aria-labelledby="step-packaging">
          <h2 id="step-packaging">{t("packagingTitle")}</h2>
          <p>{t("packagingLead")}</p>
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
                    ? t("packagingIncluded")
                    : formatMoney(option.priceCents, locale)}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="builder-step" aria-labelledby="step-message">
          <h2 id="step-message">{t("messageTitle")}</h2>
          <p>{t("messageLead")}</p>
          <div className="form-grid">
            <SelectField
              label={t("occasionLabel")}
              name="occasion"
              placeholder={t("occasionNone")}
              options={giftOccasionValues.map((value) => ({
                value,
                label: tOccasions(value),
              }))}
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
            />
            <TextAreaField
              label={t("messageLabel")}
              name="giftMessage"
              wide
              hint={t("messageOptional")}
              placeholder={t("messagePlaceholder")}
              maxLength={GIFT_MESSAGE_MAX_LENGTH}
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <span className="char-counter" aria-live="polite">
            {t("charactersLeft", {
              count: GIFT_MESSAGE_MAX_LENGTH - message.length,
            })}
          </span>
        </section>
      </div>

      <aside className="builder-summary" aria-labelledby="builder-review">
        <h2 id="builder-review">{t("reviewTitle")}</h2>
        <p className="field-hint">{t("reviewLead")}</p>
        {selections.length === 0 ? (
          <p className="muted">{t("emptySelection")}</p>
        ) : (
          <ul>
            {selections.map((entry) => {
              const record = variantIndex.get(entry.variantId);
              if (!record) return null;
              return (
                <li key={entry.variantId}>
                  {entry.quantity} × {record.product.name} (
                  {record.variant.weightGrams >= 1000
                    ? `${record.variant.weightGrams / 1000} kg`
                    : `${record.variant.weightGrams} g`}
                  )
                </li>
              );
            })}
          </ul>
        )}
        <dl>
          <div>
            <dt>{t("itemsSubtotal")}</dt>
            <dd>{formatMoney(itemsTotal, locale)}</dd>
          </div>
          <div>
            <dt>{t("boxCharge")}</dt>
            <dd>{formatMoney(template?.boxChargeCents ?? 0, locale)}</dd>
          </div>
          <div>
            <dt>{t("packagingLine")}</dt>
            <dd>{formatMoney(selectedPackaging?.priceCents ?? 0, locale)}</dd>
          </div>
          <div className="builder-total">
            <dt>{t("totalLine")}</dt>
            <dd>{formatMoney(estimatedTotal, locale)}</dd>
          </div>
        </dl>
        {!template && (
          <p className="field-error" role="status">
            {t("validation.selectSize")}
          </p>
        )}
        {template && belowMin && (
          <p className="field-error" role="status">
            {t("validation.minItems", { min: template.minItems })}
          </p>
        )}
        {template && aboveMax && (
          <p className="field-error" role="status">
            {t("validation.maxItems", { max: template.maxItems })}
          </p>
        )}
        {template && overCapacity && (
          <p className="field-error" role="status">
            {t("validation.capacity")}
          </p>
        )}
        <FormErrorBanner message={error} />
        <button
          type="button"
          className="button full"
          onClick={submit}
          disabled={!canSubmit}
        >
          {pending ? t("adding") : t("addToCart")}
        </button>
      </aside>
    </div>
  );
}
