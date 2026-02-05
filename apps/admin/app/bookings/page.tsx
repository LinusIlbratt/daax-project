"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, X, CheckCircle2, FileSignature } from "lucide-react";

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
  email: string;
  address: string;
  agreementSigned: boolean;
  /** Beräknad leveranstid (visas efter godkännande / i bekräftelse-SMS). */
  estimatedDeliveryTime?: string;
};

const INITIAL_BOOKINGS: MockBooking[] = [
  {
    id: "b1",
    machineIndex: 0,
    startDay: 2,
    endDay: 4,
    status: "uthyrd",
    kund: "Bygg AB",
    tel: "070-123 45 67",
    email: "bestallning@byggab.se",
    address: "Industrigatan 12, 451 00 Uddevalla",
    agreementSigned: true,
    estimatedDeliveryTime: "08:00–10:00",
  },
  {
    id: "b2",
    machineIndex: 1,
    startDay: 5,
    endDay: 5,
    status: "preliminär",
    kund: "Anna Andersson",
    tel: "073-987 65 43",
    email: "anna.andersson@example.com",
    address: "Storgatan 5, 451 50 Vänersborg",
    agreementSigned: false,
  },
  {
    id: "b3",
    machineIndex: 2,
    startDay: 1,
    endDay: 3,
    status: "uthyrd",
    kund: "Event & Fest AB",
    tel: "076-555 12 34",
    email: "bokning@eventfest.se",
    address: "Festvägen 1, 451 00 Uddevalla",
    agreementSigned: true,
    estimatedDeliveryTime: "09:00–12:00",
  },
  {
    id: "b4",
    machineIndex: 0,
    startDay: 8,
    endDay: 9,
    status: "service",
    kund: "—",
    tel: "—",
    email: "—",
    address: "—",
    agreementSigned: false,
  },
  {
    id: "b5",
    machineIndex: 1,
    startDay: 0,
    endDay: 2,
    status: "uthyrd",
    kund: "Gröntan AB",
    tel: "070-111 22 33",
    email: "info@grontan.se",
    address: "Trädgårdsvägen 8, 451 00 Uddevalla",
    agreementSigned: true,
    estimatedDeliveryTime: "07:30–09:00",
  },
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

function formatDate(dayIndex: number): string {
  const days = getNextDays(14);
  const d = days[dayIndex];
  return d ? d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  uthyrd: "bg-emerald-100 text-emerald-800",
  preliminär: "bg-amber-100 text-amber-800",
  service: "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  uthyrd: "Uthyrd",
  preliminär: "Preliminär",
  service: "Service",
};

type FilterStatus = "alla" | BookingStatus;

const DEFAULT_DELIVERY_TIME = "09:00–12:00";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<MockBooking[]>(INITIAL_BOOKINGS);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("alla");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approveMessage, setApproveMessage] = useState<string | null>(null);

  const days = useMemo(() => getNextDays(14), []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "alla") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const selectedBooking = selectedId ? bookings.find((b) => b.id === selectedId) : null;

  const openDetail = (id: string) => setSelectedId(id);
  const closeDetail = () => {
    setSelectedId(null);
    setApproveMessage(null);
  };

  const approveBooking = (booking: MockBooking) => {
    const deliveryTime = booking.estimatedDeliveryTime ?? DEFAULT_DELIVERY_TIME;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, status: "uthyrd" as const, estimatedDeliveryTime: deliveryTime }
          : b
      )
    );
    setApproveMessage(
      `SMS skickat till ${booking.tel} med bekräftelse och beräknad leveranstid ${deliveryTime}. Bokningen är nu godkänd.`
    );
    setTimeout(() => setApproveMessage(null), 8000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bokningar</h1>
          <p className="mt-1 text-slate-600">
            Klicka på en bokning för att se detaljer. Preliminära bokningar kan godkännas här.
          </p>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          Visa i kalender
        </Link>
      </div>

      {/* Filter på status */}
      <div className="flex flex-wrap gap-2">
        {(["alla", "uthyrd", "preliminär", "service"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === value
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {value === "alla" ? "Alla" : STATUS_LABEL[value]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Produkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Kund
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Slut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Inga bokningar med vald status.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row.id)}
                    className="cursor-pointer bg-white transition hover:bg-slate-50/80"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail(row.id);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {MOCK_PRODUCTS[row.machineIndex]}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {row.kund}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {row.tel}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {formatDate(row.startDay)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {formatDate(row.endDay)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detaljpanel / modal */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          productName={MOCK_PRODUCTS[selectedBooking.machineIndex]}
          onClose={closeDetail}
          onApprove={() => approveBooking(selectedBooking)}
          approveMessage={approveMessage}
          defaultDeliveryTime={DEFAULT_DELIVERY_TIME}
        />
      )}

      <p className="text-sm text-slate-500">
        När kassan och bokningsflödet är kopplat kommer riktiga bokningar och
        SMS-utskick att hanteras här. Status: Uthyrd (bekräftad), Preliminär (väntar bekräftelse), Service.
      </p>
    </div>
  );
}

function BookingDetailPanel({
  booking,
  productName,
  onClose,
  onApprove,
  approveMessage,
  defaultDeliveryTime,
}: {
  booking: MockBooking;
  productName: string;
  onClose: () => void;
  onApprove: () => void;
  approveMessage: string | null;
  defaultDeliveryTime: string;
}) {
  const days = getNextDays(14);
  const startDate = days[booking.startDay];
  const endDate = days[booking.endDay];
  const formatD = (d: Date) => d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="booking-detail-title" className="text-lg font-semibold text-slate-900">
            Bokningsdetaljer
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </p>
              <p className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[booking.status]}`}
                >
                  {STATUS_LABEL[booking.status]}
                </span>
              </p>
            </div>

            {/* Produkt & period */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Produkt
              </p>
              <p className="mt-1 font-medium text-slate-900">{productName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Period
              </p>
              <p className="mt-1 text-slate-800">
                {startDate ? formatD(startDate) : "—"} – {endDate ? formatD(endDate) : "—"}
              </p>
            </div>

            {/* Kund & kontakt */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bokad av
              </p>
              <p className="mt-1 font-medium text-slate-900">{booking.kund}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Telefon
              </p>
              <p className="mt-1">
                <a href={`tel:${booking.tel}`} className="text-slate-800 underline hover:text-slate-600">
                  {booking.tel}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                E-post
              </p>
              <p className="mt-1">
                <a href={`mailto:${booking.email}`} className="text-slate-800 underline hover:text-slate-600">
                  {booking.email}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adress (leverans/hämtning)
              </p>
              <p className="mt-1 text-slate-800">{booking.address}</p>
            </div>

            {/* Avtal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avtal signerat
              </p>
              <p className="mt-1 flex items-center gap-2">
                {booking.agreementSigned ? (
                  <>
                    <FileSignature className="h-4 w-4 text-emerald-600" aria-hidden />
                    <span className="text-emerald-700 font-medium">Ja</span>
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 text-amber-600" aria-hidden />
                    <span className="text-amber-700 font-medium">Nej</span>
                  </>
                )}
              </p>
            </div>

            {booking.estimatedDeliveryTime && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Beräknad leveranstid
                </p>
                <p className="mt-1 text-slate-800">{booking.estimatedDeliveryTime}</p>
              </div>
            )}

            {/* Godkänn (endast preliminär) */}
            {booking.status === "preliminär" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-sm font-medium text-amber-900">
                  Godkänn bokningen
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  När du godkänner skickas ett SMS till kunden med bekräftelse och beräknad leveranstid ({defaultDeliveryTime}). Bokningen får då status Uthyrd.
                </p>
                <button
                  type="button"
                  onClick={onApprove}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  Godkänn bokning och skicka SMS
                </button>
              </div>
            )}

            {approveMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {approveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
