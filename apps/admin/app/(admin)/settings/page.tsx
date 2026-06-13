"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, X, Upload, Shield } from "lucide-react";

const EMAIL_ON_BOOKING_KEY = "admin-email-on-new-booking";

function getEmailOnBooking(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EMAIL_ON_BOOKING_KEY) === "true";
  } catch {
    return false;
  }
}

function setEmailOnBooking(value: boolean) {
  try {
    localStorage.setItem(EMAIL_ON_BOOKING_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
}

type AgreementType = "maskiner" | "bastu";

type Agreement = {
  id: string;
  title: string;
  type: AgreementType;
  fileName: string | null;
  fileUrl: string | null;
};

const TYPE_LABEL: Record<AgreementType, string> = {
  maskiner: "Maskiner",
  bastu: "Bastu & Event",
};

const AVTAL_STORAGE_KEY = "admin-avtal";

function loadAgreementsFromStorage(): Agreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AVTAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (Omit<Agreement, "fileUrl"> & { fileUrl?: string })[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((a) => ({ ...a, fileUrl: null }));
  } catch {
    return [];
  }
}

function saveAgreementsToStorage(agreements: Agreement[]) {
  if (typeof window === "undefined") return;
  const toSave = agreements.map(({ fileUrl, ...rest }) => rest);
  localStorage.setItem(AVTAL_STORAGE_KEY, JSON.stringify(toSave));
}

export default function SettingsPage() {
  const [emailOnNewBooking, setEmailOnNewBooking] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  const [uploadType, setUploadType] = useState<AgreementType>("maskiner");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setEmailOnNewBooking(getEmailOnBooking()), []);
  useEffect(() => setAgreements(loadAgreementsFromStorage()), []);

  const persistAgreements = useCallback((next: Agreement[]) => {
    setAgreements(next);
    saveAgreementsToStorage(next);
  }, []);

  const handleUpload = () => {
    if (!uploadFile || !uploadFile.type.includes("pdf")) return;
    setUploading(true);
    const fileUrl = URL.createObjectURL(uploadFile);
    const existing = agreements.find((a) => a.type === uploadType);
    const next = existing
      ? agreements.map((a) =>
          a.type === uploadType
            ? { ...a, fileName: uploadFile.name, fileUrl, title: `${TYPE_LABEL[uploadType]} – ${uploadFile.name}` }
            : a
        )
      : [
          ...agreements,
          {
            id: crypto.randomUUID(),
            title: `${TYPE_LABEL[uploadType]} – ${uploadFile.name}`,
            type: uploadType,
            fileName: uploadFile.name,
            fileUrl,
          },
        ];
    persistAgreements(next);
    setUploadFile(null);
    setUploading(false);
    setViewingAgreement(next.find((a) => a.type === uploadType) ?? next[next.length - 1]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
          Inställningar
        </h1>
        <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
          Företagsuppgifter och avtal — vissa delar kommer i nästa version.
        </p>
      </div>

      <section className="admin-card p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Företagsuppgifter</h2>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">
          Kommer snart — kontaktuppgifter på webben styrs tills vidare i koden.
        </p>
      </section>

      <section className="admin-card p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Notiser</h2>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">
          Sparas i webbläsaren på den här datorn — inte i molnet ännu.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            id="email-on-booking"
            type="checkbox"
            checked={emailOnNewBooking}
            onChange={(e) => {
              const v = e.target.checked;
              setEmailOnNewBooking(v);
              setEmailOnBooking(v);
            }}
            className="h-4 w-4 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]"
          />
          <label htmlFor="email-on-booking" className="text-sm font-medium text-[rgb(var(--admin-text))]">
            Påminn mig vid ny bokning (lokal inställning)
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Avtal (PDF)</h2>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">
          Avtal per hyrobjekt sätts under Hyrobjekt. Här kan du tillfälligt förhandsgranska PDF
          (sparas bara i webbläsaren tills sidan laddas om).
        </p>

        {agreements.length === 0 ? (
          <div className="admin-card mt-4 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
            <p className="mt-3 font-medium text-[rgb(var(--admin-text))]">Inga PDF-avtal uppladdade</p>
            <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">
              Ladda upp ett avtal nedan om du vill förhandsgranska det här.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {agreements.map((agreement) => (
              <button
                key={agreement.id}
                type="button"
                onClick={() => setViewingAgreement(agreement)}
                className="admin-card admin-card-hover flex items-center gap-4 p-5 text-left"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--admin-primary-muted))] text-[rgb(var(--admin-primary))]">
                  <FileText className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[rgb(var(--admin-text))]">{agreement.title}</p>
                  <p className="text-sm text-[rgb(var(--admin-text-muted))]">
                    {TYPE_LABEL[agreement.type]}
                    {agreement.fileName ? (
                      <span className="ml-2 text-[rgb(var(--admin-text-subtle))]">· {agreement.fileName}</span>
                    ) : null}
                  </p>
                </div>
                <span className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">Visa →</span>
              </button>
            ))}
          </div>
        )}

        <div className="admin-card mt-4 flex flex-wrap items-end gap-4 p-5">
          <div>
            <label className="admin-label">Avtal för</label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as AgreementType)}
              className="admin-input w-auto min-w-[180px]"
            >
              <option value="maskiner">Maskiner</option>
              <option value="bastu">Bastu & Event</option>
            </select>
          </div>
          <div>
            <label className="admin-label">PDF-fil</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[rgb(var(--admin-text-muted))] file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium file:text-[rgb(var(--admin-text))]"
            />
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="admin-btn-primary"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? "Laddar upp…" : "Ladda upp"}
          </button>
        </div>

        <div className="admin-card mt-8 border-dashed p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[rgb(var(--admin-text))]">
            <Shield className="h-5 w-5 text-[rgb(var(--admin-text-muted))]" aria-hidden />
            BankID-signering
          </h3>
          <p className="mt-2 text-sm text-[rgb(var(--admin-text-muted))]">
            Digital signering med BankID kommer i en senare version. Kunder godkänner avtal med
            kryssruta vid bokning idag.
          </p>
        </div>
      </section>

      {viewingAgreement ? (
        <AgreementViewOverlay agreement={viewingAgreement} onClose={() => setViewingAgreement(null)} />
      ) : null}
    </div>
  );
}

function AgreementViewOverlay({
  agreement,
  onClose,
}: {
  agreement: Agreement;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-4 z-50 flex flex-col rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] shadow-admin-lg sm:inset-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avtal-overlay-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[rgb(var(--admin-border))] px-6 py-4">
          <h2 id="avtal-overlay-title" className="text-lg font-semibold text-[rgb(var(--admin-text))]">
            {agreement.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {agreement.fileUrl ? (
            <iframe
              src={agreement.fileUrl}
              title={agreement.title}
              className="h-full w-full rounded-xl border border-[rgb(var(--admin-border))]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgb(var(--admin-border))] bg-slate-50/50 p-8 text-center">
              <FileText className="h-12 w-12 text-slate-400" aria-hidden />
              <p className="mt-4 font-medium text-[rgb(var(--admin-text-muted))]">Ingen PDF tillgänglig</p>
              <p className="mt-1 text-sm text-[rgb(var(--admin-text-subtle))]">
                Ladda upp PDF igen om förhandsgranskning behövs.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
