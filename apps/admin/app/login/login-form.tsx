"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Fel e-postadress eller lösenord.";
    case "email_not_confirmed":
      return "Bekräfta din e-postadress innan du loggar in.";
    case "user_banned":
      return "Det här kontot är spärrat. Kontakta administratören.";
    case "too_many_requests":
      return "För många försök. Vänta en stund och försök igen.";
    default:
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return "Fel e-postadress eller lösenord.";
      }
      return error.message || "Inloggningen misslyckades. Försök igen.";
  }
}

function mapUnknownError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) {
      return msg;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Ett oväntat fel inträffade. Försök igen.";
}

type LoginFormProps = {
  showConfigError: boolean;
  showUnauthorizedError?: boolean;
};

export function LoginForm({
  showConfigError,
  showUnauthorizedError = false,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const configBlocked = !isSupabaseConfigured();
  const configMessage =
    showConfigError || configBlocked
      ? "Supabase är inte konfigurerat (saknar NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_ANON_KEY). Kontrollera miljövariabler."
      : null;

  const unauthorizedMessage = showUnauthorizedError
    ? "Du har inte behörighet att använda admin. Kontakta en administratör om du behöver åtkomst."
    : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (configBlocked) {
      setFormError(configMessage);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("login: signInWithPassword", error.message, error);
        setFormError(mapAuthError(error));
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("login: signInWithPassword", err);
      setFormError(mapUnknownError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="admin-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-[rgb(var(--admin-text))]">Admin</h1>
          <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">Logga in med e-post och lösenord</p>
        </div>

        {configMessage ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-4 py-3 text-sm text-[rgb(var(--admin-error))]"
          >
            {configMessage}
          </div>
        ) : null}

        {unauthorizedMessage ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-4 py-3 text-sm text-[rgb(var(--admin-error))]"
          >
            {unauthorizedMessage}
          </div>
        ) : null}

        {formError ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-4 py-3 text-sm text-[rgb(var(--admin-error))]"
          >
            {formError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="admin-label">
              E-post
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="admin-input"
              disabled={submitting || configBlocked}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="admin-label">
              Lösenord
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="admin-input"
              disabled={submitting || configBlocked}
            />
          </div>
          <button
            type="submit"
            className="admin-btn-primary mt-2 w-full"
            disabled={submitting || configBlocked}
          >
            {submitting ? "Loggar in…" : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}
