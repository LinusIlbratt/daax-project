"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Truck,
  TrendingUp,
  Calendar,
  PackageCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  CheckCircle2,
  Pin,
} from "lucide-react";

const MOCK_PRODUCTS = [
  "Minigrävare 1.8 ton",
  "Hjuldumper Batteri",
  "Mobil Bastuvagn Lyx",
] as const;

type BookingStatus = "uthyrd" | "preliminär" | "service";

type MockBooking = {
  id: string;
  machineIndex: number;
  startDay: number;
  endDay: number;
  status: BookingStatus;
  kund: string;
  tel: string;
  /** Dagar sedan bokningen skapades (negativ = i det förflutna). -3 = bokad för 3 dagar sedan. */
  createdDay: number;
};

const MOCK_BOOKINGS: MockBooking[] = [
  { id: "b1", machineIndex: 0, startDay: 2, endDay: 4, status: "uthyrd", kund: "Bygg AB", tel: "070-123 45 67", createdDay: -5 },
  { id: "b2", machineIndex: 1, startDay: 5, endDay: 5, status: "preliminär", kund: "Privatperson", tel: "073-987 65 43", createdDay: -2 },
  { id: "b3", machineIndex: 2, startDay: 1, endDay: 3, status: "uthyrd", kund: "Event & Fest AB", tel: "076-555 12 34", createdDay: -1 },
  { id: "b4", machineIndex: 0, startDay: 8, endDay: 9, status: "service", kund: "—", tel: "—", createdDay: -10 },
  { id: "b5", machineIndex: 1, startDay: 0, endDay: 2, status: "uthyrd", kund: "Gröntan AB", tel: "070-111 22 33", createdDay: -3 },
];

function getNextDays(count: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    days.push(day);
  }
  return days;
}

function formatDay(dayIndex: number): string {
  const days = getNextDays(14);
  const d = days[dayIndex];
  return d ? d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" }) : "—";
}

const TODAY_INDEX = 0;

type AdminEventType = "ny_bokning" | "leverans" | "hämtning" | "preliminär" | "service";

type AdminEvent = {
  id: string;
  type: AdminEventType;
  dayIndex: number;
  label: string;
  subtitle: string;
  product: string;
  bookingId: string;
};

function buildAdminEvents(): AdminEvent[] {
  const events: AdminEvent[] = [];
  MOCK_BOOKINGS.forEach((b) => {
    const product = MOCK_PRODUCTS[b.machineIndex];
    if (b.createdDay >= -7) {
      events.push({
        id: `${b.id}-ny`,
        type: "ny_bokning",
        dayIndex: b.createdDay,
        label: "Ny bokning",
        subtitle: `${product} – ${b.kund}`,
        product,
        bookingId: b.id,
      });
    }
    if (b.startDay > TODAY_INDEX) {
      events.push({
        id: `${b.id}-lev`,
        type: "leverans",
        dayIndex: b.startDay,
        label: "Leverans",
        subtitle: `${product} – ${b.kund}`,
        product,
        bookingId: b.id,
      });
    }
    if (b.endDay >= TODAY_INDEX) {
      events.push({
        id: `${b.id}-hamt`,
        type: "hämtning",
        dayIndex: b.endDay,
        label: "Hämtning",
        subtitle: `${product} – ${b.kund}`,
        product,
        bookingId: b.id,
      });
    }
    if (b.status === "preliminär") {
      events.push({
        id: `${b.id}-prel`,
        type: "preliminär",
        dayIndex: b.startDay,
        label: "Preliminär bokning",
        subtitle: `${product} – ${b.kund} (väntar bekräftelse)`,
        product,
        bookingId: b.id,
      });
    }
    if (b.status === "service") {
      events.push({
        id: `${b.id}-serv`,
        type: "service",
        dayIndex: b.startDay,
        label: "Service",
        subtitle: `${product} planerad`,
        product,
        bookingId: b.id,
      });
    }
  });
  // Sortera: framtida händelser först (lägst dayIndex för framtida), sedan senaste
  return events.sort((a, b) => a.dayIndex - b.dayIndex).slice(0, 12);
}

function eventTimeLabel(dayIndex: number): string {
  if (dayIndex < 0) {
    if (dayIndex === -1) return "Igår";
    return `För ${-dayIndex} dagar sedan`;
  }
  if (dayIndex === 0) return "Idag";
  if (dayIndex === 1) return "Imorgon";
  return `Om ${dayIndex} dagar`;
}

const EVENT_ICON: Record<AdminEventType, { icon: typeof FileText; className: string }> = {
  ny_bokning: { icon: FileText, className: "bg-emerald-100 text-emerald-700" },
  leverans: { icon: ArrowDownToLine, className: "bg-blue-100 text-blue-700" },
  hämtning: { icon: ArrowUpFromLine, className: "bg-amber-100 text-amber-700" },
  preliminär: { icon: FileText, className: "bg-amber-100 text-amber-700" },
  service: { icon: Package, className: "bg-slate-100 text-slate-700" },
};

const NOTES_STORAGE_KEY = "admin-notes";

