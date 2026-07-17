import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/storefront/skeleton";

export default function ProductLoading() {
  const t = useTranslations("errors");
  return (
    <div className="section container" role="status" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      <div className="skeleton-product">
        <Skeleton className="skeleton-image tall" />
        <div className="skeleton-detail">
          <Skeleton className="skeleton-line w-40" />
          <Skeleton className="skeleton-line tall w-70" />
          <Skeleton className="skeleton-line w-30" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line w-70" />
          <Skeleton className="skeleton-button" />
        </div>
      </div>
    </div>
  );
}
