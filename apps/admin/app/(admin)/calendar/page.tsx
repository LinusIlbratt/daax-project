"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, User, Plus, X, Pencil, Trash2, Eye } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchAdminUsers, type AdminUserOption } from "@/lib/supabase/admin-users";
import {
  deleteBlockedDateByDate,
  fetchBlockedDates,
  insertBlockedDate,
} from "@/lib/supabase/blocked-dates";
import {
  deletePersonalEvent,
  fetchPersonalEvents,
  insertPersonalEvent,
  updatePersonalEvent,
  type PersonalEventRow,
} from "@/lib/supabase/personal-events";

type PersonalEvent = { id: string; date: string; title: string; time?: string };

const VIEW_ADMIN_STORAGE_KEY = "admin-calendar-view-user";

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

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

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekdayMonFirst(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

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

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function toUiEvent(row: PersonalEventRow): PersonalEvent {
  return { id: row.id, date: row.date, title: row.title, time: row.time };
}

function getStoredViewUserId(currentUserId: string, admins: AdminUserOption[]): string {
  if (typeof window === "undefined") return currentUserId;
  try {
    const stored = localStorage.getItem(VIEW_ADMIN_STORAGE_KEY);
    if (stored && admins.some((a) => a.id === stored)) return stored;
  } catch {
    // ignore
  }
  return currentUserId;
}

function setStoredViewUserId(id: string) {
  try {
    localStorage.setItem(VIEW_ADMIN_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export default function CalendarPage() {
  const today = getTodayStart();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUserOption[]>([]);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [blockedDates, setBlockedDatesState] = useState<string[]>([]);
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [eventModal, setEventModal] = useState<{ date: string; event?: PersonalEvent } | null>(null);

  const canEdit = Boolean(currentUserId && viewUserId && viewUserId === currentUserId);

  const viewedAdmin = useMemo(
    () => admins.find((a) => a.id === viewUserId) ?? null,
    [admins, viewUserId]
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (cancelled || authError || !user) return;

        setCurrentUserId(user.id);

        const adminList = await fetchAdminUsers(supabase);
        if (cancelled) return;

        setAdmins(adminList);
        setViewUserId(getStoredViewUserId(user.id, adminList));
      } catch (e) {
        console.error("calendar: init", e);
        if (!cancelled) {
          setSaveError(e instanceof Error ? e.message : "Kunde inte ladda kalendern.");
        }
      } finally {
        if (!cancelled) setLoadingAdmins(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewUserChange = useCallback((id: string) => {
    setViewUserId(id);
    setStoredViewUserId(id);
    setEventModal(null);
  }, []);

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

  const loadEvents = useCallback(async (userId: string) => {
    setLoadingEvents(true);
    setSaveError(null);
    if (!isSupabaseConfigured()) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchPersonalEvents(supabase, userId);
      setEvents(rows.map(toUiEvent));
    } catch (e) {
      console.error("calendar: load events", e);
      setEvents([]);
      setSaveError(e instanceof Error ? e.message : "Kunde inte hämta händelser.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!viewUserId) return;
    void loadEvents(viewUserId);
  }, [viewUserId, loadEvents]);

  const addEvent = useCallback(
    async (date: string, title: string, time?: string) => {
      if (!currentUserId || !canEdit) return;
      setSaveError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const row = await insertPersonalEvent(supabase, currentUserId, { date, title, time });
        setEvents((prev) => [...prev, toUiEvent(row)]);
        setEventModal(null);
      } catch (e) {
        console.error("calendar: add event", e);
        setSaveError(e instanceof Error ? e.message : "Kunde inte spara händelsen.");
      }
    },
    [canEdit, currentUserId]
  );

  const updateEvent = useCallback(
    async (event: PersonalEvent, title: string, time?: string) => {
      if (!canEdit) return;
      setSaveError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const row = await updatePersonalEvent(supabase, event.id, { title, time });
        setEvents((prev) => prev.map((e) => (e.id === event.id ? toUiEvent(row) : e)));
        setEventModal(null);
      } catch (e) {
        console.error("calendar: update event", e);
        setSaveError(e instanceof Error ? e.message : "Kunde inte uppdatera händelsen.");
      }
    },
    [canEdit]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!canEdit) return;
      setSaveError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        await deletePersonalEvent(supabase, id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setEventModal(null);
      } catch (e) {
        console.error("calendar: delete event", e);
        setSaveError(e instanceof Error ? e.message : "Kunde inte ta bort händelsen.");
      }
    },
    [canEdit]
  );

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
  }, [today]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
          Kalender
        </h1>
        <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
          Markera dagar som upptagna så kunder inte kan boka leverans då. Lägg till egna
          påminnelser per person.{" "}
          <Link href="/bookings" className="font-medium text-[rgb(var(--admin-primary))] hover:underline">
            Se riktiga bokningar under Bokningar
          </Link>
          .
        </p>
      </div>

      {saveError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {saveError}
        </div>
      )}

      {!canEdit && viewedAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Du tittar på <strong>{viewedAdmin.displayName}</strong>s kalender — endast läsning.
            Välj din egen i listan för att lägga till eller ändra händelser.
          </span>
        </div>
      )}

      <div className="admin-card flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 shrink-0 text-[rgb(var(--admin-text-muted))]" aria-hidden />
          <label htmlFor="calendar-admin" className="text-sm font-medium text-[rgb(var(--admin-text-muted))]">
            Kalender för:
          </label>
          <select
            id="calendar-admin"
            value={viewUserId ?? ""}
            onChange={(e) => handleViewUserChange(e.target.value)}
            disabled={loadingAdmins || admins.length === 0}
            className="min-w-[180px] rounded-xl border border-[rgb(var(--admin-border))] bg-white px-3 py-2 text-sm text-[rgb(var(--admin-text))] focus:border-[rgb(var(--admin-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]/20 disabled:opacity-60"
          >
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.id === currentUserId
                  ? `${admin.displayName} (du)`
                  : admin.displayName}
              </option>
            ))}
          </select>
        </div>

        {(loadingBlocked || loadingEvents || loadingAdmins) && (
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
              const isBlocked = blockedSet.has(key);
              const dayEvents = eventsByDate.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={`flex min-h-[110px] flex-col border-b border-[rgb(var(--admin-border-muted))] ${isLastCol ? "" : "border-r"} ${WEEKDAY_COLORS[colIndex].cell} ${
                    isToday ? "ring-2 ring-inset ring-amber-400" : ""
                  } ${!canEdit ? "opacity-95" : ""}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-1 py-0.5">
                    <span className={`text-sm font-medium ${isToday ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800" : "text-[rgb(var(--admin-text))]"}`}>
                      {day.getDate()}
                    </span>
                    {canEdit && (
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
                    <button
                      type="button"
                      onClick={() => void toggleBlocked(key)}
                      className={`mb-1 flex w-full items-center justify-center rounded py-1 text-[10px] font-medium transition ${
                        isBlocked
                          ? "bg-slate-400 text-white hover:bg-slate-500"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-300 hover:text-slate-700"
                      }`}
                      title={
                        isBlocked
                          ? "Ta bort blockering"
                          : "Markera som upptagen (kunder kan inte boka leverans)"
                      }
                    >
                      {isBlocked ? "Upptagen" : "Ledig"}
                    </button>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`group mb-0.5 flex items-start gap-0.5 rounded px-1.5 py-1 text-left ${
                          canEdit
                            ? "bg-[rgb(var(--admin-primary-muted))]"
                            : "bg-slate-200/80"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[10px] font-medium ${canEdit ? "text-[rgb(var(--admin-primary))]" : "text-slate-600"}`}>
                            {ev.time && <span className="text-[rgb(var(--admin-text-muted))]">{ev.time} </span>}
                            {ev.title}
                          </p>
                        </div>
                        {canEdit && (
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
                              onClick={() => void deleteEvent(ev.id)}
                              className="rounded p-0.5 text-red-500 hover:bg-red-100"
                              title="Ta bort"
                              aria-label="Ta bort"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm text-[rgb(var(--admin-text-muted))]">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-lg bg-amber-100 ring-1 ring-amber-300" aria-hidden />
          Idag
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-8 rounded-full bg-slate-400" aria-hidden />
          Upptagen (kunder kan inte boka leverans)
        </span>
      </div>

      {eventModal && canEdit && (
        <EventModal
          date={eventModal.date}
          event={eventModal.event}
          onSave={(title, time) => {
            if (eventModal.event) {
              void updateEvent(eventModal.event, title, time);
            } else {
              void addEvent(eventModal.date, title, time);
            }
          }}
          onDelete={eventModal.event ? () => void deleteEvent(eventModal.event!.id) : undefined}
          onClose={() => setEventModal(null)}
        />
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
