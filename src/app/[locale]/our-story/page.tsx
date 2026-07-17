import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/our-story">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "de" ? "Unsere Geschichte" : "Our story",
    description:
      locale === "de"
        ? "Erfahren Sie mehr über Khan Dry Fruit, unsere Produktauswahl und unseren transparenten Umgang mit Herkunftsangaben."
        : "Learn about Khan Dry Fruit, our product selection and our transparent approach to sourcing information.",
  };
}

export default async function OurStoryPage({
  params,
}: PageProps<"/[locale]/our-story">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const de = locale === "de";

  const principles = de
    ? [
        [
          "Auswahl",
          "Wir stellen ein übersichtliches Sortiment afghanischer Trockenfrüchte und Geschenkideen zusammen.",
        ],
        [
          "Herkunft",
          "Bestätigte Beispiele umfassen Feigen aus Kandahar, Pfirsiche aus Logar, Rosinen aus Kabul und Maulbeeren aus Shamali.",
        ],
        [
          "Transparenz",
          "Bio-, Fair-Trade- oder Erzeugerangaben veröffentlichen wir nur mit geprüftem Nachweis.",
        ],
      ]
    : [
        [
          "Selection",
          "We curate a focused range of Afghan dry fruits and gifting ideas.",
        ],
        [
          "Origin",
          "Confirmed examples include figs from Kandahar, peaches from Logar, raisins from Kabul and mulberries from Shamali.",
        ],
        [
          "Transparency",
          "We publish organic, fair-trade or grower claims only when supporting evidence has been verified.",
        ],
      ];

  return (
    <main>
      <section className="story-section">
        <div className="story-grid container">
          <div className="story-photos">
            {(
              [
                [
                  "/images/products/figs.webp",
                  "Kandahar",
                  de ? "Feigen" : "Figs",
                ],
                [
                  "/images/products/black-raisins.webp",
                  "Kabul",
                  de ? "Rosinen" : "Raisins",
                ],
                [
                  "/images/products/white-mulberries.webp",
                  "Shamali",
                  de ? "Maulbeeren" : "Mulberries",
                ],
              ] as const
            ).map(([src, region, fruit]) => (
              <figure key={region}>
                <Image
                  src={src}
                  alt={`${fruit} — ${region}`}
                  fill
                  sizes="22vw"
                />
                <figcaption>
                  <strong>{fruit}</strong>
                  <small>{region}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          <div>
            <p className="eyebrow gold">Khan Dry Fruit · Duisburg</p>
            <h1>{de ? "Unsere Geschichte" : "Our story"}</h1>
            <p>
              {de
                ? "Khan Dry Fruit bringt ausgewählte afghanische Trockenfrüchte in einem klaren, zweisprachigen Einkaufserlebnis zusammen. Unser Anspruch ist einfach: verständliche Produktinformationen, nachvollziehbare Herkunftsangaben und keine unbelegten Versprechen."
                : "Khan Dry Fruit brings selected Afghan dry fruits together in a clear bilingual shopping experience. Our approach is simple: understandable product information, traceable origin details and no unsupported promises."}
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="feature-grid">
          {principles.map(([title, body]) => (
            <article className="feature-card" key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="content-actions">
          <Link className="button" href="/shop" locale={locale}>
            {de ? "Sortiment entdecken" : "Explore the shop"}
          </Link>
          <Link className="button secondary" href="/sourcing" locale={locale}>
            {de ? "Herkunft & Qualität" : "Sourcing & quality"}
          </Link>
        </div>
      </section>
    </main>
  );
}
