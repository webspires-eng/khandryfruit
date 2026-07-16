"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/config/site";
import { authClient, signIn, signUp } from "@/lib/auth/client";
import { PasswordInput } from "@/components/ui/password-input";

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
        setError(errors("authenticationFailed"));
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
      setError(errors("authenticationFailed"));
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
            minLength={12}
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