type Note = { id: string; text: string; createdAt: number };

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export default function OverviewPage() {
  const adminEvents = buildAdminEvents();

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const addNote = useCallback(() => {
    const text = newNoteText.trim();
    if (!text) return;
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
    };
    const next = [note, ...notes];
    setNotes(next);
    saveNotes(next);
    setNewNoteText("");
  }, [newNoteText, notes]);

  const removeNote = useCallback((id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
  }, [notes]);

  // Aktiva uthyrningar: just nu uthyrda (dagens datum ligger inom start–slut)
  const activeUthyrd = MOCK_BOOKINGS.filter(
    (b) => b.startDay <= TODAY_INDEX && b.endDay >= TODAY_INDEX
  ).length;

  // Nästa leverans: minsta startDay i framtiden; alla bokningar som levereras då
  const futureStarts = MOCK_BOOKINGS.filter((b) => b.startDay > TODAY_INDEX).map((b) => b.startDay);
  const nextDeliveryDay = futureStarts.length > 0 ? Math.min(...futureStarts) : null;
  const nextDeliveryBookings =
    nextDeliveryDay != null
      ? MOCK_BOOKINGS.filter((b) => b.startDay === nextDeliveryDay)
      : [];

  // Nästa hämtning: minsta endDay som är idag eller i framtiden; alla bokningar som hämtas då
  const futureEnds = MOCK_BOOKINGS.filter((b) => b.endDay >= TODAY_INDEX).map((b) => b.endDay);
  const nextPickupDay = futureEnds.length > 0 ? Math.min(...futureEnds) : null;
  const nextPickupBookings =
    nextPickupDay != null ? MOCK_BOOKINGS.filter((b) => b.endDay === nextPickupDay) : [];

  // Nya bokningar: antal bokade under senaste 7 dagarna (createdDay >= -7)
  const newBookingsCount = MOCK_BOOKINGS.filter((b) => b.createdDay >= -7).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Översikt</h1>
        <p className="mt-1 text-slate-600">
          Välkommen till admin. Här kan du hantera bokningar, maskinpark och logistik.
        </p>
      </div>

      {/* 5 kort: Aktiva uthyrningar, Nästa leverans, Nästa hämtning, Nya bokningar, Omsättning */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Aktiva uthyrningar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <PackageCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">Aktiva uthyrningar</p>
              <p className="text-2xl font-bold text-slate-900">{activeUthyrd}</p>
              <p className="text-xs text-slate-500">Just nu uthyrda</p>
            </div>
          </div>
        </div>

        {/* Nästa leverans */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ArrowDownToLine className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600">Nästa leverans</p>
              {nextDeliveryDay != null ? (
                <>
                  <p className="text-lg font-bold text-slate-900">
                    {formatDay(nextDeliveryDay)}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {nextDeliveryBookings.map((b) => (
                      <li key={b.id}>{MOCK_PRODUCTS[b.machineIndex]}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-slate-500">Ingen kommande leverans</p>
              )}
            </div>
          </div>
        </div>

        {/* Nästa hämtning */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ArrowUpFromLine className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600">Nästa hämtning</p>
              {nextPickupDay != null ? (
                <>
                  <p className="text-lg font-bold text-slate-900">
                    {formatDay(nextPickupDay)}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {nextPickupBookings.map((b) => (
                      <li key={b.id}>{MOCK_PRODUCTS[b.machineIndex]}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-slate-500">Ingen kommande hämtning</p>
              )}
            </div>
          </div>
        </div>

        {/* Nya bokningar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">Nya bokningar</p>
              <p className="text-2xl font-bold text-slate-900">{newBookingsCount}</p>
              <p className="text-xs text-slate-500">Senaste 7 dagarna</p>
            </div>
          </div>
        </div>

        {/* Omsättning */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">Omsättning</p>
              <p className="text-2xl font-bold text-slate-900">— kr</p>
              <p className="text-xs text-slate-500">Vecka / månad</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Senaste händelser */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Senaste händelser</h2>
            <Link
              href="/bookings"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Visa bokningar →
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {adminEvents.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-500">
                  Inga händelser just nu.
                </li>
              ) : (
                adminEvents.map((ev) => {
                  const { icon: Icon, className } = EVENT_ICON[ev.type];
                  return (
                    <li key={ev.id}>
                      <Link
                        href="/bookings"
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/80"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${className}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {ev.label}
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              {eventTimeLabel(ev.dayIndex)}
                            </span>
                          </p>
                          <p className="text-sm text-slate-600">{ev.subtitle}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        {/* Anslagstavla – anteckningar */}
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Pin className="h-5 w-5 text-slate-500" aria-hidden />
            Anslagstavla
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Skriv en anteckning och spara. Checka av när du är klar – då försvinner den.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="t.ex. Kolla däcktryck på kärran innan nästa leverans"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                aria-label="Ny anteckning"
              />
              <button
                type="button"
                onClick={addNote}
                disabled={!newNoteText.trim()}
                className="shrink-0 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800"
              >
                Spara
              </button>
            </div>
            <div className="space-y-2">
              {notes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                  Inga anteckningar. Skriv något ovan och klicka Spara.
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <p className="min-w-0 flex-1 text-sm text-slate-800">{note.text}</p>
                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      title="Markera som klar (tas bort från anslagstavlan)"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Klar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
