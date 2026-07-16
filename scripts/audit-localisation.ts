import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { placeholderCopy } from "../src/lib/i18n/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const apply = process.argv.includes("--apply");

const exactRepairs = {
  en: {
    ingredients: new Map([
      [
        "[ZUTATEN VOR VERÖFFENTLICHUNG BESTÄTIGEN]",
        placeholderCopy.en.ingredients,
      ],
      [
        "[CONFIRM INGREDIENTS BEFORE PUBLICATION]",
        placeholderCopy.en.ingredients,
      ],
    ]),
    allergenStatement: new Map([
      ["[ALLERGENINFORMATION ERFORDERLICH]", placeholderCopy.en.allergens],
      ["[ALLERGEN INFORMATION REQUIRED]", placeholderCopy.en.allergens],
    ]),
    storageInstructions: new Map([
      ["[LAGERHINWEISE ERFORDERLICH]", placeholderCopy.en.storage],
      ["[STORAGE INSTRUCTIONS REQUIRED]", placeholderCopy.en.storage],
    ]),
  },
  de: {
    ingredients: new Map([
      [
        "[CONFIRM INGREDIENTS BEFORE PUBLICATION]",
        placeholderCopy.de.ingredients,
      ],
      [
        "[ZUTATEN VOR VERÖFFENTLICHUNG BESTÄTIGEN]",
        placeholderCopy.de.ingredients,
      ],
    ]),
    allergenStatement: new Map([
      ["[ALLERGEN INFORMATION REQUIRED]", placeholderCopy.de.allergens],
      ["[ALLERGENINFORMATION ERFORDERLICH]", placeholderCopy.de.allergens],
    ]),
    storageInstructions: new Map([
      ["[STORAGE INSTRUCTIONS REQUIRED]", placeholderCopy.de.storage],
      ["[LAGERHINWEISE ERFORDERLICH]", placeholderCopy.de.storage],
    ]),
  },
} as const;

const forbidden = {
  en: /Veröffentlichung|Zutaten|Allergeninformationen|Nur Vorschau|Produktentwurf|Seite nicht gefunden|Zur Startseite/i,
  de: /Draft product|Preview only|Page not found|Browse products|Required before publication/i,
};

async function main() {
  const translations = await db.productTranslation.findMany();
  const manualReview: Array<{ id: string; locale: string; fields: string[] }> =
    [];
  let repaired = 0;

  for (const translation of translations) {
    const locale = translation.locale;
    const repairSet = exactRepairs[locale];
    const updates: Record<string, string> = {};
    for (const field of [
      "ingredients",
      "allergenStatement",
      "storageInstructions",
    ] as const) {
      const value = translation[field];
      const replacement = value
        ? repairSet[field].get(value as never)
        : undefined;
      if (replacement && replacement !== value) updates[field] = replacement;
    }
    if (Object.keys(updates).length) {
      repaired += 1;
      if (apply)
        await db.productTranslation.update({
          where: { id: translation.id },
          data: updates,
        });
    }

    const suspiciousFields = [
      "name",
      "shortDescription",
      "description",
      "ingredients",
      "allergenStatement",
      "storageInstructions",
      "seoTitle",
      "metaDescription",
    ].filter((field) =>
      forbidden[locale].test(
        String(translation[field as keyof typeof translation] ?? ""),
      ),
    );
    if (suspiciousFields.length)
      manualReview.push({
        id: translation.id,
        locale,
        fields: suspiciousFields,
      });
  }

  const legalDocuments = await db.legalDocument.findMany({
    where: { complete: false },
  });
  for (const document of legalDocuments) {
    const content = document.contentJson as { text?: string } | null;
    if (
      content?.text === "[LEGAL TEXT REQUIRED BEFORE LAUNCH]" ||
      content?.text === "[RECHTSTEXT VOR DEM START ERFORDERLICH]"
    ) {
      repaired += 1;
      if (apply)
        await db.legalDocument.update({
          where: { id: document.id },
          data: {
            title:
              document.locale === "de"
                ? `${document.key} – Entwicklungsfassung`
                : `${document.key} – Development draft`,
            contentJson: {
              type: "placeholder",
              text: placeholderCopy[document.locale].legal,
            },
          },
        });
    }
  }

  console.info(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        exactRecordsRepairable: repaired,
        manualReview,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
