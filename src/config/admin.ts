export const adminAreas = [
  "dashboard",
  "products",
  "categories",
  "inventory",
  "orders",
  "customers",
  "wholesale",
  "contact-enquiries",
  "gift-boxes",
  "packaging",
  "coupons",
  "reviews",
  "content",
  "blog",
  "recipes",
  "faqs",
  "legal",
  "settings",
  "media",
  "audit-logs",
  "system-health",
] as const;
export type AdminArea = (typeof adminAreas)[number];
export type AppRole =
  | "CUSTOMER"
  | "WHOLESALE_CUSTOMER"
  | "CONTENT_EDITOR"
  | "ORDER_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

const permissions: Record<AppRole, ReadonlySet<AdminArea>> = {
  CUSTOMER: new Set(),
  WHOLESALE_CUSTOMER: new Set(),
  CONTENT_EDITOR: new Set([
    "dashboard",
    "content",
    "blog",
    "recipes",
    "faqs",
    "legal",
  ]),
  ORDER_MANAGER: new Set([
    "dashboard",
    "orders",
    "customers",
    "contact-enquiries",
  ]),
  ADMIN: new Set([
    "dashboard",
    "products",
    "categories",
    "inventory",
    "orders",
    "customers",
    "wholesale",
    "contact-enquiries",
    "gift-boxes",
    "packaging",
    "coupons",
    "reviews",
    "content",
    "blog",
    "recipes",
    "faqs",
    "legal",
    "settings",
  ]),
  SUPER_ADMIN: new Set(adminAreas),
};

export function isAppRole(value: string): value is AppRole {
  return value in permissions;
}

/**
 * Roles that must hold a second factor in production.
 *
 * Derived from the permission matrix rather than listed by hand: any role that
 * can reach more than the dashboard can change customer, order or catalogue
 * data, so it needs the same protection. Previously only ADMIN and SUPER_ADMIN
 * were gated, which left ORDER_MANAGER — the role that issues refunds — as the
 * one role able to move money with a password alone.
 */
export function requiresTwoFactor(role: string) {
  if (!isAppRole(role)) return false;
  const areas = permissions[role];
  return [...areas].some((area) => area !== "dashboard");
}
export function canAccessAdmin(role: string, area: AdminArea) {
  return isAppRole(role) && permissions[role].has(area);
}
export function visibleAdminAreas(role: string) {
  return adminAreas.filter((area) => canAccessAdmin(role, area));
}
