"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Below 1100px the desktop nav is hidden, so this drawer is the only way to
 * reach the shop. Links stay server-rendered and are passed in as children —
 * a click anywhere inside the nav bubbles up and closes the drawer, which
 * avoids threading an onClick through every link.
 */
export function MobileNav({
  label,
  closeLabel,
  children,
}: {
  label: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="menu-button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
      >
        <Menu size={22} />
      </button>
      {open && (
        <div
          className="mobile-drawer-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <div className="mobile-drawer-head">
              <span>{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
              >
                <X size={20} />
              </button>
            </div>
            <nav onClick={() => setOpen(false)}>{children}</nav>
          </div>
        </div>
      )}
    </>
  );
}
