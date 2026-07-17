/**
 * Shared by the admin form (to preview a slug as you type) and the server
 * actions (to derive one when the field is left empty). Keep it in one place so
 * the preview can never drift from what is actually stored.
 *
 * German umlauts transliterate rather than drop: "Nüsse" -> "nuesse".
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
