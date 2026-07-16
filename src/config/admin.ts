export const adminAreas = [
  "dashboard", "products", "categories", "inventory", "orders", "customers", "wholesale", "contact-enquiries", "gift-boxes", "packaging", "coupons", "reviews", "content", "blog", "recipes", "faqs", "legal", "settings", "audit-logs", "system-health"
] as const;
export type AdminArea = (typeof adminAreas)[number];
export type AppRole = "CUSTOMER" | "WHOLESALE_CUSTOMER" | "CONTENT_EDITOR" | "ORDER_MANAGER" | "ADMIN" | "SUPER_ADMIN";

const permissions: Record<AppRole, ReadonlySet<AdminArea>> = {
  CUSTOMER: new Set(), WHOLESALE_CUSTOMER: new Set(),
  CONTENT_EDITOR: new Set(["dashboard", "content", "blog", "recipes", "faqs", "legal"]),
  ORDER_MANAGER: new Set(["dashboard", "orders", "customers", "contact-enquiries"]),
  ADMIN: new Set(["dashboard", "products", "categories", "inventory", "orders", "customers", "wholesale", "contact-enquiries", "gift-boxes", "packaging", "coupons", "reviews", "content", "blog", "recipes", "faqs", "legal", "settings"]),
  SUPER_ADMIN: new Set(adminAreas)
};

export function isAppRole(value: string): value is AppRole { return value in permissions; }
export function canAccessAdmin(role: string, area: AdminArea) { return isAppRole(role) && permissions[role].has(area); }
export function visibleAdminAreas(role: string) { return adminAreas.filter((area) => canAccessAdmin(role, area)); }
