"use client";

import { MapPin, FileCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TimeUrgency = "akut" | "kommande";

type LogisticsItem = {
  id: string;
  maskin: string;
  kund: string;
  adress: string;
  telefon: string;
  timeLabel: string;
  urgency: TimeUrgency;
};

const MOCK_SKA_UT: LogisticsItem[] = [
  {
    id: "out-1",
    maskin: "Minigrävare 1.8 ton",
    kund: "Byggfirma AB",
    adress: "Industrigatan 12, 451 00 Uddevalla",
    telefon: "070-123 45 67",
    timeLabel: "Skulle hämtats för 1h sen",
    urgency: "akut",
  },
  {
    id: "out-2",
    maskin: "Mobil Bastuvagn Lyx",
    kund: "Event & Fest AB",
    adress: "Strandvägen 8, 451 00 Uddevalla",
    telefon: "076-555 12 34",
    timeLabel: "Om 4 timmar",
    urgency: "kommande",
  },
  {
    id: "out-3",
    maskin: "Hjuldumper Batteri",
    kund: "Trädgårdsdesign i Norden",
    adress: "Trädgårdsvägen 3, 461 00 Vänersborg",
    telefon: "073-987 65 43",
    timeLabel: "Imorgon 08:00",
    urgency: "kommande",
  },
];

const MOCK_SKA_IN: LogisticsItem[] = [
  {
    id: "in-1",
    maskin: "Minigrävare 1.8 ton",
    kund: "Schakt & Mark AB",
    adress: "Skeppsbron 1, 451 00 Uddevalla (lagret)",
    telefon: "0522-123 45",
    timeLabel: "Skulle lämnats tillbaka för 2h sen",
    urgency: "akut",
  },
  {
    id: "in-2",
    maskin: "Hjuldumper Batteri",
    kund: "Privatperson",
    adress: "Villagatan 5, 451 00 Uddevalla",
    telefon: "073-111 22 33",
    timeLabel: "Om 3 timmar",
    urgency: "kommande",
  },
  {
    id: "in-3",
    maskin: "Mobil Bastuvagn Lyx",
    kund: "Villaägarna AB",
    adress: "Skeppsbron 1, 451 00 Uddevalla (lagret)",
    telefon: "076-444 55 66",
    timeLabel: "Imorgon 16:00",
    urgency: "kommande",
  },
];

function TimeBadge({
  label,
  urgency,
}: {
  label: string;
  urgency: TimeUrgency;
}) {
  const styles =
    urgency === "akut"
      ? "bg-red-100 text-red-800"
      : "bg-emerald-100 text-emerald-800";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

function ConfirmModal({
  item,
  type,
  onClose,
  onConfirm,
}: {
  item: LogisticsItem;
  type: "leverans" | "upphämtning";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [maskinOk, setMaskinOk] = useState(false);
  const [bransleOk, setBransleOk] = useState(false);
  const [instruktionerOk, setInstruktionerOk] = useState(false);

  const title =
    type === "leverans" ? "Bekräfta Leverans" : "Bekräfta Upphämtning";
  const showInstruktioner = type === "leverans";
  const canConfirm =
    maskinOk && bransleOk && (showInstruktioner ? instruktionerOk : true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {item.maskin} · {item.kund}
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={maskinOk}
              onChange={(e) => setMaskinOk(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-slate-800">
              Maskin kontrollerad (Inga skador)
            </span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={bransleOk}
              onChange={(e) => setBransleOk(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-slate-800">
              Bränsle kollat
            </span>
          </label>
          {showInstruktioner && (
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={instruktionerOk}
                onChange={(e) => setInstruktionerOk(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Instruktioner givna till kund
              </span>
            </label>
          )}
        </div>
        <div className="flex gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => {
              if (canConfirm) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!canConfirm}
            className="min-h-[48px] flex-1 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition enabled:hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Klarmarkera uppdrag
          </button>
        </div>
      </div>
    </div>
  );
}

function LogisticsCard({
  title,
  items,
  doneIds,
  type,
  onOpenModal,
}: {
  title: string;
  items: LogisticsItem[];
  doneIds: Set<string>;
  type: "leverans" | "upphämtning";
  onOpenModal: (item: LogisticsItem) => void;
}) {
  const visibleItems = items.filter((i) => !doneIds.has(i.id));

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className="text-xl" aria-hidden>
          {type === "leverans" ? "🚛" : "🏠"}
        </span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <ul className="divide-y divide-slate-100 p-4">
        {visibleItems.length === 0 ? (
          <li className="py-12 text-center text-sm text-slate-500">
            Inget planerat för idag
          </li>
        ) : (
          visibleItems.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <TimeBadge label={item.timeLabel} urgency={item.urgency} />
              </div>
              <p className="mb-2 text-base font-semibold leading-snug text-slate-900">
                {item.adress}
              </p>
              <p className="mb-1 text-sm font-medium text-slate-700">
                {item.kund}
              </p>
              <a
                href={`tel:${item.telefon.replace(/\s/g, "")}`}
                className="mb-4 block text-sm font-medium text-amber-700 hover:underline"
              >
                {item.telefon}
              </a>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.adress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <MapPin className="h-5 w-5 shrink-0" aria-hidden />
                  Navigera
                </a>
                <button
                  type="button"
                  onClick={() => onOpenModal(item)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <FileCheck className="h-5 w-5 shrink-0" aria-hidden />
                  Kvittera
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function LogisticsPage() {
  const [utDone, setUtDone] = useState<Set<string>>(new Set());
  const [inDone, setInDone] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{
    item: LogisticsItem;
    type: "leverans" | "upphämtning";
  } | null>(null);

  const handleConfirm = () => {
    if (!modal) return;
    if (modal.type === "leverans") {
      setUtDone((prev) => new Set(prev).add(modal.item.id));
    } else {
      setInDone((prev) => new Set(prev).add(modal.item.id));
    }
    setModal(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logistik</h1>
        <p className="mt-1 text-slate-600">
          Dagens leveranser och upphämtningar – kvittera via besiktningsdialogen
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LogisticsCard
          title="Ska UT till kund (Leveranser)"
          items={MOCK_SKA_UT}
          doneIds={utDone}
          type="leverans"
          onOpenModal={(item) => setModal({ item, type: "leverans" })}
        />
        <LogisticsCard
          title="Ska HEM till lagret (Upphämtningar)"
          items={MOCK_SKA_IN}
          doneIds={inDone}
          type="upphämtning"
          onOpenModal={(item) => setModal({ item, type: "upphämtning" })}
        />
      </div>

      {modal && (
        <ConfirmModal
          key={modal.item.id + modal.type}
          item={modal.item}
          type={modal.type}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
