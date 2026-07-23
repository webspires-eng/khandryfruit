/** Shape shared by OrderAddress and the account-level Address model. */
export type PostalAddress = {
  firstName: string;
  lastName: string;
  company?: string | null;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  state?: string | null;
  countryCode: string;
  phone?: string | null;
};

export function formatRecipientName(address?: PostalAddress | null) {
  return address ? `${address.firstName} ${address.lastName}`.trim() : "";
}

/**
 * Postal-order lines for a delivery label, skipping empty optional parts.
 * Recipient first, then company, street, postcode/city, country.
 */
export function formatAddressLines(address: PostalAddress) {
  return [
    formatRecipientName(address),
    address.company,
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.state,
    address.countryCode,
  ]
    .map((line) => line?.trim() ?? "")
    .filter((line) => line.length > 0);
}

/** Single-line form for CSV exports and table cells. */
export function formatAddressOneLine(address: PostalAddress) {
  return formatAddressLines(address).join(", ");
}

/**
 * Display name for an order: the account name when the buyer was signed in,
 * otherwise the shipping recipient captured at checkout, and only then a
 * generic guest label.
 */
export function orderCustomerName(order: {
  user?: { name?: string | null } | null;
  addresses?: PostalAddress[] | null;
}) {
  const accountName = order.user?.name?.trim();
  if (accountName) return accountName;
  const shipping = order.addresses?.[0];
  return formatRecipientName(shipping) || "Guest";
}

/**
 * Customer-facing order reference, e.g. "#0042".
 *
 * Stored bare ("0042") so it sorts and searches cleanly; the hash is presentation
 * only. Short numbers are safe to expose because access to an order is gated by
 * the hashed token in the return URL, never by the number being hard to guess.
 */
export function formatOrderNumber(number: string) {
  return `#${number}`;
}
