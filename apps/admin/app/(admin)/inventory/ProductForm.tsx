"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductCategory, ProductRow } from "@/lib/supabase/product-types";

const AGREEMENT_OPTIONS = [
  { value: "standard-uthyrning", label: "Standarduthyrning" },
  { value: "bastu-uthyrning", label: "Bastu-uthyrning" },
] as const;

export type ProductFormSubmitPayload = {
  mode: "create" | "edit";
  editSlug: string | null;
  title: string;
  category: ProductCategory;
  description: string;
  info: string | null;
  agreement: string;
  priceDay: number;
  priceWeek: number;
  priceMonth: number;
  requiresDelivery: boolean;
  isActive: boolean;
  existingImageUrl: string;
};

type FormState = {
  title: string;
  category: ProductCategory;
  description: string;
  info: string;
  agreement: string;
  priceDay: string;
  priceWeek: string;
  priceMonth: string;
  requiresDelivery: boolean;
  isActive: boolean;
  imageUrl: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    category: "entreprenad",
    description: "",
    info: "",
    agreement: "standard-uthyrning",
    priceDay: "",
    priceWeek: "",
    priceMonth: "",
    requiresDelivery: false,
    isActive: true,
    imageUrl: "",
  };
}

function rowToForm(row: ProductRow): FormState {
  return {
    title: row.name,
    category: row.category,
    description: row.description,
    info: row.info ?? "",
    agreement: row.agreement,
    priceDay: String(row.price_per_day),
    priceWeek: String(row.price_per_week),
    priceMonth: String(row.price_per_month),
    requiresDelivery: row.requires_delivery,
    isActive: row.is_active,
    imageUrl: row.image ?? "",
  };
}

function parseNonNegativeInt(raw: string, label: string): { ok: true; value: number } | { ok: false; message: string } {
  const t = raw.trim();
  if (t === "") return { ok: false, message: `Ange ${label}.` };
  const n = Number(t);
  if (!Number.isInteger(n) || n < 0) {
    return { ok: false, message: `${label} måste vara ett heltal ≥ 0.` };
  }
  return { ok: true, value: n };
}

type ProductFormProps = {
  mode: "create" | "edit";
  editSlug: string | null;
  initialLoading: boolean;
  initialProduct: ProductRow | null;
  saving: boolean;
  externalError: string | null;
  onClose: () => void;
  onSubmit: (payload: ProductFormSubmitPayload, newImageFile: File | null) => void | Promise<void>;
};

