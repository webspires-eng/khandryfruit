"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/config/site";
import { signIn, signUp } from "@/lib/auth/client";

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
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const result =
      mode === "sign-up"
        ? await signUp.email({
            name: String(data.get("name")),
            email,
            password,
          })
        : await signIn.email({ email, password });
    if (result.error) {
      setError(errors("authenticationFailed"));
      setPending(false);
      return;
    }
    router.push(`/${locale}/account`);
    router.refresh();
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "sign-up" && (
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
      )}
      <label htmlFor="email">E-Mail</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label htmlFor="password">{de ? "Passwort" : "Password"}</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
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
