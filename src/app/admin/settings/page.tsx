import Link from "next/link";
import type { Route } from "next";
import {
  Building2,
  LayoutGrid,
  Plug,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { AdminSection } from "@/components/admin/product-form";
import { SettingField } from "@/components/admin/setting-field";
import { canAccessAdmin, type AdminArea } from "@/config/admin";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { requireAdmin } from "@/server/policies/authorization";

type TabId = "business" | "commerce" | "brand" | "integrations" | "areas";

const tabs: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}[] = [
  {
    id: "business",
    label: "Business",
    icon: Building2,
    description:
      "Legal identity and contact details shown on invoices, the Impressum and customer emails.",
  },
  {
    id: "commerce",
    label: "Commerce & shipping",
    icon: ReceiptText,
    description:
      "Pricing, tax handling, order rules and the delivery promise shown at checkout.",
  },
  {
    id: "brand",
    label: "Brand & compliance",
    icon: ShieldCheck,
    description: "Public brand handles and cookie consent tracking.",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    description:
      "Configuration status of external services. Secret values are never rendered.",
  },
  {
    id: "areas",
    label: "More areas",
    icon: LayoutGrid,
    description:
      "Structural and configuration areas kept out of the sidebar to reduce clutter.",
  },
];

type SettingSpec = {
  key: string;
  label: string;
  hint?: string;
  type?: string;
  wide?: boolean;
  min?: number;
};

const sections: Record<
  "business" | "commerce" | "brand",
  { title: string; description?: string; fields: SettingSpec[] }[]
> = {
  business: [
    {
      title: "Identity",
      description: "Names used publicly and on legal documents.",
      fields: [
        {
          key: "business.tradingName",
          label: "Trading name",
          hint: "The customer-facing shop name.",
        },
        {
          key: "business.registeredName",
          label: "Registered name",
          hint: "The legal entity exactly as filed.",
        },
        { key: "business.owner", label: "Owner" },
      ],
    },
    {
      title: "Contact",
      description: "Reachable channels published in the Impressum.",
      fields: [
        { key: "business.address", label: "Address", wide: true },
        { key: "business.phone", label: "Phone", type: "tel" },
        {
          key: "business.whatsapp",
          label: "WhatsApp",
          type: "tel",
          hint: "Drives the storefront WhatsApp button.",
        },
        { key: "business.email", label: "Email", type: "email" },
      ],
    },
    {
      title: "Registrations",
      description: "Identifiers required for German trade compliance.",
      fields: [
        { key: "business.registrationNumber", label: "Registration number" },
        { key: "business.vatId", label: "VAT ID", hint: "Umsatzsteuer-ID." },
        { key: "business.taxNumber", label: "Tax number" },
        {
          key: "business.lucidNumber",
          label: "LUCID number",
          hint: "Packaging register (VerpackG).",
        },
        {
          key: "business.foodBusinessRegistration",
          label: "Food business registration",
          wide: true,
        },
      ],
    },
  ],
  commerce: [
    {
      title: "Pricing & tax",
      fields: [
        {
          key: "commerce.currency",
          label: "Currency",
          hint: "ISO code, e.g. EUR.",
        },
        {
          key: "commerce.vatMode",
          label: "VAT mode",
          hint: "How tax is applied to displayed prices.",
        },
      ],
    },
    {
      title: "Order rules",
      description: "Amounts are stored in cents to avoid rounding drift.",
      fields: [
        {
          key: "commerce.minimumOrderCents",
          label: "Minimum order",
          type: "number",
          min: 0,
          hint: "In cents. 2500 = €25.00.",
        },
        {
          key: "commerce.freeShippingThresholdCents",
          label: "Free shipping threshold",
          type: "number",
          min: 0,
          hint: "In cents. Leave empty to disable.",
        },
        {
          key: "commerce.stockReservationMinutes",
          label: "Stock reservation",
          type: "number",
          min: 0,
          hint: "Minutes a cart holds stock before it is released.",
        },
      ],
    },
    {
      title: "Delivery promise",
      description: "Shown on product pages and at checkout.",
      fields: [
        {
          key: "shipping.dispatchEstimate",
          label: "Dispatch estimate",
          wide: true,
          hint: "e.g. Ships within 1–2 working days.",
        },
        {
          key: "shipping.deliveryEstimate",
          label: "Delivery estimate",
          wide: true,
          hint: "e.g. Delivered in 2–4 working days.",
        },
      ],
    },
  ],
  brand: [
    {
      title: "Brand",
      fields: [
        {
          key: "brand.socialHandle",
          label: "Primary handle",
          hint: "Used when the brand is mentioned as @name. Without the @.",
        },
      ],
    },
    {
      title: "Social profiles",
      description:
        "Full profile URLs. Leave a network empty to hide it from the storefront.",
      fields: [
        {
          key: "brand.instagramUrl",
          label: "Instagram",
          type: "url",
          hint: "https://instagram.com/…",
        },
        {
          key: "brand.facebookUrl",
          label: "Facebook",
          type: "url",
          hint: "https://facebook.com/…",
        },
        {
          key: "brand.tiktokUrl",
          label: "TikTok",
          type: "url",
          hint: "https://tiktok.com/@…",
        },
        {
          key: "brand.youtubeUrl",
          label: "YouTube",
          type: "url",
          hint: "https://youtube.com/@…",
        },
        {
          key: "brand.pinterestUrl",
          label: "Pinterest",
          type: "url",
          hint: "https://pinterest.com/…",
        },
        {
          key: "brand.linkedinUrl",
          label: "LinkedIn",
          type: "url",
          hint: "https://linkedin.com/company/…",
        },
        {
          key: "brand.xUrl",
          label: "X (Twitter)",
          type: "url",
          hint: "https://x.com/…",
        },
      ],
    },
    {
      title: "Compliance",
      fields: [
        {
          key: "compliance.cookieConsentVersion",
          label: "Cookie consent version",
          hint: "Raise this to re-prompt every visitor for consent.",
        },
      ],
    },
  ],
};

