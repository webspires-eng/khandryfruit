"use client";

import { readinessTargetId } from "./readiness-targets";

export function ReadinessBlockers({ blockers }: { blockers: string[] }) {
  const focusTarget = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // The field may sit in a hidden tab panel, which cannot be scrolled to or
    // focused. Ask the form to reveal that tab first, then focus on the next
    // frame once it is actually visible.
    const panel = el.closest<HTMLElement>("[data-tab-panel]");
    const reveal = () => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (!el.matches("input, select, textarea, button, a, [tabindex]"))
        el.setAttribute("tabindex", "-1");
      (el as HTMLElement).focus({ preventScroll: true });
    };
    if (panel?.hidden && panel.dataset.tabPanel) {
      window.dispatchEvent(
        new CustomEvent("admin:activate-tab", {
          detail: panel.dataset.tabPanel,
        }),
      );
      requestAnimationFrame(reveal);
      return;
    }
    reveal();
  };
  return (
    <ul>
      {blockers.map((blocker) => {
        const target = readinessTargetId[blocker];
        const label = blocker.replaceAll("_", " ").toLowerCase();
        return (
          <li key={blocker}>
            {target ? (
              <button
                type="button"
                className="readiness-blocker"
                onClick={() => focusTarget(target)}
              >
                {label}
              </button>
            ) : (
              label
            )}
          </li>
        );
      })}
    </ul>
  );
}
