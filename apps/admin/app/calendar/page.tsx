"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
};

const MOCK_BOOKINGS: MockBooking[] = [
  { id: "b1", machineIndex: 0, startDay: 2, endDay: 4, status: "uthyrd", kund: "Bygg AB", tel: "070-123 45 67" },
  { id: "b2", machineIndex: 1, startDay: 5, endDay: 5, status: "preliminär", kund: "Privatperson", tel: "073-987 65 43" },
  { id: "b3", machineIndex: 2, startDay: 1, endDay: 3, status: "uthyrd", kund: "Event & Fest AB", tel: "076-555 12 34" },
  { id: "b4", machineIndex: 0, startDay: 8, endDay: 9, status: "service", kund: "—", tel: "—" },
  { id: "b5", machineIndex: 1, startDay: 0, endDay: 2, status: "uthyrd", kund: "Gröntan AB", tel: "070-111 22 33" },
];

const MONTH_NAMES = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

const STATUS_STYLES: Record<BookingStatus, { bg: string; hover: string; label: string }> = {
  uthyrd: { bg: "bg-emerald-500", hover: "hover:bg-emerald-600", label: "Uthyrd" },
  preliminär: { bg: "bg-amber-400", hover: "hover:bg-amber-500", label: "Preliminär" },
  service: { bg: "bg-slate-400", hover: "hover:bg-slate-500", label: "Service" },
};

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returnerar alla datum i vald månad. */
function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
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
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function CalendarPage() {
  const today = getTodayStart();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    kund: string;
    tel: string;
    status: string;
  } | null>(null);

  const daysInMonth = useMemo(
    () => getDaysInMonth(viewYear, viewMonth),
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kalender</h1>
        <p className="mt-1 text-slate-600">
          Månadsvy – se vilka dagar resurserna är uthyrda. Byta månad och år nedan.
        </p>
      </div>

      {/* Månad + år-navigering */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Föregående månad"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="min-w-[140px] text-center text-lg font-semibold text-slate-900">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Nästa månad"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="calendar-year" className="text-sm font-medium text-slate-600">
            År:
          </label>
          <select
            id="calendar-year"
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kalendergrid: rader = produkter, kolumner = dagar */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="inline-block min-w-0">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-48 border-b border-r border-slate-200 bg-slate-50/95 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Resurs
                </th>
                {daysInMonth.map((d) => (
                  <th
                    key={dateKey(d)}
                    className={`min-w-[44px] border-b border-r border-slate-200 px-1 py-2 text-center text-xs last:border-r-0 ${
                      isSameDay(d, today)
                        ? "bg-amber-50 font-semibold text-amber-800"
                        : "bg-slate-50/95 text-slate-600"
                    }`}
                  >
                    <span className="block font-medium">{d.getDate()}</span>
                    <span className="block text-[10px] font-normal opacity-80">
                      {d.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", "")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.map((productName, rowIndex) => (
                <tr key={productName} className="group">
                  <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 group-hover:bg-slate-50/80">
                    {productName}
                  </td>
                  {daysInMonth.map((day) => {
                    const key = `${rowIndex}-${dateKey(day)}`;
                    const booking = bookingAt.get(key);
                    const isTodayCell = isSameDay(day, today);
                    return (
                      <td
                        key={key}
                        className={`h-10 min-w-[44px] border-b border-r border-slate-100 p-0.5 align-middle last:border-r-0 ${
                          isTodayCell ? "bg-amber-50/50" : ""
                        }`}
                      >
                        {booking ? (
                          <div
                            className={`cursor-default rounded ${STATUS_STYLES[booking.status].bg} ${STATUS_STYLES[booking.status].hover} px-1 py-1.5 text-center text-[10px] font-medium text-white`}
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
                            {STATUS_STYLES[booking.status].label.slice(0, 3)}
                          </div>
                        ) : (
                          <span className="block h-full min-h-[28px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Idag-markör + legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-amber-100 ring-1 ring-amber-300" aria-hidden />
          Idag
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-emerald-500" aria-hidden />
          Uthyrd
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-amber-400" aria-hidden />
          Preliminär
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-slate-400" aria-hidden />
          Service
        </span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-medium">{tooltip.status}</p>
          <p className="text-slate-600">Kund: {tooltip.kund}</p>
          <p className="text-slate-600">Tel: {tooltip.tel}</p>
        </div>
      )}
    </div>
  );
}
