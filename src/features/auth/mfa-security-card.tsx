"use client";

import { useState } from "react";

import type { AppLocale } from "@/config/site";
import { authClient } from "@/lib/auth/client";

type Setup = { totpURI: string; backupCodes: string[] };

export function MfaSecurityCard({
  locale,
  enabled,
}: {
  locale: AppLocale;
  enabled: boolean;
}) {
  const de = locale === "de";
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function startSetup() {
    setPending(true);
    setMessage("");
    const result = await authClient.twoFactor.enable({ password });
    if (result.error || !result.data)
      setMessage(de ? "Einrichtung fehlgeschlagen." : "Setup failed.");
    else setSetup(result.data);
    setPending(false);
  }

  async function verify() {
    setPending(true);
    const result = await authClient.twoFactor.verifyTotp({ code });
    if (result.error) setMessage(de ? "Ungültiger Code." : "Invalid code.");
    else {
      setMessage(
        de
          ? "Zwei-Faktor-Schutz ist aktiv."
          : "Two-factor protection is active.",
      );
      setCode("");
    }
    setPending(false);
  }

  async function revokeOtherSessions() {
    setPending(true);
    const result = await authClient.revokeOtherSessions();
    setMessage(
      result.error
        ? de
          ? "Sitzungen konnten nicht widerrufen werden."
          : "Sessions could not be revoked."
        : de
          ? "Andere Sitzungen wurden widerrufen."
          : "Other sessions were revoked.",
    );
    setPending(false);
  }

  return (
    <section className="account-card" data-testid="mfa-security-card">
      <h2>{de ? "Kontosicherheit" : "Account security"}</h2>
      <p>
        {enabled
          ? de
            ? "Zwei-Faktor-Authentifizierung ist aktiv."
            : "Two-factor authentication is active."
          : de
            ? "Administratorkonten müssen vor dem Produktionszugriff TOTP aktivieren."
            : "Administrator accounts must enable TOTP before production access."}
      </p>
      {!enabled && !setup && (
        <>
          <label htmlFor="mfa-password">
            {de ? "Aktuelles Passwort" : "Current password"}
          </label>
          <input
            id="mfa-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="text-link"
            type="button"
            disabled={pending || password.length < 12}
            onClick={startSetup}
          >
            {de
              ? "Zwei-Faktor-Schutz einrichten"
              : "Set up two-factor protection"}
          </button>
        </>
      )}
      {setup && (
        <div>
          <p>
            {de
              ? "Fügen Sie diesen einmaligen Schlüssel Ihrer Authenticator-App hinzu:"
              : "Add this one-time key to your authenticator app:"}
          </p>
          <code>{setup.totpURI}</code>
          <p>
            {de
              ? "Speichern Sie diese Wiederherstellungscodes jetzt. Sie werden nicht erneut angezeigt:"
              : "Save these recovery codes now. They will not be shown again:"}
          </p>
          <ul>
            {setup.backupCodes.map((backupCode) => (
              <li key={backupCode}>
                <code>{backupCode}</code>
              </li>
            ))}
          </ul>
          <label htmlFor="mfa-code">
            {de ? "Sechsstelliger Code" : "Six-digit code"}
          </label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button
            className="text-link"
            type="button"
            disabled={pending || code.length < 6}
            onClick={verify}
          >
            {de ? "Aktivierung bestätigen" : "Confirm activation"}
          </button>
        </div>
      )}
      <button
        className="text-link"
        type="button"
        disabled={pending}
        onClick={revokeOtherSessions}
      >
        {de ? "Alle anderen Sitzungen widerrufen" : "Revoke all other sessions"}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
