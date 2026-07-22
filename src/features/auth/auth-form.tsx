"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/config/site";
import { authClient, signIn, signUp } from "@/lib/auth/client";
import { PasswordInput } from "@/components/ui/password-input";

type AuthClientError =
  | { code?: string; message?: string; status?: number }
  | null
  | undefined;

/**
 * Maps a Better Auth client error to a localized, user-facing message.
 * Sign-in credential failures stay deliberately generic to avoid revealing
 * whether an account exists; sign-up validation errors are surfaced so the
 * user learns what to fix (e.g. email already in use, password too short).
 */
function messageForAuthError(
  error: AuthClientError,
  mode: "sign-in" | "sign-up",
  t: (key: string) => string,
): string {
  const code = (error?.code ?? "").toUpperCase();
  const status = error?.status;
  if (code.startsWith("USER_ALREADY_EXISTS")) return t("emailInUse");
  if (code.includes("PASSWORD_TOO_SHORT")) return t("passwordTooShort");
  if (code === "INVALID_EMAIL") return t("invalidEmail");
  if (code === "EMAIL_NOT_VERIFIED") return t("emailNotVerified");
  if (status === 429 || code === "TOO_MANY_REQUESTS" || code === "RATE_LIMITED")
    return t("tooManyRequests");
  if (code.includes("LOCK")) return t("accountLocked");
  if (code === "BANNED_USER" || code.includes("DISABLED"))
    return t("accountDisabled");
  if (mode === "sign-in") return t("authenticationFailed");
  return error?.message || t("authenticationFailed");
}

export function AuthForm({
  locale,
  mode,
}: {
  locale: AppLocale;
  mode: "sign-in" | "sign-up";
}) {
  const de = locale === "de";
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const redirectAfterAuth = async () => {
    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: string } | undefined)?.role;
    router.push(role === "SUPER_ADMIN" ? "/admin" : `/${locale}/account`);
    router.refresh();
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    if (needsTwoFactor) {
      const code = String(data.get("twoFactorCode") ?? "").trim();
      const result = code.includes("-")
        ? await authClient.twoFactor.verifyBackupCode({
            code,
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) {
        setError(errors("invalidCode"));
        setPending(false);
        return;
      }
      await redirectAfterAuth();
      return;
    }
    const identifier = String(data.get("identifier"));
    const password = String(data.get("password"));
    const result =
      mode === "sign-up"
        ? await signUp.email({
            name: String(data.get("name")),
            email: identifier,
            password,
          })
        : identifier.includes("@")
          ? await signIn.email({ email: identifier, password })
          : await authClient.signIn.username({
              username: identifier,
              password,
            });
    if (result.error) {
      setError(messageForAuthError(result.error, mode, errors));
      setPending(false);
      return;
    }
    if (
      result.data &&
      "twoFactorRedirect" in result.data &&
      result.data.twoFactorRedirect
    ) {
      setNeedsTwoFactor(true);
      setPending(false);
      return;
    }
    await redirectAfterAuth();
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {needsTwoFactor ? (
        <>
          <label htmlFor="twoFactorCode">
            {de
              ? "Authenticator- oder Wiederherstellungscode"
              : "Authenticator or recovery code"}
          </label>
          <input
            id="twoFactorCode"
            name="twoFactorCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </>
      ) : (
        mode === "sign-up" && (
          <>
            <label htmlFor="name">{de ? "Name" : "Name"}</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              minLength={2}
              required
            />
          </>
        )
      )}
      {!needsTwoFactor && (
        <>
          <label htmlFor="identifier">
            {mode === "sign-in"
              ? de
                ? "E-Mail oder Benutzername"
                : "Email or username"
              : "E-Mail"}
          </label>
          <input
            id="identifier"
            name="identifier"
            type={mode === "sign-up" ? "email" : "text"}
            autoComplete={mode === "sign-up" ? "email" : "username"}
            required
          />
          <label htmlFor="password">{de ? "Passwort" : "Password"}</label>
          <PasswordInput
            id="password"
            name="password"
            showLabel={de ? "Passwort anzeigen" : "Show password"}
            hideLabel={de ? "Passwort ausblenden" : "Hide password"}
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            minLength={mode === "sign-up" ? 12 : undefined}
            required
          />
          <small>
            {mode === "sign-up"
              ? de
                ? "Mindestens 12 Zeichen. Verwenden Sie ein einzigartiges Passwort."
                : "At least 12 characters. Use a unique password."
              : ""}
          </small>
        </>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button className="button full" disabled={pending}>
        {pending
          ? de
            ? "Bitte warten…"
            : "Please wait…"
          : mode === "sign-in"
            ? de
              ? "Anmelden"
              : "Sign in"
            : de
              ? "Konto erstellen"
              : "Create account"}
      </button>
    </form>
  );
}
