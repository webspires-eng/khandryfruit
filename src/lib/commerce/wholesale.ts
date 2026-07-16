/**
 * A wholesale application is "active" while it still needs or awaits a
 * decision. One active application per email address is allowed; rejected or
 * approved applicants may submit a fresh application later.
 */
export const ACTIVE_APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
] as const;

export type ActiveApplicationStatus = (typeof ACTIVE_APPLICATION_STATUSES)[number];

export function isActiveApplicationStatus(
  status: string,
): status is ActiveApplicationStatus {
  return (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export function hasActiveApplication(
  applications: ReadonlyArray<{ status: string }>,
): boolean {
  return applications.some((application) =>
    isActiveApplicationStatus(application.status),
  );
}
