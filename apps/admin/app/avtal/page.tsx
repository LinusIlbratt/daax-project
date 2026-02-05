"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, X, Upload, Users, Shield } from "lucide-react";

type AgreementType = "maskiner" | "bastu";

type Agreement = {
  id: string;
  title: string;
  type: AgreementType;
  fileName: string | null;
  /** Blob URL för uppladdad fil (session only). */
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

const STORAGE_KEY = "admin-avtal";

function loadAgreementsFromStorage(): Agreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

const MOCK_SIGNEES: Signee[] = [
  {
    id: "s1",
    name: "Bygg AB",
    email: "bestallning@byggab.se",
    phone: "070-123 45 67",
    agreementTitle: "Standardavtal maskinuthyrning",
    agreementType: "maskiner",
    signedAt: "2025-01-15T10:32:00",
  },
  {
    id: "s2",
    name: "Anna Andersson",
    email: "anna.andersson@example.com",
    phone: "073-987 65 43",
    agreementTitle: "Avtal bastuuthyrning",
    agreementType: "bastu",
    signedAt: "2025-01-20T14:05:00",
  },
  {
    id: "s3",
    name: "Gröntan AB",
    email: "info@grontan.se",
    phone: "070-111 22 33",
    agreementTitle: "Standardavtal maskinuthyrning",
    agreementType: "maskiner",
    signedAt: "2025-01-18T09:15:00",
  },
  {
    id: "s4",
    name: "Event & Fest AB",
    email: "bokning@eventfest.se",
    phone: "076-555 12 34",
    agreementTitle: "Avtal bastuuthyrning",
    agreementType: "bastu",
    signedAt: "2025-01-22T11:20:00",
  },
];

function formatSignedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AvtalPage() {
  const [agreements, setAgreements] = useState<Agreement[]>(getDefaultAgreements());
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  const [uploadType, setUploadType] = useState<AgreementType>("maskiner");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAgreements(loadAgreementsFromStorage());
  }, []);

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
      ? agreements.map((a) =>
          a.type === uploadType
            ? { ...a, fileName: uploadFile.name, fileUrl }
            : a
        )
      : [
          ...agreements,
          {
            id: crypto.randomUUID(),
            title: TYPE_LABEL[uploadType] + " – uppladdad",
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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Avtal</h1>
        <p className="mt-1 text-slate-600">
          Hantera avtal för maskinuthyrning och bastu. Ladda upp PDF:er och se vilka kunder som signerat med BankID.
        </p>
      </div>

      {/* Aktiva avtal */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Aktiva avtal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Klicka på ett avtal för att läsa det. Byt PDF via formuläret nedan.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              onClick={() => openView(agreement)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openView(agreement);
                }
              }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <FileText className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{agreement.title}</p>
                <p className="text-sm text-slate-600">
                  {TYPE_LABEL[agreement.type]}
                  {agreement.fileName && (
                    <span className="ml-2 text-slate-500">· {agreement.fileName}</span>
                  )}
                </p>
              </div>
              <span className="text-sm font-medium text-slate-500">Visa →</span>
            </div>
          ))}
        </div>
      </section>

      {/* Ladda upp / Byt PDF */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ladda upp avtal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Välj om avtalet gäller maskiner eller bastu och ladda upp en PDF-fil. Befintligt avtal för vald typ ersätts.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Avtal för
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as AgreementType)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="maskiner">Maskiner</option>
              <option value="bastu">Bastu & Event</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              PDF-fil
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-slate-700"
            />
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? "Laddar upp…" : "Ladda upp"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          I prototypen sparas PDF:en i webbläsaren tills sidan laddas om. När backend är kopplad sparas filen på servern.
        </p>
      </section>

      {/* Kunder som signerat */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Shield className="h-5 w-5 text-slate-600" aria-hidden />
          Kunder som signerat med BankID
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Lista över alla som signerat ert avtal digitalt. Klicka på en rad för att se uppgifter.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    E-post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Avtal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Signerad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {MOCK_SIGNEES.map((signee) => (
                  <tr
                    key={signee.id}
                    className="bg-white transition hover:bg-slate-50/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {signee.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      <a
                        href={`mailto:${signee.email}`}
                        className="text-slate-700 underline hover:text-slate-900"
                      >
                        {signee.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      <a
                        href={`tel:${signee.phone}`}
                        className="text-slate-700 underline hover:text-slate-900"
                      >
                        {signee.phone}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          signee.agreementType === "maskiner"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {TYPE_LABEL[signee.agreementType]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatSignedAt(signee.signedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Users className="h-4 w-4" aria-hidden />
          {MOCK_SIGNEES.length} kunder har signerat. När BankID-integration är kopplad hämtas listan automatiskt.
        </p>
      </section>

      {/* Overlay: läsa avtal */}
      {viewingAgreement && (
        <AgreementViewOverlay
          agreement={viewingAgreement}
          onClose={closeView}
        />
      )}
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
      <div
        className="fixed inset-0 z-50 bg-slate-900/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-4 z-50 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl sm:inset-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avtal-overlay-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="avtal-overlay-title" className="text-lg font-semibold text-slate-900">
            {agreement.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
              className="h-full w-full rounded-lg border border-slate-200"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <FileText className="h-12 w-12 text-slate-400" aria-hidden />
              <p className="mt-4 font-medium text-slate-700">
                Ingen PDF uppladdad än
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Använd formuläret &quot;Ladda upp avtal&quot; och välj {TYPE_LABEL[agreement.type]} för att ladda upp en PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
