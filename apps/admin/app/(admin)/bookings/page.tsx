"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  X,
  CheckCircle2,
  ChevronRight,
  XCircle,
} from "lucide-react";
import type { BookingPaymentStatus } from "@booking-system/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { BookingStatusBadges } from "@/app/components/booking-status-badges";
import {
  BOOKING_STATUS_LABELS,
  bookingDisplayAddress,
  fetchBookings,
  formatBookingPeriod,
  formatTermsAcceptedAt,
  PAYMENT_STATUS_LABELS,
  type BookingListRow,
  type BookingStatus,
} from "@/lib/supabase/bookings";

type FilterStatus = "alla" | BookingStatus;

const DEFAULT_DELIVERY_TIME = "09:00–12:00";

function productImageSrc(image: string): string | null {
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("alla");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (!isSupabaseConfigured()) {
      setBookings([]);
      setLoadError("Supabase är inte konfigurerat.");
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchBookings(supabase);
      setBookings(rows);
    } catch (e) {
      console.error("bookings page: load", e);
      setBookings([]);
      setLoadError(
        e instanceof Error ? e.message : "Kunde inte hämta bokningar."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "alla") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const selectedBooking = selectedId
    ? bookings.find((b) => b.id === selectedId)
    : null;

  const openDetail = (id: string) => setSelectedId(id);
  const closeDetail = () => {
    setSelectedId(null);
    setActionMessage(null);
  };

  const approveBooking = async (booking: BookingListRow) => {
    setConfirmingId(booking.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailSent?: boolean;
        emailError?: string;
        emailSkippedReason?: string;
      };

      if (!res.ok) {
        throw new Error(body.error || "Kunde inte godkänna bokningen.");
      }

      const sentAt = new Date().toISOString();
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: "confirmed" as const,
                payment_status: "succeeded" as const,
                confirmation_email_sent_at: body.emailSent ? sentAt : b.confirmation_email_sent_at,
              }
            : b
        )
      );

      if (body.emailSent) {
        setActionMessage(
          `Bokningen är bekräftad. E-post skickad till ${booking.customer_email} med leveransinfo (ca ${DEFAULT_DELIVERY_TIME}).`
        );
      } else if (body.emailSkippedReason) {
        setActionMessage(
          `Bokningen är bekräftad, men bekräftelsemejl skickades inte: ${body.emailSkippedReason}`
        );
      } else if (body.emailError) {
        setActionMessage(
          `Bokningen är bekräftad, men e-post misslyckades: ${body.emailError}`
        );
      } else {
        setActionMessage("Bokningen är bekräftad.");
      }
      setTimeout(() => setActionMessage(null), 8000);
    } catch (e) {
      console.error("bookings page: confirm", e);
      setActionMessage(
        e instanceof Error ? e.message : "Kunde inte godkänna bokningen."
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const cancelBooking = async (booking: BookingListRow) => {
    if (
      !window.confirm("Är du säker på att du vill avbryta bokningen?")
    ) {
      return;
    }

    setCancelingId(booking.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        paymentStatus?: BookingPaymentStatus | null;
      };

      if (!res.ok) {
        throw new Error(body.error || "Kunde inte avbryta bokningen.");
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: "canceled" as const,
                payment_status: body.paymentStatus ?? b.payment_status,
              }
            : b
        )
      );

      if (body.paymentStatus === "refunded") {
        setActionMessage(
          "Bokningen är avbruten och beloppet har återbetalats."
        );
      } else if (body.paymentStatus === "canceled") {
        setActionMessage(
          "Bokningen är avbruten och den reserverade summan har släppts."
        );
      } else {
        setActionMessage("Bokningen är avbruten.");
      }
      setTimeout(() => setActionMessage(null), 8000);
    } catch (e) {
      console.error("bookings page: cancel", e);
      setActionMessage(
        e instanceof Error ? e.message : "Kunde inte avbryta bokningen."
      );
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
            Bokningar
          </h1>
          <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
            Klicka på en rad för detaljer och godkänn preliminära bokningar.
          </p>
        </div>
        <Link
          href="/calendar"
          className="admin-btn-secondary inline-flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          Visa i kalender
        </Link>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="admin-card border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-5 py-4 text-sm text-[rgb(var(--admin-error))]"
        >
          {loadError}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["alla", "pending", "confirmed", "canceled"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              statusFilter === value
                ? "bg-[rgb(var(--admin-primary))] text-white shadow-admin"
                : "border border-[rgb(var(--admin-border))] bg-white text-[rgb(var(--admin-text-muted))] hover:bg-slate-100"
            }`}
          >
            {value === "alla" ? "Alla" : BOOKING_STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-3 p-8">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-[rgb(var(--admin-primary))] border-t-transparent"
              aria-hidden
            />
            <p className="text-[rgb(var(--admin-text-muted))]">Laddar bokningar…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[rgb(var(--admin-border))] bg-slate-50/80">
                  <th className="admin-table-th w-14">Bild</th>
                  <th className="admin-table-th">Vad som hyrs</th>
                  <th className="admin-table-th">Kund</th>
                  <th className="admin-table-th">Period</th>
                  <th className="admin-table-th">Pris</th>
                  <th className="admin-table-th">Status</th>
                  <th className="admin-table-th w-10" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--admin-border-muted))]">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="admin-table-td py-12 text-center text-[rgb(var(--admin-text-muted))]"
                    >
                      Inga bokningar med vald status.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((row) => {
                    const imageSrc = productImageSrc(row.products?.image ?? "");
                    const productName =
                      row.products?.name ?? row.product_id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => openDetail(row.id)}
                        className="cursor-pointer bg-white transition hover:bg-slate-50/70"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail(row.id);
                          }
                        }}
                      >
                        <td className="admin-table-td">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[rgb(var(--admin-border))] bg-slate-100">
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[10px] text-[rgb(var(--admin-text-subtle))]">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="admin-table-td font-medium text-[rgb(var(--admin-text))]">
                          {productName}
                        </td>
                        <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                          {row.customer_name}
                        </td>
                        <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                          {formatBookingPeriod(row.start_date, row.end_date)}
                        </td>
                        <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                          {row.total_price.toLocaleString("sv-SE")} kr
                        </td>
                        <td className="admin-table-td">
                          <BookingStatusBadges
                            status={row.status}
                            payment_status={row.payment_status}
                          />
                        </td>
                        <td className="admin-table-td w-10">
                          <ChevronRight
                            className="h-4 w-4 text-slate-400"
                            aria-hidden
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBooking ? (
        <BookingDetailPanel
          booking={selectedBooking}
          productName={selectedBooking.products?.name ?? selectedBooking.product_id}
          productImage={selectedBooking.products?.image ?? ""}
          onClose={closeDetail}
          onApprove={() => void approveBooking(selectedBooking)}
          onCancel={() => void cancelBooking(selectedBooking)}
          actionMessage={actionMessage}
          confirming={confirmingId === selectedBooking.id}
          canceling={cancelingId === selectedBooking.id}
          defaultDeliveryTime={DEFAULT_DELIVERY_TIME}
        />
      ) : null}
    </div>
  );
}

function BookingDetailPanel({
  booking,
  productName,
  productImage,
  onClose,
  onApprove,
  onCancel,
  actionMessage,
  confirming,
  canceling,
  defaultDeliveryTime,
}: {
  booking: BookingListRow;
  productName: string;
  productImage: string;
  onClose: () => void;
  onApprove: () => void;
  onCancel: () => void;
  actionMessage: string | null;
  confirming: boolean;
  canceling: boolean;
  defaultDeliveryTime: string;
}) {
  const actionBusy = confirming || canceling;
  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";
  const imageSrc = productImageSrc(productImage);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] shadow-admin-lg animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[rgb(var(--admin-border))] px-6 py-4">
          <h2
            id="booking-detail-title"
            className="text-lg font-semibold text-[rgb(var(--admin-text))]"
          >
            Bokningsdetaljer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))]"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {imageSrc ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[rgb(var(--admin-border))] bg-slate-100">
                <Image
                  src={imageSrc}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            ) : null}

            <div>
              <p className="admin-label">Status</p>
              <BookingStatusBadges
                status={booking.status}
                payment_status={booking.payment_status}
              />
            </div>

            <div>
              <p className="admin-label">Produkt</p>
              <p className="font-medium text-[rgb(var(--admin-text))]">
                {productName}
              </p>
            </div>
            <div>
              <p className="admin-label">Period</p>
              <p className="text-[rgb(var(--admin-text))]">
                {formatBookingPeriod(booking.start_date, booking.end_date)}
              </p>
            </div>
            <div>
              <p className="admin-label">Totalpris</p>
              <p className="font-medium text-[rgb(var(--admin-text))]">
                {booking.total_price.toLocaleString("sv-SE")} kr
              </p>
            </div>

            <div>
              <p className="admin-label">Bokad av</p>
              <p className="font-medium text-[rgb(var(--admin-text))]">
                {booking.customer_name}
              </p>
            </div>
            <div>
              <p className="admin-label">Telefon</p>
              <a
                href={`tel:${booking.customer_phone}`}
                className="text-[rgb(var(--admin-primary))] hover:underline"
              >
                {booking.customer_phone}
              </a>
            </div>
            <div>
              <p className="admin-label">E-post</p>
              <a
                href={`mailto:${booking.customer_email}`}
                className="text-[rgb(var(--admin-primary))] hover:underline"
              >
                {booking.customer_email}
              </a>
            </div>
            <div>
              <p className="admin-label">Org.nr / personnr</p>
              <p className="text-[rgb(var(--admin-text))]">
                {booking.org_number ?? "—"}
              </p>
            </div>
            <div>
              <p className="admin-label">Leveransadress</p>
              <p className="text-[rgb(var(--admin-text))]">
                {bookingDisplayAddress(booking)}
              </p>
            </div>
            {booking.customer_notes ? (
              <div>
                <p className="admin-label">Meddelande från kund</p>
                <p className="whitespace-pre-wrap text-[rgb(var(--admin-text))]">
                  {booking.customer_notes}
                </p>
              </div>
            ) : null}

            <div>
              <p className="admin-label">Hyresvillkor godkända</p>
              {booking.terms_accepted_at ? (
                <p className="font-medium text-emerald-700">
                  Ja – {formatTermsAcceptedAt(booking.terms_accepted_at)}
                </p>
              ) : (
                <p className="font-medium text-amber-700">Nej – saknas i bokningen</p>
              )}
            </div>

            <div>
              <p className="admin-label">E-post (transaktionella)</p>
              <ul className="mt-1 space-y-1 text-sm text-[rgb(var(--admin-text))]">
                <li>
                  Mottagande:{" "}
                  {booking.booking_received_email_sent_at
                    ? formatTermsAcceptedAt(booking.booking_received_email_sent_at)
                    : "Ej skickat / ej loggat"}
                </li>
                <li>
                  Bekräftelse:{" "}
                  {booking.confirmation_email_sent_at
                    ? formatTermsAcceptedAt(booking.confirmation_email_sent_at)
                    : "Ej skickat / ej loggat"}
                </li>
              </ul>
            </div>

            {booking.accepted_agreement_snapshot ? (
              <div>
                <p className="admin-label">Avtalstext vid bokning (snapshot)</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[rgb(var(--admin-border))] bg-slate-50/80 p-3">
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[rgb(var(--admin-text))]">
                    {booking.accepted_agreement_snapshot}
                  </pre>
                </div>
              </div>
            ) : null}

            {booking.status === "pending" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="font-medium text-amber-900">Godkänn bokningen</p>
                <p className="mt-1 text-sm text-amber-800">
                  När du godkänner debiteras det reserverade beloppet och kunden får
                  bekräftelse via e-post med leveransinfo (ca {defaultDeliveryTime}).
                </p>
                {booking.payment_status !== "requires_capture" ? (
                  <p className="mt-2 text-sm font-medium text-amber-900">
                    Godkännande är tillgängligt när betalningen är{" "}
                    {PAYMENT_STATUS_LABELS.requires_capture.toLowerCase()} (nu:{" "}
                    {PAYMENT_STATUS_LABELS[booking.payment_status].toLowerCase()}).
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={
                      actionBusy ||
                      booking.payment_status !== "requires_capture"
                    }
                    className="admin-btn-primary flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                    {confirming ? "Godkänner…" : "Godkänn bokning och debitera"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={actionBusy}
                    className="admin-btn-secondary flex-1 gap-2 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                  >
                    <XCircle className="h-5 w-5" aria-hidden />
                    {canceling ? "Avbryter…" : "Neka / Avbryt"}
                  </button>
                </div>
              </div>
            ) : null}

            {booking.status === "confirmed" && canCancel ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
                <p className="font-medium text-red-900">Avbryt bekräftad bokning</p>
                <p className="mt-1 text-sm text-red-800">
                  Om betalningen redan debiterats återbetalas beloppet till kundens
                  kort.
                </p>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={actionBusy}
                  className="admin-btn-secondary mt-4 w-full gap-2 border-red-300 bg-white text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  <XCircle className="h-5 w-5" aria-hidden />
                  {canceling ? "Avbryter…" : "Neka / Avbryt"}
                </button>
              </div>
            ) : null}

            {actionMessage ? (
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  actionMessage.includes("avbruten") ||
                  actionMessage.includes("Avbruten")
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {actionMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