// Entry points for structural/configuration areas that were moved out of the
// sidebar to reduce clutter. The pages themselves are unchanged; these cards
// just surface the existing routes from a single gateway.
const navSections: {
  title: string;
  items: { area: AdminArea; label: string; href: Route; description: string }[];
}[] = [
  {
    title: "Publishing",
    items: [
      {
        area: "content",
        label: "Content pages",
        href: "/admin/content" as Route,
        description: "Bilingual storefront pages and their blocks.",
      },
      {
        area: "blog",
        label: "Blog",
        href: "/admin/blog" as Route,
        description: "Articles and editorial posts.",
      },
      {
        area: "recipes",
        label: "Recipes",
        href: "/admin/recipes" as Route,
        description: "Recipe records shown on the storefront.",
      },
    ],
  },
  {
    title: "Legal & content",
    items: [
      {
        area: "legal",
        label: "Legal documents",
        href: "/admin/legal" as Route,
        description: "Impressum, privacy, terms and withdrawal texts.",
      },
      {
        area: "faqs",
        label: "FAQs",
        href: "/admin/faqs" as Route,
        description: "Customer help questions and answers.",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        area: "audit-logs",
        label: "Audit logs",
        href: "/admin/audit-logs" as Route,
        description: "Security-sensitive administrator action history.",
      },
      {
        area: "system-health",
        label: "System health",
        href: "/admin/system-health" as Route,
        description: "Integration status and runtime diagnostics.",
      },
    ],
  },
];

const display = (value: unknown) =>
  typeof value === "string"
    ? value
    : value == null
      ? ""
      : JSON.stringify(value);

const isTab = (value: string): value is TabId =>
  tabs.some((tab) => tab.id === value);

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAdmin("settings");
  const role = String(session.user.role);
  const { tab: requested = "" } = await searchParams;
  const active: TabId = isTab(requested) ? requested : "business";
  const activeTab = tabs.find((tab) => tab.id === active)!;

  const settings = await db.siteSetting.findMany();
  const values = new Map(settings.map((s) => [s.key, display(s.value)]));
  const integrations = [
    {
      name: "Database",
      detail: "Supabase Postgres connection.",
      ok: Boolean(env.DATABASE_URL),
    },
    {
      name: "Stripe",
      detail: "Payments and webhook signature verification.",
      ok: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    },
    {
      name: "Email",
      detail: "Transactional email delivery via AWS SES.",
      ok: Boolean(env.AWS_SES_FROM_EMAIL),
    },
    {
      name: "Cloudflare R2",
      detail: "Product and media image storage.",
      ok: Boolean(env.CLOUDFLARE_R2_BUCKET && env.CLOUDFLARE_R2_ACCESS_KEY_ID),
    },
    {
      name: "Analytics",
      detail: "Google Analytics measurement.",
      ok: Boolean(env.GOOGLE_ANALYTICS_ID),
    },
  ];
  const configured = integrations.filter((i) => i.ok).length;
  const editable = active !== "integrations" && active !== "areas";

  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Super administrator</p>
          <h1>Site settings</h1>
          <p>{activeTab.description}</p>
        </div>
        {editable && (
          <p className="admin-autosave-note">Changes save automatically.</p>
        )}
      </div>

      <nav className="admin-tabs" aria-label="Settings sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/admin/settings?tab=${tab.id}` as Route}
              className={tab.id === active ? "active" : ""}
              aria-current={tab.id === active ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === "integrations" && (
                <b
                  className={`admin-tab-count ${
                    configured === integrations.length ? "is-positive" : ""
                  }`}
                >
                  {configured}/{integrations.length}
                </b>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="admin-tab-panel">
        {active === "integrations" && (
          <section className="admin-card">
            <header>
              <h2>Integration status</h2>
              <span
                className={`admin-status ${
                  configured === integrations.length ? "is-positive" : ""
                }`}
              >
                {configured} of {integrations.length} configured
              </span>
            </header>
            {integrations.map((i) => (
              <div className="admin-list-row" key={i.name}>
                <span>
                  <strong>{i.name}</strong>
                  <small>{i.detail}</small>
                </span>
                <span
                  className={`admin-status ${
                    i.ok ? "is-positive" : "is-negative"
                  }`}
                >
                  {i.ok ? "Configured" : "Not configured"}
                </span>
              </div>
            ))}
          </section>
        )}

        {active === "areas" &&
          navSections.map((section) => {
            const items = section.items.filter((item) =>
              canAccessAdmin(role, item.area),
            );
            if (!items.length) return null;
            return (
              <section className="admin-card" key={section.title}>
                <header>
                  <h2>{section.title}</h2>
                </header>
                {items.map((item) => (
                  <div className="admin-list-row" key={item.area}>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <Link className="table-action" href={item.href}>
                      Open
                    </Link>
                  </div>
                ))}
              </section>
            );
          })}

        {editable &&
          sections[active].map((section) => (
            <AdminSection
              key={section.title}
              title={section.title}
              description={section.description}
            >
              <div className="admin-field-grid">
                {section.fields.map((field) => (
                  <SettingField
                    key={field.key}
                    settingKey={field.key}
                    label={field.label}
                    defaultValue={values.get(field.key) ?? ""}
                    type={field.type}
                    min={field.min}
                    wide={field.wide}
                    hint={field.hint}
                  />
                ))}
              </div>
            </AdminSection>
          ))}
      </div>
    </div>
  );
}
