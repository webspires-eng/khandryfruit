"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="empty-state large">
      <p className="eyebrow">500</p>
      <h1>Etwas ist schiefgelaufen</h1>
      <p>
        Die Seite konnte nicht geladen werden. Es werden keine vertraulichen
        technischen Details angezeigt.
      </p>
      <button className="button" onClick={reset}>
        Erneut versuchen
      </button>
    </main>
  );
}
