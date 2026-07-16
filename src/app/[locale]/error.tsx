"use client";

import { useTranslations } from "next-intl";

export default function LocaleError({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="empty-state large">
      <p className="eyebrow">500</p>
      <h1>{t("genericTitle")}</h1>
      <p>{t("genericText")}</p>
      <button className="button" onClick={reset}>
        {t("retry")}
      </button>
    </main>
  );
}
