"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackageCheck,
  Pin,
  X,
  ChevronRight,
  MapPin,
  FileCheck,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { BookingListStatusBadge } from "@/app/components/booking-status-badges";
import {
  bookingDisplayAddress,
  countPendingBookings,
  fetchBookings,
  formatBookingDate,
  formatBookingPeriod,
  getTodayDeliveries,
  getTodayPickups,
  pickNextConfirmedEvent,
  type BookingListRow,
  type LogisticsItem,
} from "@/lib/supabase/bookings";

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [utDone, setUtDone] = useState<Set<string>>(new Set());
  const [inDone, setInDone] = useState<Set<string>>(new Set());
  const [bookings, setBookings] = useState<BookingListRow[]>([]);
  const [logisticsModal, setLogisticsModal] = useState<{
    item: LogisticsItem;
    type: "leverans" | "upphämtning";
  } | null>(null);

  useEffect(() => setNotes(loadNotes()), []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const rows = await fetchBookings(supabase);
        if (!cancelled) setBookings(rows);
      } catch (e) {
        console.error("overview: load bookings", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleKvittera = useCallback((item: LogisticsItem, type: "leverans" | "upphämtning") => {
    if (type === "leverans") setUtDone((p) => new Set(p).add(item.id));
    else setInDone((p) => new Set(p).add(item.id));
    setLogisticsModal(null);
  }, []);

  const addNote = useCallback(() => {
    const text = newNoteText.trim();
    if (!text) return;
    const note = { id: crypto.randomUUID(), text, createdAt: Date.now() };
    const next = [note, ...notes];
    setNotes(next);
    saveNotes(next);
    setNewNoteText("");
  }, [newNoteText, notes]);

  const removeNote = useCallback(
    (id: string) => {
      const next = notes.filter((n) => n.id !== id);
      setNotes(next);
      saveNotes(next);
    },
    [notes],
  );

  const today = useMemo(() => todayIso(), []);

  const nextEvent = useMemo(
    () => pickNextConfirmedEvent(bookings, today),
    [bookings, today]
  );

  const idagLeveranser = useMemo(
    () => getTodayDeliveries(bookings, today),
    [bookings, today]
  );

  const idagUpphamtningar = useMemo(
    () => getTodayPickups(bookings, today),
    [bookings, today]
  );

  const bookingsThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return bookings.filter(
      (b) => b.start_date >= monthStart && b.start_date <= monthEnd
    ).length;
  }, [bookings]);

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
        .slice(0, 6),
    [bookings]
  );

  const pendingCount = useMemo(
    () => countPendingBookings(bookings),
    [bookings]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
          Översikt
        </h1>
        <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
          Dagens körningar, nya bokningar och snabblänkar.
        </p>
      </div>

      {pendingCount > 0 ? (
        <Link
          href="/bookings?status=pending"
          className="admin-card flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50/90 p-5 transition hover:border-amber-300"
        >
          <div>
            <p className="font-semibold text-amber-950">
              {pendingCount} {pendingCount === 1 ? "bokning väntar" : "bokningar väntar"} på godkännande
            </p>
            <p className="mt-1 text-sm text-amber-900">
              Öppna bokningar för att godkänna och ta betalt.
            </p>
          </div>
          <span className="admin-btn-primary shrink-0 bg-amber-600 hover:bg-amber-500">
            Visa bokningar
          </span>
        </Link>
      ) : null}

      {/* Nästa leverans/hämtning – hero card */}
      <section className="admin-card overflow-hidden">
        <div className="border-b border-[rgb(var(--admin-border-muted))] px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--admin-text-muted))]">
            Nästa leverans / hämtning
          </h2>
        </div>
        <div className="p-6">
          {nextEvent ? (
            <div className="flex flex-wrap items-start gap-5">
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  nextEvent.type === "leverans"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {nextEvent.type === "leverans" ? (
                  <ArrowDownToLine className="h-7 w-7" aria-hidden />
                ) : (
                  <ArrowUpFromLine className="h-7 w-7" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-[rgb(var(--admin-text))]">
                  {formatBookingDate(
                    nextEvent.type === "leverans"
                      ? nextEvent.booking.start_date
                      : nextEvent.booking.end_date
                  )}{" "}
                  – {nextEvent.type === "leverans" ? "Leverans" : "Hämtning"}
                </p>
                <p className="mt-0.5 text-[rgb(var(--admin-text-muted))]">
                  {nextEvent.booking.products?.name ?? nextEvent.booking.product_id}{" "}
                  till {nextEvent.booking.customer_name}
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--admin-text-subtle))]">
                  {nextEvent.booking.customer_phone}
                </p>
                {bookingDisplayAddress(nextEvent.booking) !== "—" ? (
                  <p className="mt-1 text-sm text-[rgb(var(--admin-text-subtle))]">
                    {bookingDisplayAddress(nextEvent.booking)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-[rgb(var(--admin-text-muted))]">
              Ingen kommande leverans eller hämtning.
            </p>
          )}
        </div>
      </section>

      {/* Idag: leveranser & upphämtningar */}
      <section className="admin-card overflow-hidden">
        <div className="border-b border-[rgb(var(--admin-border-muted))] px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--admin-text-muted))]">
            Idag: leveranser & upphämtningar
          </h2>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[rgb(var(--admin-text))]">
              <ArrowDownToLine className="h-4 w-4 text-blue-600" aria-hidden />
              Leveranser ut
            </h3>
            <ul className="space-y-3">
              {idagLeveranser.filter((i) => !utDone.has(i.id)).length === 0 ? (
                <li className="text-sm text-[rgb(var(--admin-text-muted))]">Inget kvar idag</li>
              ) : (
                idagLeveranser.filter((i) => !utDone.has(i.id)).map((item) => (
                  <li key={item.id} className="rounded-xl border border-[rgb(var(--admin-border-muted))] bg-slate-50/80 p-3">
                    <span className={`admin-badge mb-2 ${item.urgency === "akut" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"}`}>
                      {item.timeLabel}
                    </span>
                    <p className="font-medium text-[rgb(var(--admin-text))]">{item.adress}</p>
                    <p className="text-sm text-[rgb(var(--admin-text-muted))]">{item.kund} · {item.maskin}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`tel:${item.telefon.replace(/\s/g, "")}`} className="text-sm font-medium text-[rgb(var(--admin-primary))] hover:underline">{item.telefon}</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.adress)}`} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary text-xs">
                        <MapPin className="h-3.5 w-3.5" aria-hidden /> Navigera
                      </a>
                      <button type="button" onClick={() => setLogisticsModal({ item, type: "leverans" })} className="admin-btn-primary text-xs">
                        <FileCheck className="h-3.5 w-3.5" aria-hidden /> Markera klart
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[rgb(var(--admin-text))]">
              <ArrowUpFromLine className="h-4 w-4 text-amber-600" aria-hidden />
              Upphämtningar hem
            </h3>
            <ul className="space-y-3">
              {idagUpphamtningar.filter((i) => !inDone.has(i.id)).length === 0 ? (
                <li className="text-sm text-[rgb(var(--admin-text-muted))]">Inget kvar idag</li>
              ) : (
                idagUpphamtningar.filter((i) => !inDone.has(i.id)).map((item) => (
                  <li key={item.id} className="rounded-xl border border-[rgb(var(--admin-border-muted))] bg-slate-50/80 p-3">
                    <span className={`admin-badge mb-2 ${item.urgency === "akut" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"}`}>
                      {item.timeLabel}
                    </span>
                    <p className="font-medium text-[rgb(var(--admin-text))]">{item.adress}</p>
                    <p className="text-sm text-[rgb(var(--admin-text-muted))]">{item.kund} · {item.maskin}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`tel:${item.telefon.replace(/\s/g, "")}`} className="text-sm font-medium text-[rgb(var(--admin-primary))] hover:underline">{item.telefon}</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.adress)}`} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary text-xs">
                        <MapPin className="h-3.5 w-3.5" aria-hidden /> Navigera
                      </a>
                      <button type="button" onClick={() => setLogisticsModal({ item, type: "upphämtning" })} className="admin-btn-primary text-xs">
                        <FileCheck className="h-3.5 w-3.5" aria-hidden /> Markera klart
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Senaste bokningar med betalningsstatus */}
      <section className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--admin-border-muted))] px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--admin-text-muted))]">
            Senaste bokningar
          </h2>
          <Link
            href="/bookings"
            className="text-sm font-medium text-[rgb(var(--admin-primary))] hover:underline"
          >
            Visa alla
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[rgb(var(--admin-text-muted))]">
            Inga bokningar ännu.
          </p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--admin-border-muted))]">
            {recentBookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href="/bookings"
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[rgb(var(--admin-text))]">
                      {booking.products?.name ?? booking.product_id} ·{" "}
                      {booking.customer_name}
                    </p>
                    <p className="mt-0.5 text-sm text-[rgb(var(--admin-text-muted))]">
                      {formatBookingPeriod(booking.start_date, booking.end_date)}{" "}
                      · {booking.total_price.toLocaleString("sv-SE")} kr
                    </p>
                  </div>
                  <BookingListStatusBadge status={booking.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stat + quick actions row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="admin-card admin-card-hover flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--admin-primary-muted))] text-[rgb(var(--admin-primary))]">
            <Calendar className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">
              Bokningar denna månad
            </p>
            <p className="text-2xl font-bold tabular-nums text-[rgb(var(--admin-text))]">
              {bookingsThisMonth}
            </p>
          </div>
        </div>

        <Link
          href="/bookings"
          className="admin-card admin-card-hover group flex items-center gap-4 p-6 transition-colors"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--admin-sidebar))] text-white">
            <PackageCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[rgb(var(--admin-text))] group-hover:text-[rgb(var(--admin-primary))]">
              Se alla bokningar
            </p>
            <p className="text-sm text-[rgb(var(--admin-text-muted))]">
              Hantera och godkänn bokningar
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-[rgb(var(--admin-primary))]" aria-hidden />
        </Link>

        <Link
          href="/inventory"
          className="admin-card admin-card-hover group flex items-center gap-4 p-6 transition-colors"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--admin-sidebar))] text-white">
            <Package className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[rgb(var(--admin-text))] group-hover:text-[rgb(var(--admin-primary))]">
              Hantera hyrobjekt
            </p>
            <p className="text-sm text-[rgb(var(--admin-text-muted))]">
              Lägg till eller ändra maskiner på webben
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-[rgb(var(--admin-primary))]" aria-hidden />
        </Link>
      </div>

      {/* Anteckningar */}
      <section className="admin-card">
        <div className="flex items-center gap-2 border-b border-[rgb(var(--admin-border-muted))] px-6 py-4">
          <Pin className="h-4 w-4 text-[rgb(var(--admin-text-muted))]" aria-hidden />
          <h2 className="text-sm font-semibold text-[rgb(var(--admin-text))]">Anteckningar</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="t.ex. Kolla däck innan nästa leverans"
              className="admin-input"
              aria-label="Ny anteckning"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={!newNoteText.trim()}
              className="admin-btn-primary shrink-0"
            >
              Spara
            </button>
          </div>
          {notes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {notes.slice(0, 5).map((note) => (
                <li
                  key={note.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--admin-border-muted))] bg-slate-50/80 px-4 py-3 text-sm"
                >
                  <span className="text-[rgb(var(--admin-text))]">{note.text}</span>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    title="Ta bort"
                    aria-label="Ta bort anteckning"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {logisticsModal && (
        <KvitteraModal
          item={logisticsModal.item}
          type={logisticsModal.type}
          onClose={() => setLogisticsModal(null)}
          onConfirm={(item, type) => handleKvittera(item, type)}
        />
      )}
    </div>
  );
}

function KvitteraModal({
  item,
  type,
  onClose,
  onConfirm,
}: {
  item: LogisticsItem;
  type: "leverans" | "upphämtning";
  onClose: () => void;
  onConfirm: (item: LogisticsItem, type: "leverans" | "upphämtning") => void;
}) {
  const [maskinOk, setMaskinOk] = useState(false);
  const [bransleOk, setBransleOk] = useState(false);
  const [instruktionerOk, setInstruktionerOk] = useState(false);
  const title = type === "leverans" ? "Markera leverans som klar" : "Markera upphämtning som klar";
  const showInstruktioner = type === "leverans";
  const canConfirm = maskinOk && bransleOk && (showInstruktioner ? instruktionerOk : true);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="kvittera-title">
        <div className="w-full max-w-md rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] shadow-admin-lg" onClick={(e) => e.stopPropagation()}>
          <div className="border-b border-[rgb(var(--admin-border))] px-5 py-4">
            <h2 id="kvittera-title" className="text-lg font-semibold text-[rgb(var(--admin-text))]">{title}</h2>
            <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">{item.maskin} · {item.kund}</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgb(var(--admin-border-muted))] p-3">
              <input type="checkbox" checked={maskinOk} onChange={(e) => setMaskinOk(e.target.checked)} className="h-5 w-5 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]" />
              <span className="text-sm font-medium text-[rgb(var(--admin-text))]">Maskin kontrollerad (inga skador)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgb(var(--admin-border-muted))] p-3">
              <input type="checkbox" checked={bransleOk} onChange={(e) => setBransleOk(e.target.checked)} className="h-5 w-5 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]" />
              <span className="text-sm font-medium text-[rgb(var(--admin-text))]">Bränsle kollat</span>
            </label>
            {showInstruktioner && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgb(var(--admin-border-muted))] p-3">
                <input type="checkbox" checked={instruktionerOk} onChange={(e) => setInstruktionerOk(e.target.checked)} className="h-5 w-5 rounded border-[rgb(var(--admin-border))] text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]" />
                <span className="text-sm font-medium text-[rgb(var(--admin-text))]">Instruktioner givna till kund</span>
              </label>
            )}
          </div>
          <div className="flex gap-3 border-t border-[rgb(var(--admin-border))] px-5 py-4">
            <button type="button" onClick={onClose} className="admin-btn-secondary min-h-[48px] flex-1">Avbryt</button>
            <button type="button" onClick={() => { if (canConfirm) { onConfirm(item, type); onClose(); } }} disabled={!canConfirm} className="admin-btn-primary min-h-[48px] flex-1">Klarmarkera</button>
          </div>
          <p className="px-5 pb-4 text-xs text-[rgb(var(--admin-text-subtle))]">
            Markeringen sparas bara tills sidan laddas om.
          </p>
        </div>
      </div>
    </>
  );
}