export function ProductForm({
  mode,
  editSlug,
  initialLoading,
  initialProduct,
  saving,
  externalError,
  onClose,
  onSubmit,
}: ProductFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "edit" && initialProduct) {
      setForm(rowToForm(initialProduct));
      setPendingFile(null);
      setLocalError(null);
    }
    if (mode === "create" && !initialLoading) {
      setForm(emptyForm());
      setPendingFile(null);
      setLocalError(null);
    }
  }, [mode, initialProduct, initialLoading]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pendingFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
  }, []);

  const clearPendingImage = useCallback(() => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = () => {
    setLocalError(null);
    const title = form.title.trim();
    if (!title) {
      setLocalError("Ange en titel.");
      return;
    }
    const description = form.description.trim();
    if (!description) {
      setLocalError("Ange en beskrivning.");
      return;
    }
    const d = parseNonNegativeInt(form.priceDay, "dagspris");
    const w = parseNonNegativeInt(form.priceWeek, "veckopris");
    const m = parseNonNegativeInt(form.priceMonth, "månadspris");
    if (!d.ok) {
      setLocalError(d.message);
      return;
    }
    if (!w.ok) {
      setLocalError(w.message);
      return;
    }
    if (!m.ok) {
      setLocalError(m.message);
      return;
    }
    const agreementOk = AGREEMENT_OPTIONS.some((o) => o.value === form.agreement);
    if (!agreementOk) {
      setLocalError("Välj avtalstyp.");
      return;
    }
    if (mode === "edit" && !editSlug) {
      setLocalError("Saknar objekt-id (slug).");
      return;
    }

    const infoTrim = form.info.trim();
    const payload: ProductFormSubmitPayload = {
      mode,
      editSlug: mode === "edit" ? editSlug : null,
      title,
      category: form.category,
      description,
      info: infoTrim === "" ? null : infoTrim,
      agreement: form.agreement,
      priceDay: d.value,
      priceWeek: w.value,
      priceMonth: m.value,
      requiresDelivery: form.requiresDelivery,
      isActive: form.isActive,
      existingImageUrl: form.imageUrl.trim(),
    };
    void onSubmit(payload, pendingFile);
  };

  const displayError = localError ?? externalError;
  const titleId = mode === "edit" ? "edit-product-modal-title" : "add-product-modal-title";
  const heading = mode === "edit" ? "Redigera hyrobjekt" : "Nytt hyrobjekt";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] shadow-admin-lg">
        <div className="sticky top-0 z-10 border-b border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-[rgb(var(--admin-text))]">
            {heading}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">
            {mode === "create"
              ? "Unik slug skapas från titeln vid sparning. Bilder laddas upp till Supabase Storage (product-images)."
              : "Ändringar sparas i samma post (slug ändras inte)."}
          </p>
        </div>

        {initialLoading ? (
          <div className="flex items-center gap-3 px-6 py-16">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-[rgb(var(--admin-primary))] border-t-transparent"
              aria-hidden
            />
            <p className="text-sm text-[rgb(var(--admin-text-muted))]">Laddar objekt…</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 px-6 py-5">
              {displayError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-4 py-3 text-sm text-[rgb(var(--admin-error))]"
                >
                  {displayError}
                </div>
              ) : null}

              {mode === "edit" && editSlug ? (
                <div>
                  <span className="admin-label">Slug (kan inte ändras)</span>
                  <p className="rounded-xl border border-[rgb(var(--admin-border-muted))] bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-[rgb(var(--admin-text))]">
                    {editSlug}
                  </p>
                </div>
              ) : null}

              <div>
                <label htmlFor="pf-title" className="admin-label">
                  Titel *
                </label>
                <input
                  id="pf-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="admin-input"
                  placeholder="t.ex. Minigrävare 1.5t"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="pf-description" className="admin-label">
                  Beskrivning (info) *
                </label>
                <p className="mb-1.5 text-xs text-[rgb(var(--admin-text-muted))]">
                  Huvudtext som visas på kundportalen.
                </p>
                <textarea
                  id="pf-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={10}
                  className="admin-input min-h-[200px] resize-y"
                  placeholder="Beskriv hyrobjektet i detalj…"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="pf-info" className="admin-label">
                  Kort tilläggsinfo (valfritt)
                </label>
                <p className="mb-1.5 text-xs text-[rgb(var(--admin-text-muted))]">
                  T.ex. kapacitet eller extra villkor i kort form.
                </p>
                <textarea
                  id="pf-info"
                  value={form.info}
                  onChange={(e) => setForm((f) => ({ ...f, info: e.target.value }))}
                  rows={2}
                  className="admin-input min-h-[64px] resize-y"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="pf-category" className="admin-label">
                  Kategori *
                </label>
                <select
                  id="pf-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                  className="admin-input"
                  disabled={saving}
                >
                  <option value="entreprenad">Maskin</option>
                  <option value="event">Bastu & Event</option>
                </select>
              </div>

              <div>
                <label htmlFor="pf-agreement" className="admin-label">
                  Avtalstyp *
                </label>
                <select
                  id="pf-agreement"
                  value={form.agreement}
                  onChange={(e) => setForm((f) => ({ ...f, agreement: e.target.value }))}
                  className="admin-input"
                  disabled={saving}
                >
                  {AGREEMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="pf-price-day" className="admin-label">
                    Dagspris (kr) *
                  </label>
                  <input
                    id="pf-price-day"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={form.priceDay}
                    onChange={(e) => setForm((f) => ({ ...f, priceDay: e.target.value }))}
                    className="admin-input"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label htmlFor="pf-price-week" className="admin-label">
                    Veckopris (kr) *
                  </label>
                  <input
                    id="pf-price-week"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={form.priceWeek}
                    onChange={(e) => setForm((f) => ({ ...f, priceWeek: e.target.value }))}
                    className="admin-input"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label htmlFor="pf-price-month" className="admin-label">
                    Månadspris (kr) *
                  </label>
                  <input
                    id="pf-price-month"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={form.priceMonth}
                    onChange={(e) => setForm((f) => ({ ...f, priceMonth: e.target.value }))}
                    className="admin-input"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[rgb(var(--admin-border-muted))] p-4">
                <span className="admin-label">Bild</span>
                <p className="mb-3 text-xs text-[rgb(var(--admin-text-muted))]">
                  JPEG, PNG, WebP eller GIF, max 5 MB. Sparas i Supabase Storage och den publika adressen läggs in som
                  produktbild.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onFileChange}
                  disabled={saving}
                  className="block w-full text-sm text-[rgb(var(--admin-text-muted))] file:mr-3 file:rounded-lg file:border-0 file:bg-[rgb(var(--admin-primary-muted))] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[rgb(var(--admin-primary))]"
                />
                {pendingFile ? (
                  <div className="mt-3 flex items-start gap-3">
                    {previewUrl ? (
                      <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-[rgb(var(--admin-border))] bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
                        <img src={previewUrl} alt="Förhandsvisning av vald bild" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <button type="button" onClick={clearPendingImage} className="admin-btn-secondary text-xs" disabled={saving}>
                      Ta bort vald fil
                    </button>
                  </div>
                ) : form.imageUrl ? (
                  <div className="mt-3">
                    <p className="mb-2 text-xs text-[rgb(var(--admin-text-muted))]">Nuvarande bild-URL:</p>
                    <div className="relative h-28 max-w-xs overflow-hidden rounded-xl border border-[rgb(var(--admin-border))] bg-slate-100">
                      {form.imageUrl.startsWith("http") ? (
                        // eslint-disable-next-line @next/next/no-img-element -- extern Supabase-URL
                        <img src={form.imageUrl} alt="Produktbild" className="mx-auto h-full max-h-28 w-auto object-contain p-1" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-xs text-[rgb(var(--admin-text-muted))]">
                          Relativ sökväg (kundapp): {form.imageUrl}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[rgb(var(--admin-text-muted))]">Ingen bild ännu.</p>
                )}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-[rgb(var(--admin-border-muted))] p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={form.requiresDelivery}
                    onChange={(e) => setForm((f) => ({ ...f, requiresDelivery: e.target.checked }))}
                    disabled={saving}
                    className="h-4 w-4 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]"
                  />
                  <span className="text-sm font-medium text-[rgb(var(--admin-text))]">Kräver utkörning</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    disabled={saving}
                    className="h-4 w-4 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]"
                  />
                  <span className="text-sm font-medium text-[rgb(var(--admin-text))]">Synlig på kundportalen</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] px-6 py-4">
              <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
                Avbryt
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="admin-btn-primary">
                {saving ? "Sparar…" : "Spara"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
