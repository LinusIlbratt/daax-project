"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, User, Package, Plus, X, Pencil, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteBlockedDateByDate,
  fetchBlockedDates,
  insertBlockedDate,
} from "@/lib/supabase/blocked-dates";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000";

type ViewMode = "personal" | "bookings";

/** Admins med egna personliga kalendrar (händelser). Blockerade datum är globala i Supabase. */
const ADMINS = [
  { id: "anna", name: "Anna" },
  { id: "erik", name: "Erik" },
] as const;

const ADMIN_STORAGE_KEY = "admin-calendar-user";

function getStoredAdminId(): string {
  if (typeof window === "undefined") return ADMINS[0].id;
  try {
    const id = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (id && ADMINS.some((a) => a.id === id)) return id;
  } catch {
    // ignore
  }
  return ADMINS[0].id;
}

function setStoredAdminId(id: string) {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

const MOCK_PRODUCTS = [
  "Minigrävare 1.8 ton",
  "Hjuldumper Batteri",
  "Mobil Bastuvagn",
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
};

const MOCK_BOOKINGS: MockBooking[] = [
  { id: "b1", machineIndex: 0, startDay: 2, endDay: 4, status: "uthyrd", kund: "Bygg AB", tel: "070-123 45 67" },
  { id: "b2", machineIndex: 1, startDay: 5, endDay: 5, status: "preliminär", kund: "Privatperson", tel: "073-987 65 43" },
  { id: "b3", machineIndex: 2, startDay: 1, endDay: 3, status: "uthyrd", kund: "Event & Fest AB", tel: "076-555 12 34" },
  { id: "b4", machineIndex: 0, startDay: 8, endDay: 9, status: "service", kund: "—", tel: "—" },
  { id: "b5", machineIndex: 1, startDay: 0, endDay: 2, status: "uthyrd", kund: "Gröntan AB", tel: "070-111 22 33" },
];

type PersonalEvent = { id: string; date: string; title: string; time?: string };

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

/** Färgkodning per veckodag – tydliga toner för bra kontrast */
const WEEKDAY_COLORS: Record<number, { header: string; cell: string; cellEmpty: string }> = {
  0: { header: "bg-slate-200 text-slate-900", cell: "bg-slate-100", cellEmpty: "bg-slate-100/70" },
  1: { header: "bg-violet-200 text-violet-900", cell: "bg-violet-100", cellEmpty: "bg-violet-100/70" },
  2: { header: "bg-rose-200 text-rose-900", cell: "bg-rose-100", cellEmpty: "bg-rose-100/70" },
  3: { header: "bg-amber-200 text-amber-900", cell: "bg-amber-100", cellEmpty: "bg-amber-100/70" },
  4: { header: "bg-emerald-200 text-emerald-900", cell: "bg-emerald-100", cellEmpty: "bg-emerald-100/70" },
  5: { header: "bg-sky-200 text-sky-900", cell: "bg-sky-100", cellEmpty: "bg-sky-100/70" },
  6: { header: "bg-fuchsia-200 text-fuchsia-900", cell: "bg-fuchsia-100", cellEmpty: "bg-fuchsia-100/70" },
};

const MONTH_NAMES = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

const STATUS_STYLES: Record<BookingStatus, { bg: string; label: string }> = {
  uthyrd: { bg: "bg-emerald-500", label: "Uthyrd" },
  preliminär: { bg: "bg-amber-400", label: "Preliminär" },
  service: { bg: "bg-slate-400", label: "Service" },
};

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Måndag = 0, söndag = 6 (för svensk veckovisning). */
function getWeekdayMonFirst(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * Bygger en 6×7-grid med datum för månaden. Varje cell är antingen ett Date eller null.
 * Första raden kan ha tomma celler före månadens första dag.
 */
function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = getWeekdayMonFirst(first);
  const daysInMonth = last.getDate();
  const grid: (Date | null)[][] = [];
  let dayIndex = 1 - firstWeekday;
  for (let row = 0; row < 6; row++) {
    const week: (Date | null)[] = [];
    for (let col = 0; col < 7; col++) {
      if (dayIndex < 1 || dayIndex > daysInMonth) {
        week.push(null);
      } else {
        week.push(new Date(year, month - 1, dayIndex));
      }
      dayIndex++;
    }
    grid.push(week);
  }
  return grid;
}

/** Bokning som datumintervall (baserat på dag-offset från idag). */
function bookingToRange(b: MockBooking): { start: Date; end: Date } {
  const today = getTodayStart();
  const start = new Date(today);
  start.setDate(today.getDate() + b.startDay);
  const end = new Date(today);
  end.setDate(today.getDate() + b.endDay);
  return { start, end };
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function CalendarPage() {
  const today = getTodayStart();
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(getStoredAdminId);
  const [blockedDates, setBlockedDatesState] = useState<string[]>([]);
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [eventModal, setEventModal] = useState<{ date: string; event?: PersonalEvent } | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    kund: string;
    tel: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    setStoredAdminId(selectedAdminId);
  }, [selectedAdminId]);

  const loadBlockedDates = useCallback(async () => {
    setLoadingBlocked(true);
    setSaveError(null);
    if (!isSupabaseConfigured()) {
      setBlockedDatesState([]);
      setSaveError("Supabase är inte konfigurerat.");
      setLoadingBlocked(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchBlockedDates(supabase);
      setBlockedDatesState(rows.map((r) => r.date));
    } catch (e) {
      console.error("calendar: load blocked dates", e);
      setBlockedDatesState([]);
      setSaveError(
        e instanceof Error ? e.message : "Kunde inte hämta blockerade datum."
      );
    } finally {
      setLoadingBlocked(false);
    }
  }, []);

  useEffect(() => {
    void loadBlockedDates();
  }, [loadBlockedDates]);

  const toggleBlocked = useCallback(
    async (key: string) => {
      setSaveError(null);
      if (!isSupabaseConfigured()) {
        setSaveError("Supabase är inte konfigurerat.");
        return;
      }

      const isBlocked = blockedDates.includes(key);
      const previous = blockedDates;

      setBlockedDatesState((prev) =>
        isBlocked ? prev.filter((d) => d !== key) : [...prev, key].sort()
      );

      try {
        const supabase = getSupabaseBrowserClient();
        if (isBlocked) {
          await deleteBlockedDateByDate(supabase, key);
        } else {
          await insertBlockedDate(supabase, key);
        }
      } catch (e) {
        console.error("calendar: toggle blocked date", e);
        setBlockedDatesState(previous);
        setSaveError(
          e instanceof Error ? e.message : "Kunde inte uppdatera blockeringen."
        );
      }
    },
    [blockedDates]
  );

  useEffect(() => {
    if (viewMode !== "personal") return;
    let cancelled = false;
    setLoadingEvents(true);
    fetch(`${WEB_APP_URL}/api/personal-events?admin=${encodeURIComponent(selectedAdminId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => { if (!cancelled) setEvents([]); })
      .finally(() => { if (!cancelled) setLoadingEvents(false); });
    return () => { cancelled = true; };
  }, [viewMode, selectedAdminId]);

  const saveEvents = useCallback((next: PersonalEvent[]) => {
    setEvents(next);
    fetch(`${WEB_APP_URL}/api/personal-events`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: selectedAdminId, events: next }),
    }).catch(() => setSaveError("Kunde inte spara händelser."));
  }, [selectedAdminId]);

  const addEvent = useCallback((date: string, title: string, time?: string) => {
    const newEvent: PersonalEvent = {
      id: crypto.randomUUID(),
      date,
      title: title.trim(),
      time: time?.trim() || undefined,
    };
    saveEvents([...events, newEvent]);
    setEventModal(null);
  }, [events, saveEvents]);

  const updateEvent = useCallback((event: PersonalEvent, title: string, time?: string) => {
    saveEvents(events.map((e) => e.id === event.id ? { ...e, title: title.trim(), time: time?.trim() || undefined } : e));
    setEventModal(null);
  }, [events, saveEvents]);

  const deleteEvent = useCallback((id: string) => {
    saveEvents(events.filter((e) => e.id !== id));
    setEventModal(null);
  }, [events, saveEvents]);

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, PersonalEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    map.forEach((list) => list.sort((a, b) => (a.time || "").localeCompare(b.time || "")));
    return map;
  }, [events]);

  const monthGrid = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  /** För varje (productIndex, date) returnerar bokning om någon träffar. */
  const bookingAt = useMemo(() => {
    const map = new Map<string, MockBooking>();
    MOCK_BOOKINGS.forEach((b) => {
      const { start, end } = bookingToRange(b);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${b.machineIndex}-${dateKey(d)}`;
        map.set(key, b);
      }
    });
    return map;
  }, []);

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const years = useMemo(() => {
    const y = today.getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - 2 + i);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
          Kalender
        </h1>
        <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
          {viewMode === "personal"
            ? "Din personliga kalender – händelser och upptagna dagar. Upptagna dagar synkas så att kunder inte kan boka leverans då."
            : "Bokningskalender – se vilka objekt som är uthyrda per dag."}
        </p>
      </div>

      {/* Flikar: Min kalender | Bokningskalender */}
      <div className="flex gap-1 rounded-xl border border-[rgb(var(--admin-border))] bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setViewMode("personal")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition sm:flex-none sm:px-6 ${
            viewMode === "personal"
              ? "bg-white text-[rgb(var(--admin-text))] shadow-sm"
              : "text-[rgb(var(--admin-text-muted))] hover:text-[rgb(var(--admin-text))]"
          }`}
        >
          <User className="h-4 w-4" aria-hidden />
          Min kalender
        </button>
        <button
          type="button"
          onClick={() => setViewMode("bookings")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition sm:flex-none sm:px-6 ${
            viewMode === "bookings"
              ? "bg-white text-[rgb(var(--admin-text))] shadow-sm"
              : "text-[rgb(var(--admin-text-muted))] hover:text-[rgb(var(--admin-text))]"
          }`}
        >
          <Package className="h-4 w-4" aria-hidden />
          Bokningskalender
        </button>
      </div>

      {saveError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {saveError}
        </div>
      )}

      {/* Verktygsrad: admin (endast personlig) + månad/år */}
      <div className="admin-card flex flex-wrap items-center gap-4 px-5 py-4">
        {viewMode === "personal" && (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[rgb(var(--admin-text-muted))]" aria-hidden />
            <label htmlFor="calendar-admin" className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">
              Kalender för:
            </label>
            <select
              id="calendar-admin"
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="rounded-xl border border-[rgb(var(--admin-border))] bg-white px-3 py-2 text-sm text-[rgb(var(--admin-text))] focus:border-[rgb(var(--admin-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]/20"
            >
              {ADMINS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        {(loadingBlocked || (viewMode === "personal" && loadingEvents)) && (
          <span className="text-sm text-[rgb(var(--admin-text-muted))]">Laddar…</span>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]"
            aria-label="Föregående månad"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="min-w-[140px] text-center text-lg font-semibold text-[rgb(var(--admin-text))]">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]"
            aria-label="Nästa månad"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="calendar-year" className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">
            År:
          </label>
          <select
            id="calendar-year"
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="rounded-xl border border-[rgb(var(--admin-border))] bg-white px-3 py-2 text-sm text-[rgb(var(--admin-text))] focus:border-[rgb(var(--admin-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Månadsruta – alla dagar synliga */}
      <div className="admin-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[rgb(var(--admin-border))] text-center text-xs font-semibold uppercase tracking-wider">
          {WEEKDAY_LABELS.map((label, colIndex) => (
            <div
              key={label}
              className={`border-r border-[rgb(var(--admin-border))] py-2 last:border-r-0 ${WEEKDAY_COLORS[colIndex].header}`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthGrid.flatMap((week, rowIndex) =>
            week.map((day, colIndex) => {
              const isLastCol = colIndex === 6;
              if (!day) {
                return (
                  <div
                    key={`e-${rowIndex}-${colIndex}`}
                    className={`min-h-[110px] border-b border-[rgb(var(--admin-border-muted))] ${isLastCol ? "" : "border-r"} ${WEEKDAY_COLORS[colIndex].cellEmpty}`}
                  />
                );
              }
              const key = dateKey(day);
              const isToday = isSameDay(day, today);
              const isBlocked = viewMode === "personal" && blockedSet.has(key);
              const dayEvents = viewMode === "personal" ? (eventsByDate.get(key) ?? []) : [];

              return (
                <div
                  key={key}
                  className={`flex min-h-[110px] flex-col border-b border-[rgb(var(--admin-border-muted))] ${isLastCol ? "" : "border-r"} ${WEEKDAY_COLORS[colIndex].cell} ${
                    isToday ? "ring-2 ring-inset ring-amber-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-1 py-0.5">
                    <span className={`text-sm font-medium ${isToday ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800" : "text-[rgb(var(--admin-text))]"}`}>
                      {day.getDate()}
                    </span>
                    {viewMode === "personal" && (
                      <button
                        type="button"
                        onClick={() => setEventModal({ date: key })}
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        title="Lägg till händelse"
                        aria-label="Lägg till händelse"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto p-1">
                    {viewMode === "personal" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void toggleBlocked(key)}
                          className={`mb-1 flex w-full items-center justify-center rounded py-1 text-[10px] font-medium transition ${
                            isBlocked
                              ? "bg-slate-400 text-white hover:bg-slate-500"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-300 hover:text-slate-700"
                          }`}
                          title={isBlocked ? "Ta bort blockering" : "Markera som upptagen (synkas till kundbokning)"}
                        >
                          {isBlocked ? "Upptagen" : "Ledig"}
                        </button>
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="group mb-0.5 flex items-start gap-0.5 rounded bg-[rgb(var(--admin-primary-muted))] px-1.5 py-1 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-medium text-[rgb(var(--admin-primary))]">
                                {ev.time && <span className="text-[rgb(var(--admin-text-muted))]">{ev.time} </span>}
                                {ev.title}
                              </p>
                            </div>
                            <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setEventModal({ date: key, event: ev })}
                                className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                title="Redigera"
                                aria-label="Redigera"
                              >
                                <Pencil className="h-3 w-3" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteEvent(ev.id)}
                                className="rounded p-0.5 text-red-500 hover:bg-red-100"
                                title="Ta bort"
                                aria-label="Ta bort"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden />
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="space-y-0.5">
                        {MOCK_PRODUCTS.map((_, productIndex) => {
                          const booking = bookingAt.get(`${productIndex}-${key}`);
                          if (!booking) return null;
                          return (
                            <div
                              key={`${productIndex}-${key}`}
                              className={`rounded px-1 py-0.5 text-[10px] font-medium text-white ${STATUS_STYLES[booking.status].bg}`}
                              title={`${STATUS_STYLES[booking.status].label} – ${booking.kund}`}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                  x: rect.left,
                                  y: rect.top - 4,
                                  kund: booking.kund,
                                  tel: booking.tel,
                                  status: STATUS_STYLES[booking.status].label,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              {MOCK_PRODUCTS[productIndex].slice(0, 8)} · {STATUS_STYLES[booking.status].label.slice(0, 3)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-[rgb(var(--admin-text-muted))]">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-lg bg-amber-100 ring-1 ring-amber-300" aria-hidden />
          Idag
        </span>
        {viewMode === "personal" && (
          <span className="flex items-center gap-2">
            <span className="h-3 w-8 rounded-full bg-slate-400" aria-hidden />
            Upptagen (synkas till kundbokning)
          </span>
        )}
        {viewMode === "bookings" && (
          <>
            <span className="flex items-center gap-2">
              <span className="h-3 w-8 rounded-full bg-emerald-500" aria-hidden />
              Uthyrd
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-8 rounded-full bg-amber-400" aria-hidden />
              Preliminär
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-8 rounded-full bg-slate-500" aria-hidden />
              Service
            </span>
          </>
        )}
      </div>

      {/* Modal: Lägg till / redigera händelse */}
      {eventModal && (
        <EventModal
          date={eventModal.date}
          event={eventModal.event}
          onSave={(title, time) => {
            if (eventModal.event) {
              updateEvent(eventModal.event, title, time);
            } else {
              addEvent(eventModal.date, title, time);
            }
          }}
          onDelete={eventModal.event ? () => deleteEvent(eventModal.event!.id) : undefined}
          onClose={() => setEventModal(null)}
        />
      )}

      {tooltip && (
        <div
          className="fixed z-50 -translate-y-full rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] px-4 py-3 text-sm text-[rgb(var(--admin-text))] shadow-admin-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-medium">{tooltip.status}</p>
          <p className="text-[rgb(var(--admin-text-muted))]">Kund: {tooltip.kund}</p>
          <p className="text-[rgb(var(--admin-text-muted))]">Tel: {tooltip.tel}</p>
        </div>
      )}
    </div>
  );
}

function EventModal({
  date,
  event,
  onSave,
  onDelete,
  onClose,
}: {
  date: string;
  event?: PersonalEvent;
  onSave: (title: string, time?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [time, setTime] = useState(event?.time ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), time.trim() || undefined);
  };

  const dateLabel = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [date]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] p-6 shadow-admin-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="event-modal-title" className="text-lg font-semibold text-[rgb(var(--admin-text))]">
            {event ? "Redigera händelse" : "Ny händelse"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--admin-text-muted))]">{dateLabel}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="event-title" className="admin-label">Titel</label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Hämta på skolan, Tandläkare"
              className="admin-input"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="event-time" className="admin-label">Tid (valfritt)</label>
            <input
              id="event-time"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="t.ex. 10:00"
              className="admin-input"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="admin-btn-primary" disabled={!title.trim()}>
              {event ? "Spara" : "Lägg till"}
            </button>
            {event && onDelete && (
              <button
                type="button"
                onClick={() => onDelete()}
                className="admin-btn-secondary text-red-600 hover:bg-red-50"
              >
                Ta bort
              </button>
            )}
            <button type="button" onClick={onClose} className="admin-btn-secondary">
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
