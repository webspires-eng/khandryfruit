import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { placeholderCopy } from "../src/lib/i18n/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding");
if (process.env.NODE_ENV === "production")
  throw new Error(
    "Development seed is disabled in production. Use npm run db:seed:production.",
  );
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const auth = betterAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    "development-only-seed-secret-at-least-32-chars",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 12 },
  plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 })],
});

const products = [
  [
    "black-raisins",
    "Schwarze Rosinen",
    "Black Raisins",
    "schwarze-rosinen",
    "black-raisins",
    "Kabul",
    "raisins",
    "Rosinen",
    "Raisins",
    899,
  ],
  [
    "green-raisins",
    "Grüne Rosinen",
    "Green Raisins",
    "gruene-rosinen",
    "green-raisins",
    "Kabul",
    "raisins",
    "Rosinen",
    "Raisins",
    999,
  ],
  [
    "afghan-figs",
    "Afghanische Feigen",
    "Afghan Figs",
    "afghanische-feigen",
    "afghan-figs",
    "Kandahar",
    "figs",
    "Feigen",
    "Figs",
    1299,
  ],
  [
    "dried-mulberries",
    "Getrocknete Maulbeeren",
    "Dried Mulberries",
    "getrocknete-maulbeeren",
    "dried-mulberries",
    "Shamali",
    "mulberries",
    "Maulbeeren",
    "Mulberries",
    1099,
  ],
  [
    "dried-peaches",
    "Getrocknete Pfirsiche",
    "Dried Peaches",
    "getrocknete-pfirsiche",
    "dried-peaches",
    "Logar",
    "peaches",
    "Pfirsiche",
    "Peaches",
    1199,
  ],
  [
    "dried-apricots",
    "Getrocknete Aprikosen",
    "Dried Apricots",
    "getrocknete-aprikosen",
    "dried-apricots",
    "",
    "apricots",
    "Aprikosen",
    "Apricots",
    999,
  ],
] as const;

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@khandryfruit.local";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Local-Only-2026!";
  const customerEmail =
    process.env.SEED_CUSTOMER_EMAIL ?? "customer@khandryfruit.local";
  const customerPassword =
    process.env.SEED_CUSTOMER_PASSWORD ?? "ChangeMe-Local-Only-2026!";
  if (!(await db.user.findUnique({ where: { email: adminEmail } })))
    await auth.api.signUpEmail({
      body: {
        name: "Local Store Administrator",
        email: adminEmail,
        password: adminPassword,
      },
    });
  await db.user.update({
    where: { email: adminEmail },
    data: {
      role: "SUPER_ADMIN",
      emailVerified: true,
      username: "admin",
      displayUsername: "admin",
    },
  });
  if (!(await db.user.findUnique({ where: { email: customerEmail } })))
    await auth.api.signUpEmail({
      body: {
        name: "Development Customer",
        email: customerEmail,
        password: customerPassword,
      },
    });
  await db.user.update({
    where: { email: customerEmail },
    data: { role: "CUSTOMER", emailVerified: true },
  });
  console.info(`Development admin: admin or ${adminEmail}`);
  console.info(`Development customer: ${customerEmail}`);
  console.info(
    "Passwords come from SEED_*_PASSWORD and must never be used outside local development.",
  );
}

