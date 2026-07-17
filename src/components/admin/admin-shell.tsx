"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CircleUserRound,
  FileText,
  Gift,
  History,
  LayoutGrid,
  Images,
  Menu,
  MessageSquareText,
  PackageOpen,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Tags,
  TicketPercent,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminArea } from "@/config/admin";
import { signOut } from "@/lib/auth/client";

const nav: Record<
  AdminArea,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  dashboard: { label: "Dashboard", icon: BarChart3 },
  products: { label: "Products", icon: ShoppingBasket },
  categories: { label: "Categories", icon: Tags },
  inventory: { label: "Inventory", icon: Warehouse },
  orders: { label: "Orders", icon: PackageOpen },
  customers: { label: "Customers", icon: Users },
  wholesale: { label: "Wholesale", icon: Store },
  "contact-enquiries": { label: "Contact enquiries", icon: MessageSquareText },
  "gift-boxes": { label: "Gift boxes", icon: Gift },
  packaging: { label: "Packaging", icon: PackageOpen },
  coupons: { label: "Coupons", icon: TicketPercent },
  reviews: { label: "Reviews", icon: MessageSquareText },
  content: { label: "Content", icon: FileText },
  blog: { label: "Blog", icon: FileText },
  recipes: { label: "Recipes", icon: FileText },
  faqs: { label: "FAQs", icon: MessageSquareText },
  legal: { label: "Legal", icon: FileText },
  settings: { label: "Settings", icon: Settings },
  media: { label: "Media library", icon: Images },
  "audit-logs": { label: "Audit logs", icon: History },
  "system-health": { label: "System health", icon: LayoutGrid },
};

// High-frequency operational items only. Structural, publishing and
// configuration areas (categories, packaging, coupons, content, blog, recipes,
// legal, FAQs, media, audit logs, system health) are reachable from the
// Settings page instead of the sidebar. Their routes are unchanged, so
// existing links and bookmarks still resolve.
const navGroups: Array<{
  label: string;
  areas: AdminArea[];
}> = [
  {
    label: "Operations",
    areas: ["dashboard", "orders", "inventory"],
  },
  {
    label: "Catalogue",
    areas: ["products", "gift-boxes"],
  },
  {
    label: "Customers",
    areas: ["customers", "wholesale", "contact-enquiries", "reviews"],
  },
  {
    label: "Workspace",
    areas: ["settings"],
  },
];

export function AdminShell({
  children,
  areas,
  user,
}: {
  children: React.ReactNode;
  areas: AdminArea[];
  user: { name: string; email: string; role: string };
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const logout = async () => {
    await signOut();
    router.push("/de/sign-in");
    router.refresh();
  };

  // Cmd/Ctrl+K opens search from anywhere; Escape closes it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="admin-shell-v2">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-sidebar-head">
          <Link href="/admin" className="brand">
            <span className="brand-mark">K</span>
            <span>
              <strong>Khan</strong>
              <small>Store administration</small>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="admin-mobile-close"
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Administration">
          {navGroups.map((group) => {
            const visible = group.areas.filter((area) => areas.includes(area));
            if (!visible.length) return null;
            return (
              <section className="admin-nav-group" key={group.label}>
                <p>{group.label}</p>
                {visible.map((area) => {
                  const Icon = nav[area].icon;
                  const href =
                    area === "dashboard" ? "/admin" : `/admin/${area}`;
                  const active =
                    pathname === href ||
                    (href !== "/admin" && pathname.startsWith(`${href}/`));
                  return (
                    <Link
                      key={area}
                      href={href as Route}
                      className={active ? "active" : ""}
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={18} />
                      <span>{nav[area].label}</span>
                    </Link>
                  );
                })}
              </section>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-secure-state">
            <ShieldCheck size={18} />
            <span>
              <strong>Secure workspace</strong>
              <small>Protected admin session</small>
            </span>
          </div>
          <Link className="admin-store-link" href="/de">
            <LayoutGrid size={17} /> View storefront
          </Link>
        </div>
      </aside>
      {open && (
        <button
          className="admin-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/admin">Dashboard</Link>
            {segments.slice(1).map((segment, index) => (
              <span key={`${segment}-${index}`}>
                <ChevronRight size={13} /> {segment.replaceAll("-", " ")}
              </span>
            ))}
          </nav>
          <button
            type="button"
            className="admin-icon-button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <span
            className={`environment-badge environment-${process.env.NODE_ENV}`}
          >
            {process.env.NODE_ENV === "production"
              ? "Production"
              : "Development"}
          </span>
          {areas.includes("system-health") && (
            <Link
              href="/admin/system-health"
              className="admin-alert-button"
              aria-label="Open system health"
            >
              <Bell size={19} />
              <span />
            </Link>
          )}
          <details className="admin-user-menu">
            <summary>
              <CircleUserRound size={20} />
              <span>
                <strong>{user.name}</strong>
                <small>{user.role.replaceAll("_", " ").toLowerCase()}</small>
              </span>
            </summary>
            <div>
              <span>{user.email}</span>
              <button onClick={logout}>Sign out</button>
            </div>
          </details>
        </header>
        {children}
      </div>
      {searchOpen && (
        <div
          className="admin-search-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Search administration"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="admin-search-dialog">
            <form action="/admin/products">
              <Search size={18} />
              <label className="sr-only" htmlFor="admin-search">
                Search products
              </label>
              <input
                id="admin-search"
                name="q"
                autoFocus
                autoComplete="off"
                placeholder="Search products, orders or customers"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </form>
            <p>
              Press <kbd>Enter</kbd> to search products · <kbd>Esc</kbd> to
              close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
