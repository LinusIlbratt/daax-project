"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, X, Upload, Users, Shield } from "lucide-react";

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

/* Avtal */
type AgreementType = "maskiner" | "bastu";

type Agreement = {
  id: string;
  title: string;
  type: AgreementType;
  fileName: string | null;
  fileUrl: string | null;
};

type Signee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  agreementTitle: string;
  agreementType: AgreementType;
  signedAt: string;
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
    if (!raw) return getDefaultAgreements();
    const parsed = JSON.parse(raw) as (Omit<Agreement, "fileUrl"> & { fileUrl?: string })[];
    if (!Array.isArray(parsed)) return getDefaultAgreements();
    return parsed.map((a) => ({ ...a, fileUrl: null }));
  } catch {
    return getDefaultAgreements();
  }
}

function getDefaultAgreements(): Agreement[] {
  return [
    { id: "1", title: "Standardavtal maskinuthyrning", type: "maskiner", fileName: null, fileUrl: null },
    { id: "2", title: "Avtal bastuuthyrning", type: "bastu", fileName: null, fileUrl: null },
  ];
}

function saveAgreementsToStorage(agreements: Agreement[]) {
  if (typeof window === "undefined") return;
  const toSave = agreements.map(({ fileUrl, ...rest }) => rest);
  localStorage.setItem(AVTAL_STORAGE_KEY, JSON.stringify(toSave));
}

const MOCK_SIGNEES: Signee[] = [
  { id: "s1", name: "Bygg AB", email: "bestallning@byggab.se", phone: "070-123 45 67", agreementTitle: "Standardavtal maskinuthyrning", agreementType: "maskiner", signedAt: "2025-01-15T10:32:00" },
  { id: "s2", name: "Anna Andersson", email: "anna.andersson@example.com", phone: "073-987 65 43", agreementTitle: "Avtal bastuuthyrning", agreementType: "bastu", signedAt: "2025-01-20T14:05:00" },
  { id: "s3", name: "Gröntan AB", email: "info@grontan.se", phone: "070-111 22 33", agreementTitle: "Standardavtal maskinuthyrning", agreementType: "maskiner", signedAt: "2025-01-18T09:15:00" },
  { id: "s4", name: "Event & Fest AB", email: "bokning@eventfest.se", phone: "076-555 12 34", agreementTitle: "Avtal bastuuthyrning", agreementType: "bastu", signedAt: "2025-01-22T11:20:00" },
];

function formatSignedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [emailOnNewBooking, setEmailOnNewBooking] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>(getDefaultAgreements());
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

  const openView = (a: Agreement) => setViewingAgreement(a);
  const closeView = () => setViewingAgreement(null);

  const handleUpload = () => {
    if (!uploadFile || !uploadFile.type.includes("pdf")) return;
    setUploading(true);
    const fileUrl = URL.createObjectURL(uploadFile);
    const agreement = agreements.find((a) => a.type === uploadType);
    const next = agreement
      ? agreements.map((a) => (a.type === uploadType ? { ...a, fileName: uploadFile.name, fileUrl } : a))
      : [...agreements, { id: crypto.randomUUID(), title: TYPE_LABEL[uploadType] + " – uppladdad", type: uploadType, fileName: uploadFile.name, fileUrl }];
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
          Företag, notiser och avtal för uthyrningen
        </p>
      </div>

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      >
        <section className="admin-card p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Företagsuppgifter</h2>
          <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">Kontaktinformation som visas för kunder</p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="company-name" className="admin-label">Företagsnamn</label>
              <input id="company-name" name="companyName" type="text" placeholder="T.ex. Uthyrning AB" className="admin-input" />
            </div>
            <div>
              <label htmlFor="company-email" className="admin-label">E-post</label>
              <input id="company-email" name="email" type="email" placeholder="info@example.se" className="admin-input" />
            </div>
            <div>
              <label htmlFor="company-phone" className="admin-label">Telefon</label>
              <input id="company-phone" name="phone" type="tel" placeholder="070-123 45 67" className="admin-input" />
            </div>
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Notiser</h2>
          <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">Skicka mejl vid nya bokningar (kräver att mejl är konfigurerat)</p>
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
            <label htmlFor="email-on-booking" className="text-sm font-medium text-[rgb(var(--admin-text))]">Skicka mejl vid ny bokning</label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" className="admin-btn-primary">Spara ändringar</button>
          {saved && <span className="text-sm font-medium text-emerald-600">Ändringar sparade</span>}
        </div>
      </form>

      {/* Avtal */}
      <section>
        <h2 className="text-lg font-semibold text-[rgb(var(--admin-text))]">Avtal</h2>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">PDF-avtal för maskiner och bastu. Klicka på ett avtal för att läsa, ladda upp nytt nedan.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="admin-card admin-card-hover flex cursor-pointer items-center gap-4 p-5"
              onClick={() => openView(agreement)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openView(agreement); } }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--admin-primary-muted))] text-[rgb(var(--admin-primary))]">
                <FileText className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[rgb(var(--admin-text))]">{agreement.title}</p>
                <p className="text-sm text-[rgb(var(--admin-text-muted))]">
                  {TYPE_LABEL[agreement.type]}
                  {agreement.fileName && <span className="ml-2 text-[rgb(var(--admin-text-subtle))]">· {agreement.fileName}</span>}
                </p>
              </div>
              <span className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">Visa →</span>
            </div>
          ))}
        </div>
        <div className="admin-card mt-4 flex flex-wrap items-end gap-4 p-5">
          <div>
            <label className="admin-label">Avtal för</label>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value as AgreementType)} className="admin-input w-auto min-w-[180px]">
              <option value="maskiner">Maskiner</option>
              <option value="bastu">Bastu & Event</option>
            </select>
          </div>
          <div>
            <label className="admin-label">PDF-fil</label>
            <input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-[rgb(var(--admin-text-muted))] file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium file:text-[rgb(var(--admin-text))]" />
          </div>
          <button type="button" onClick={handleUpload} disabled={!uploadFile || uploading} className="admin-btn-primary">
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? "Laddar upp…" : "Ladda upp"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[rgb(var(--admin-text-subtle))]">PDF sparas i webbläsaren tills sidan laddas om.</p>

        <h3 className="mt-8 flex items-center gap-2 text-base font-semibold text-[rgb(var(--admin-text))]">
          <Shield className="h-5 w-5 text-[rgb(var(--admin-text-muted))]" aria-hidden />
          Kunder som signerat med BankID
        </h3>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">Lista över alla som signerat ert avtal digitalt.</p>
        <div className="admin-card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[rgb(var(--admin-border))] bg-slate-50/80">
                  <th className="admin-table-th">Kund</th>
                  <th className="admin-table-th">E-post</th>
                  <th className="admin-table-th">Telefon</th>
                  <th className="admin-table-th">Avtal</th>
                  <th className="admin-table-th">Signerad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--admin-border-muted))]">
                {MOCK_SIGNEES.map((signee) => (
                  <tr key={signee.id} className="bg-white transition hover:bg-slate-50/50">
                    <td className="admin-table-td font-medium text-[rgb(var(--admin-text))]">{signee.name}</td>
                    <td className="admin-table-td">
                      <a href={`mailto:${signee.email}`} className="text-[rgb(var(--admin-primary))] hover:underline">{signee.email}</a>
                    </td>
                    <td className="admin-table-td">
                      <a href={`tel:${signee.phone}`} className="text-[rgb(var(--admin-primary))] hover:underline">{signee.phone}</a>
                    </td>
                    <td className="admin-table-td">
                      <span className={`admin-badge ${signee.agreementType === "maskiner" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
                        {TYPE_LABEL[signee.agreementType]}
                      </span>
                    </td>
                    <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">{formatSignedAt(signee.signedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-[rgb(var(--admin-text-muted))]">
          <Users className="h-4 w-4" aria-hidden />
          {MOCK_SIGNEES.length} kunder har signerat.
        </p>
      </section>

      {viewingAgreement && (
        <AgreementViewOverlay agreement={viewingAgreement} onClose={closeView} />
      )}
    </div>
  );
}

function AgreementViewOverlay({ agreement, onClose }: { agreement: Agreement; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-4 z-50 flex flex-col rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] shadow-admin-lg sm:inset-8" role="dialog" aria-modal="true" aria-labelledby="avtal-overlay-title">
        <div className="flex shrink-0 items-center justify-between border-b border-[rgb(var(--admin-border))] px-6 py-4">
          <h2 id="avtal-overlay-title" className="text-lg font-semibold text-[rgb(var(--admin-text))]">{agreement.title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]" aria-label="Stäng">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {agreement.fileUrl ? (
            <iframe src={agreement.fileUrl} title={agreement.title} className="h-full w-full rounded-xl border border-[rgb(var(--admin-border))]" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgb(var(--admin-border))] bg-slate-50/50 p-8 text-center">
              <FileText className="h-12 w-12 text-slate-400" aria-hidden />
              <p className="mt-4 font-medium text-[rgb(var(--admin-text-muted))]">Ingen PDF uppladdad än</p>
              <p className="mt-1 text-sm text-[rgb(var(--admin-text-subtle))]">Använd formuläret ovan och välj {TYPE_LABEL[agreement.type]} för att ladda upp en PDF.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