async function seedRoles() {
  for (const name of [
    "CUSTOMER",
    "WHOLESALE_CUSTOMER",
    "CONTENT_EDITOR",
    "ORDER_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
  ])
    await db.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name.replaceAll("_", " ").toLowerCase()} role`,
      },
    });
  for (const key of [
    "catalogue.read",
    "catalogue.write",
    "inventory.write",
    "orders.write",
    "content.write",
    "settings.write",
    "users.manage",
    "audit.read",
  ])
    await db.permission.upsert({ where: { key }, update: {}, create: { key } });
}

async function seedCatalogue() {
  const categories = new Map<string, string>();
  for (const item of products) {
    const [, , , , , , categoryKey, nameDe, nameEn] = item;
    if (categories.has(categoryKey)) continue;
    const category = await db.category.upsert({
      where: { id: `cat-${categoryKey}` },
      update: {},
      create: {
        id: `cat-${categoryKey}`,
        internalName: categoryKey,
        translations: {
          create: [
            {
              locale: "de",
              name: nameDe,
              slug:
                categoryKey === "raisins"
                  ? "rosinen"
                  : categoryKey === "figs"
                    ? "feigen"
                    : categoryKey === "mulberries"
                      ? "maulbeeren"
                      : categoryKey === "peaches"
                        ? "pfirsiche"
                        : "aprikosen",
              description: `${nameDe} – Entwicklungsinhalt.`,
              seoTitle: `${nameDe} kaufen | Khan Dry Fruit`,
              metaDescription: `${nameDe} von Khan Dry Fruit. Produktdaten vor Veröffentlichung prüfen.`,
            },
            {
              locale: "en",
              name: nameEn,
              slug: categoryKey,
              description: `${nameEn} – development content.`,
              seoTitle: `${nameEn} | Khan Dry Fruit`,
              metaDescription: `${nameEn} from Khan Dry Fruit. Verify product data before publication.`,
            },
          ],
        },
      },
    });
    categories.set(categoryKey, category.id);
  }
  for (const [
    key,
    nameDe,
    nameEn,
    slugDe,
    slugEn,
    region,
    categoryKey,
    ,
    ,
    priceCents,
  ] of products) {
    await db.product.upsert({
      where: { id: `prod-${key}` },
      update: { giftSuitable: true },
      create: {
        id: `prod-${key}`,
        internalName: key,
        status: "DRAFT",
        featured: true,
        bestseller: ["black-raisins", "afghan-figs"].includes(key),
        giftSuitable: true,
        countryOfOrigin: "Afghanistan",
        regionOfOrigin: region,
        translations: {
          create: [
            {
              locale: "de",
              name: nameDe,
              slug: slugDe,
              alternativeNames: [],
              keywords: [nameDe, region],
              shortDescription: region
                ? `${nameDe} aus ${region}; Entwicklungsprodukt bis alle Pflichtdaten bestätigt sind.`
                : placeholderCopy.de.productInformation,
              description: region
                ? `Die Herkunftsangabe ${region} ist als Beispiel bestätigt. Weitere Produktdaten benötigen Freigabe.`
                : placeholderCopy.de.productInformation,
              ingredients: placeholderCopy.de.ingredients,
              allergenStatement: placeholderCopy.de.allergens,
              storageInstructions: placeholderCopy.de.storage,
              seoTitle: `${nameDe} | Khan Dry Fruit`,
              metaDescription: `${nameDe} als Entwicklungsprodukt. Pflichtangaben werden vor Veröffentlichung geprüft.`,
            },
            {
              locale: "en",
              name: nameEn,
              slug: slugEn,
              alternativeNames: [],
              keywords: [nameEn, region],
              shortDescription: region
                ? `${nameEn} from ${region}; development product until mandatory data is confirmed.`
                : placeholderCopy.en.productInformation,
              description: region
                ? `The ${region} sourcing entry is confirmed as an example. Further product data requires approval.`
                : placeholderCopy.en.productInformation,
              ingredients: placeholderCopy.en.ingredients,
              allergenStatement: placeholderCopy.en.allergens,
              storageInstructions: placeholderCopy.en.storage,
              seoTitle: `${nameEn} | Khan Dry Fruit`,
              metaDescription: `${nameEn} as a development product. Mandatory data will be checked before publication.`,
            },
          ],
        },
        categories: {
          create: { categoryId: categories.get(categoryKey)!, isPrimary: true },
        },
        variants: {
          create: [
            {
              sku: `DEV-${key.toUpperCase()}-500`,
              weightGrams: 500,
              shippingWeightG: 540,
              priceCents,
              vatRateBps: 700,
              inventory: {
                create: { onHand: 20, reserved: 0, lowStockThreshold: 5 },
              },
            },
            {
              sku: `DEV-${key.toUpperCase()}-1000`,
              weightGrams: 1000,
              shippingWeightG: 1060,
              priceCents: Math.round(priceCents * 1.8),
              vatRateBps: 700,
              inventory: {
                create: { onHand: 8, reserved: 0, lowStockThreshold: 3 },
              },
            },
          ],
        },
      },
    });
  }
}

async function seedOperations() {
  const zone = await db.shippingZone.upsert({
    where: { id: "zone-de" },
    update: {},
    create: { id: "zone-de", name: "Germany", countries: ["DE"] },
  });
  const method = await db.shippingMethod.upsert({
    where: { id: "shipping-de-standard" },
    update: {},
    create: {
      id: "shipping-de-standard",
      zoneId: zone.id,
      nameDe: "Standard Deutschland",
      nameEn: "Germany standard",
      provider: "mock",
      deliveryDaysMin: 3,
      deliveryDaysMax: 4,
    },
  });
  await db.shippingRate.upsert({
    where: { id: "rate-de-standard" },
    update: {},
    create: {
      id: "rate-de-standard",
      methodId: method.id,
      minWeightG: 0,
      maxWeightG: 2000,
      priceCents: 499,
    },
  });
  await db.coupon.upsert({
    where: { code: "DEV10" },
    update: {},
    create: {
      code: "DEV10",
      type: "PERCENTAGE",
      value: 1000,
      active: true,
      usageLimit: 100,
      perCustomerLimit: 1,
      minimumOrderCents: 2500,
      maximumDiscountCents: 1500,
    },
  });
  const flags = [
    "wholesaleAccounts",
    "customGiftBoxes",
    "productReviews",
    "subscriptions",
    "loyaltyPoints",
    "clickAndCollect",
    "localDelivery",
    "liveStockDisplay",
    "abandonedCartEmails",
    "austriaShipping",
    "switzerlandShipping",
    "euShipping",
    "englishLanguage",
    "futureLanguages",
  ];
  for (const key of flags)
    await db.featureFlag.upsert({
      where: { key },
      update: {},
      create: {
        key,
        enabled: key === "englishLanguage",
        description: `${key} feature switch`,
      },
    });
  const settings = [
    ["business.tradingName", "Khan Dry Fruit", "business", true],
    ["business.owner", "Shoaib Khan Safi", "business", true],
    ["business.phone", "+49 176 21809185", "business", true],
    ["business.address", "", "business", false],
    ["business.email", "orders@example.com", "business", false],
    ["commerce.currency", "EUR", "commerce", true],
    ["commerce.vatMode", "UNCONFIRMED", "commerce", false],
    ["commerce.stockReservationMinutes", 30, "commerce", false],
    ["shipping.dispatchPromiseEnabled", false, "shipping", true],
  ] as const;
  for (const [key, value, group, isPublic] of settings)
    await db.siteSetting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value,
        group,
        public: isPublic,
        type:
          typeof value === "boolean"
            ? "BOOLEAN"
            : typeof value === "number"
              ? "NUMBER"
              : "STRING",
      },
    });
  for (const key of [
    "impressum",
    "privacy",
    "terms",
    "withdrawal",
    "shipping",
    "returns",
    "cookies",
  ])
    for (const locale of ["de", "en"] as const)
      await db.legalDocument.upsert({
        where: { key_locale: { key, locale } },
        update: {},
        create: {
          key,
          locale,
          title:
            locale === "de"
              ? `${key} – Entwicklungsfassung`
              : `${key} – Development draft`,
          contentJson: {
            type: "placeholder",
            text: placeholderCopy[locale].legal,
          },
          complete: false,
          version: "development-1",
        },
      });
}

async function seedStorefrontFeatures() {
  // Build-your-own box size templates (fixed: false).
  const templates = [
    [
      "gift-box-small",
      "Kleine Geschenkbox",
      "Small Gift Box",
      "SMALL",
      3,
      2,
      3,
      399,
    ],
    [
      "gift-box-medium",
      "Mittlere Geschenkbox",
      "Medium Gift Box",
      "MEDIUM",
      5,
      3,
      5,
      599,
    ],
    [
      "gift-box-large",
      "Große Geschenkbox",
      "Large Gift Box",
      "LARGE",
      8,
      4,
      8,
      799,
    ],
  ] as const;
  for (const [
    id,
    nameDe,
    nameEn,
    sizeName,
    capacity,
    min,
    max,
    price,
  ] of templates)
    await db.giftBox.upsert({
      where: { id },
      update: {},
      create: {
        id,
        internalName: id,
        nameDe,
        nameEn,
        slugDe: `${id}-de`,
        slugEn: `${id}-en`,
        descriptionDe: `${nameDe} zum Selbstbefüllen – Boxpauschale inklusive Karte und Einlage.`,
        descriptionEn: `${nameEn} for the build-your-own flow – box charge includes card and lining.`,
        seoTitleDe: `${nameDe} | Khan Dry Fruit`,
        seoTitleEn: `${nameEn} | Khan Dry Fruit`,
        metaDescriptionDe: `${nameDe} mit afghanischen Trockenfrüchten selbst zusammenstellen.`,
        metaDescriptionEn: `Build your own ${nameEn.toLowerCase()} with Afghan dry fruits.`,
        sizeName,
        fixed: false,
        active: true,
        basePriceCents: price,
        capacityUnits: capacity,
        minItems: min,
        maxItems: max,
        occasions: [],
      },
    });

  // One curated fixed gift box built from seeded catalogue variants.
  const fixedItems = [
    ["prod-black-raisins", "DEV-BLACK-RAISINS-500"],
    ["prod-afghan-figs", "DEV-AFGHAN-FIGS-500"],
    ["prod-dried-mulberries", "DEV-DRIED-MULBERRIES-500"],
  ] as const;
  const variants = await db.productVariant.findMany({
    where: { sku: { in: fixedItems.map(([, sku]) => sku) } },
  });
  const fixedBox = await db.giftBox.upsert({
    where: { id: "gift-box-classic" },
    update: {},
    create: {
      id: "gift-box-classic",
      internalName: "gift-box-classic",
      nameDe: "Klassische Auswahl",
      nameEn: "Classic Selection",
      slugDe: "klassische-auswahl",
      slugEn: "classic-selection",
      descriptionDe:
        "Unsere beliebtesten Trockenfrüchte in einer festlichen Box – Rosinen aus Kabul, Feigen aus Kandahar und Maulbeeren aus Shamali.",
      descriptionEn:
        "Our most popular dry fruits in one festive box – raisins from Kabul, figs from Kandahar and mulberries from Shamali.",
      seoTitleDe: "Klassische Geschenkbox | Khan Dry Fruit",
      seoTitleEn: "Classic Gift Box | Khan Dry Fruit",
      metaDescriptionDe:
        "Kuratierte Geschenkbox mit afghanischen Trockenfrüchten – ideal zu Eid, Weihnachten und als Dankeschön.",
      metaDescriptionEn:
        "Curated gift box with Afghan dry fruits – ideal for Eid, Christmas and thank-you gifts.",
      sizeName: "MEDIUM",
      fixed: true,
      active: true,
      basePriceCents: 599,
      capacityUnits: 5,
      minItems: 3,
      maxItems: 5,
      occasions: ["EID", "CHRISTMAS", "THANK_YOU", "GENERAL"],
    },
  });
  for (const [productId, sku] of fixedItems) {
    const variant = variants.find((entry) => entry.sku === sku);
    if (!variant) continue;
    await db.giftBoxItem.upsert({
      where: {
        giftBoxId_variantId: { giftBoxId: fixedBox.id, variantId: variant.id },
      },
      update: {},
      create: {
        giftBoxId: fixedBox.id,
        productId,
        variantId: variant.id,
        quantity: 1,
        units: 1,
      },
    });
  }

  // Gift packaging options.
  const packaging = [
    [
      "packaging-classic",
      "Klassische Box",
      "Classic box",
      "Stabile Geschenkbox mit Seidenpapier.",
      "Sturdy gift box with tissue paper.",
      0,
      0,
    ],
    [
      "packaging-premium",
      "Premium-Verpackung",
      "Premium wrap",
      "Geschenkband, Grußkarte und festliche Verpackung.",
      "Ribbon, greeting card and festive wrapping.",
      490,
      1,
    ],
    [
      "packaging-corporate",
      "Firmenverpackung",
      "Corporate packaging",
      "Neutrale, hochwertige Verpackung für Geschäftskunden.",
      "Neutral premium packaging for corporate clients.",
      690,
      2,
    ],
  ] as const;
  for (const [
    id,
    nameDe,
    nameEn,
    descDe,
    descEn,
    price,
    sortOrder,
  ] of packaging)
    await db.giftPackagingOption.upsert({
      where: { id },
      update: {},
      create: {
        id,
        nameDe,
        nameEn,
        descriptionDe: descDe,
        descriptionEn: descEn,
        priceCents: price,
        active: true,
        sortOrder,
      },
    });

  // One sample wholesale application for admin-side development.
  const sampleEmail = "development-wholesale@khandryfruit.local";
  if (
    !(await db.wholesaleApplication.findFirst({
      where: { email: sampleEmail },
    }))
  )
    await db.wholesaleApplication.create({
      data: {
        companyName: "Development Feinkost GmbH",
        contactName: "Dev Ansprechperson",
        email: sampleEmail,
        phone: "+4917600000000",
        businessAddress: "Musterstraße 1",
        city: "Duisburg",
        postalCode: "47051",
        countryCode: "DE",
        vatId: "DE000000000",
        businessType: "GROCERY_RETAILER",
        monthlyOrderVolume: "FROM_500_TO_1500",
        productsOfInterest: ["Rosinen", "Feigen"],
        deliveryCountries: ["DE"],
        preferredContactMethod: "EMAIL",
        message: "Entwicklungsbeispiel – nicht kontaktieren.",
        status: "SUBMITTED",
        agreementAcceptedAt: new Date(),
        accuracyConfirmedAt: new Date(),
      },
    });

  // Popular searches (configurable via admin settings).
  await db.siteSetting.upsert({
    where: { key: "search.popularQueries" },
    update: {},
    create: {
      key: "search.popularQueries",
      value: {
        de: ["Rosinen", "Feigen", "Maulbeeren", "Aprikosen", "Geschenkbox"],
        en: ["Raisins", "Figs", "Mulberries", "Apricots", "Gift box"],
      },
      type: "JSON",
      group: "search",
      public: true,
    },
  });

  // Development-only search aliases (common Dari/Farsi and colloquial names).
  if (process.env.NODE_ENV !== "production") {
    const aliases: Array<[string, "de" | "en", string]> = [
      ["prod-black-raisins", "de", "Kishmish"],
      ["prod-black-raisins", "en", "Kishmish"],
      ["prod-green-raisins", "de", "Sultaninen"],
      ["prod-green-raisins", "en", "Sultanas"],
      ["prod-afghan-figs", "de", "Anjir"],
      ["prod-afghan-figs", "en", "Anjeer"],
      ["prod-dried-mulberries", "de", "Toot"],
      ["prod-dried-mulberries", "en", "Toot"],
    ];
    for (const [productId, locale, alias] of aliases)
      await db.productSearchAlias.upsert({
        where: {
          productId_locale_alias: { productId, locale, alias },
        },
        update: {},
        create: { productId, locale, alias },
      });
  }
}

async function main() {
  await seedRoles();
  await seedUsers();
  await seedCatalogue();
  await seedOperations();
  await seedStorefrontFeatures();
}
main()
  .then(() => console.info("Khan Dry Fruit development seed completed."))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
