export const wholesaleStatuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "APPROVED",
  "REJECTED",
] as const;

export const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  MORE_INFORMATION_REQUIRED: "More info needed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const statusTone: Record<string, string> = {
  SUBMITTED: "is-warning",
  UNDER_REVIEW: "is-warning",
  MORE_INFORMATION_REQUIRED: "is-warning",
  APPROVED: "is-positive",
  REJECTED: "is-negative",
};

export const wholesaleDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Enum values read better as "Grocery retailer" than "GROCERY_RETAILER". */
export const humanise = (value: string) => {
  const spaced = value.replaceAll("_", " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
