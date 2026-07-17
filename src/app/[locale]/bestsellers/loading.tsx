import { useTranslations } from "next-intl";
import { PageSkeleton } from "@/components/storefront/skeleton";

export default function BestsellersLoading() {
  const t = useTranslations("errors");
  return <PageSkeleton label={t("loading")} />;
}
