import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/config/site";
import { formatMoney, unitPricePerKg } from "@/lib/commerce/money";
import { Link } from "@/i18n/navigation";
import type { CatalogueProduct } from "@/types/commerce";

export function ProductCard({
  product,
  locale,
}: {
  product: CatalogueProduct;
  locale: AppLocale;
}) {
  const t = useTranslations("productCard");
  const variant = product.variants[0];
  if (!variant) return null;
  return (
    <article className="product-card">
      <Link
        href={`/product/${product.slug}`}
        locale={locale}
        className="product-visual"
        aria-label={product.name}
      >
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 25vw"
          className="product-photo"
        />
        {product.status === "DRAFT" && (
          <span className="draft-badge">{t("draft")}</span>
        )}
        {product.originRegion && (
          <span className="origin-chip">{product.originRegion}</span>
        )}
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3>
          <Link href={`/product/${product.slug}`} locale={locale}>
            {product.name}
          </Link>
        </h3>
        <p>{product.shortDescription}</p>
        <div className="product-price">
          <span>
            {t("from")}{" "}
            <strong>{formatMoney(variant.priceCents, locale)}</strong>
          </span>
          <small>
            {formatMoney(
              unitPricePerKg(variant.priceCents, variant.weightGrams),
              locale,
            )}
            /kg
          </small>
        </div>
        <Link
          className="text-link"
          href={`/product/${product.slug}`}
          locale={locale}
        >
          {t("viewProduct")} <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
