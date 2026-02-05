"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const DISCOUNT_DAYS_THRESHOLD = 3;
const DISCOUNT_PERCENT = 15;

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000))) + 1;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  return day === 0 || day === 5 || day === 6; // Fre, Lör, Sön
}

function rangeIncludesWeekday(start: Date, end: Date): boolean {
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endTime = end.getTime();
  while (current.getTime() <= endTime) {
    if (!isWeekend(current)) return true;
    current.setDate(current.getDate() + 1);
  }
  return false;
}

/** Nästa fredag från ett datum (samma dag om det redan är fredag). */
function nextFriday(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = sön, 5 = fre
  const daysToAdd = (5 - day + 7) % 7;
  d.setDate(d.getDate() + daysToAdd);
  return d;
}

function formatWeekendLabel(friday: Date): string {
  const sunday = new Date(friday);
  sunday.setDate(sunday.getDate() + 2);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${friday.toLocaleDateString("sv-SE", opts)} – ${sunday.toLocaleDateString("sv-SE", opts)}`;
}

/** Datum som YYYY-MM-DD i lokaltid (undviker UTC-off-by-one). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type WeekendOption = { label: string; start: string; end: string };

function useUpcomingWeekends(count: number): WeekendOption[] {
  return useMemo(() => {
    const list: WeekendOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let friday = nextFriday(today);
    for (let i = 0; i < count; i++) {
      const sunday = new Date(friday);
      sunday.setDate(sunday.getDate() + 2);
      list.push({
        label: formatWeekendLabel(friday),
        start: toLocalDateString(friday),
        end: toLocalDateString(sunday),
      });
      friday.setDate(friday.getDate() + 7);
      friday = new Date(friday);
    }
    return list;
  }, [count]);
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export type BookingCalculatorProps = {
  slug: string;
  pricePerDay: number;
  className?: string;
  title?: string;
  luxuryStyle?: boolean;
  weekendOnly?: boolean;
  weekendNotice?: string;
  weekendErrorMessage?: string;
};

export function BookingCalculator({
  slug,
  pricePerDay,
  className = "",
  title = "Beräkna hyra",
  luxuryStyle = false,
  weekendOnly = false,
  weekendNotice = "Bastun hyrs ut helger (Fre-Sön). Välj start- och slutdatum inom en helg.",
  weekendErrorMessage = "Välj en helg (Fredag-Söndag) för att gå vidare.",
}: BookingCalculatorProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  const upcomingWeekends = useUpcomingWeekends(12);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedWeekendValue, setSelectedWeekendValue] = useState<string>("");

  const { days, subtotal, discount, total, hasDiscount } = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const d = daysBetween(start, end);
    const subtotal = d * pricePerDay;
    const applyDiscount = d > DISCOUNT_DAYS_THRESHOLD;
    const discount = applyDiscount ? subtotal * (DISCOUNT_PERCENT / 100) : 0;
    const total = subtotal - discount;
    return {
      days: d,
      subtotal,
      discount,
      total,
      hasDiscount: applyDiscount,
    };
  }, [startDate, endDate, pricePerDay]);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const hasValidRange = startDate && endDate && end >= start;
  const hasWeekdayWhenWeekendOnly =
    weekendOnly && hasValidRange && rangeIncludesWeekday(start, end);
  const selectedWeekend = weekendOnly
    ? upcomingWeekends.find((w) => w.start === selectedWeekendValue)
    : null;
  const datesWithinWeekend =
    selectedWeekend &&
    startDate >= selectedWeekend.start &&
    endDate <= selectedWeekend.end &&
    startDate <= endDate;
  const hasSelectedWeekend = weekendOnly && selectedWeekendValue !== "";
  const canProceed = weekendOnly
    ? hasSelectedWeekend && !!datesWithinWeekend
    : hasValidRange && !hasWeekdayWhenWeekendOnly;
  const kassaHref = canProceed
    ? `/kassa?product=${encodeURIComponent(slug)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    : "#";

  const base = !luxuryStyle;
  const cardCls = base
    ? "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    : "rounded-2xl border border-amber-500/30 bg-slate-800/95 p-6 shadow-xl backdrop-blur";
  const headingCls = base
    ? "text-lg font-semibold text-slate-900"
    : "font-playfair text-xl font-semibold text-amber-50";
  const labelCls = base
    ? "text-sm font-medium text-slate-700"
    : "text-sm font-medium text-amber-100/90";
  const noticeCls = base
    ? "mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
    : "mt-3 flex items-start gap-2 rounded-lg bg-amber-500/20 px-3 py-2.5 text-sm text-amber-200";
  const errorCls = base
    ? "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
    : "mt-3 rounded-lg bg-red-900/30 px-3 py-2 text-sm font-medium text-red-200";
  const inputCls = base
    ? "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
    : "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-amber-50 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  const dividerCls = base ? "border-slate-200" : "border-slate-600/50";
  const rowCls = base ? "text-sm text-slate-600" : "text-sm text-amber-100/80";
  const totalCls = base
    ? "text-base font-semibold text-slate-900"
    : "text-base font-semibold text-amber-50";
  const btnCls = canProceed
    ? base
      ? "block w-full rounded-lg bg-amber-500 py-3 text-center font-semibold text-slate-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      : "block w-full rounded-xl bg-amber-600 py-3.5 text-center font-semibold text-slate-900 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800"
    : "block w-full cursor-not-allowed rounded-lg bg-slate-600 py-3 text-center font-semibold text-slate-400";

  return (
    <div className={`${cardCls} ${className}`}>
      <h3 className={headingCls}>{title}</h3>
      {weekendOnly && (
        <p className={noticeCls}>
          {luxuryStyle && (
            <StarIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          )}
          <span>{weekendNotice}</span>
        </p>
      )}
      {weekendOnly ? (
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="booking-weekend"
              className={`mb-1 block ${labelCls}`}
            >
              Välj helg
            </label>
            <select
              id="booking-weekend"
              value={selectedWeekendValue}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedWeekendValue(value);
                const weekend = upcomingWeekends.find((w) => w.start === value);
                if (weekend) {
                  setStartDate(weekend.start);
                  setEndDate(weekend.end);
                }
              }}
              className={inputCls}
            >
              <option value="">Välj helg...</option>
              {upcomingWeekends.map((w) => (
                <option key={w.start} value={w.start}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          {selectedWeekend && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-start"
                  className={`mb-1 block ${labelCls}`}
                >
                  Från datum
                </label>
                <input
                  id="booking-start"
                  type="date"
                  value={startDate}
                  min={selectedWeekend.start}
                  max={selectedWeekend.end}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart > endDate) setEndDate(newStart);
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="booking-end"
                  className={`mb-1 block ${labelCls}`}
                >
                  Till datum
                </label>
                <input
                  id="booking-end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={selectedWeekend.end}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setEndDate(newEnd);
                    if (newEnd < startDate) setStartDate(newEnd);
                  }}
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="booking-start" className={`mb-1 block ${labelCls}`}>
              Startdatum
            </label>
            <input
              id="booking-start"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="booking-end" className={`mb-1 block ${labelCls}`}>
              Slutdatum
            </label>
            <input
              id="booking-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}
      <div className={`mt-6 space-y-2 border-t ${dividerCls} pt-4`}>
        <div className={`flex justify-between ${rowCls}`}>
          <span>
            {days} {days === 1 ? "dygn" : "dygn"} ×{" "}
            {pricePerDay.toLocaleString("sv-SE")} kr
          </span>
          <span>{subtotal.toLocaleString("sv-SE")} kr</span>
        </div>
        {hasDiscount && (
          <>
            <div
              className={`flex justify-between text-sm ${luxuryStyle ? "text-amber-400" : "text-amber-700"}`}
            >
              <span>Mängdrabatt ({DISCOUNT_PERCENT}%)</span>
              <span>-{discount.toLocaleString("sv-SE")} kr</span>
            </div>
            <p
              className={`text-sm font-medium ${luxuryStyle ? "text-amber-400" : "text-amber-700"}`}
            >
              Mängdrabatt applicerad!
            </p>
          </>
        )}
        <div
          className={`flex justify-between border-t ${dividerCls} pt-2 ${totalCls}`}
        >
          <span>Totalt</span>
          <span>{total.toLocaleString("sv-SE")} kr</span>
        </div>
      </div>
      <div className="mt-6">
        {canProceed ? (
          <Link href={kassaHref} className={btnCls}>
            Boka
          </Link>
        ) : (
          <button type="button" disabled className={btnCls}>
            Boka
          </button>
        )}
      </div>
    </div>
  );
}
