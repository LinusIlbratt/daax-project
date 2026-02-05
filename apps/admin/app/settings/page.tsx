"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inställningar</h1>
        <p className="mt-1 text-slate-600">Företagsuppgifter och grundinställningar</p>
      </div>

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      >
        {/* Företagsuppgifter */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Företagsuppgifter
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Kontaktinformation som visas för kunder
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="company-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Företagsnamn
              </label>
              <input
                id="company-name"
                name="companyName"
                type="text"
                placeholder="T.ex. Uthyrning AB"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label
                htmlFor="company-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                E-post
              </label>
              <input
                id="company-email"
                name="email"
                type="email"
                placeholder="info@example.se"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label
                htmlFor="company-phone"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Telefon
              </label>
              <input
                id="company-phone"
                name="phone"
                type="tel"
                placeholder="070-123 45 67"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Spara ändringar
          </button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600">
              Ändringar sparade
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
