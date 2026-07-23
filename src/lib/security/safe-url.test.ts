import { describe, expect, it } from "vitest";

import { isSafeUrl, parseSafeUrl, safeHref } from "./safe-url";

describe("safe URL validation", () => {
  it("rejects executable and inline-content schemes", () => {
    for (const hostile of [
      "javascript:alert(document.cookie)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)  ",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(isSafeUrl(hostile), hostile).toBe(false);
      expect(safeHref(hostile), hostile).toBeUndefined();
    }
  });

  it("accepts ordinary carrier tracking links", () => {
    expect(isSafeUrl("https://www.dhl.de/track?id=00340434")).toBe(true);
    expect(safeHref("https://dhl.de/x")).toBe("https://dhl.de/x");
  });

  it("rejects values that are not URLs at all", () => {
    for (const value of ["", "   ", "not a url", null, undefined])
      expect(isSafeUrl(value)).toBe(false);
  });

  it("allows http only when explicitly permitted", () => {
    expect(isSafeUrl("http://localhost:3001/x", { allowHttp: true })).toBe(
      true,
    );
    expect(isSafeUrl("http://tracking.example/x", { allowHttp: false })).toBe(
      false,
    );
  });

  it("returns the parsed URL so callers can inspect it", () => {
    expect(parseSafeUrl("https://dhl.de/track")?.hostname).toBe("dhl.de");
    expect(parseSafeUrl("javascript:alert(1)")).toBeNull();
  });
});
