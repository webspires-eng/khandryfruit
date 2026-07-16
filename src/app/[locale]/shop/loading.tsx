import { useTranslations } from "next-intl";

export default function ShopLoading() {
  const t = useTranslations("errors");
  return (
    <div className="empty-state" role="status" aria-live="polite">
      {t("loading")}
    </div>
  );
}
