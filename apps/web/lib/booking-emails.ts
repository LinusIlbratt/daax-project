import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatBookingPeriod,
  sendBookingReceivedEmail,
} from "@booking-system/emails";
import type { CreatedBookingResult } from "@/lib/bookings";

export async function sendReceivedEmailForBooking(
  supabase: SupabaseClient,
  booking: CreatedBookingResult
): Promise<void> {
  const result = await sendBookingReceivedEmail(booking.customerEmail, {
    customerName: booking.customerName,
    productName: booking.productName,
    periodLabel: formatBookingPeriod(booking.startDate, booking.endDate),
    totalPrice: booking.totalPrice,
  });

  if (!result.ok) {
    if (result.skipped) {
      console.warn("booking-emails:received skipped", result.reason);
    }
    return;
  }

  const sentAt = new Date().toISOString();
  const { error } = await supabase
    .from("bookings")
    .update({ booking_received_email_sent_at: sentAt })
    .eq("id", booking.id);

  if (error) {
    console.error(
      "booking-emails:received update sent_at",
      error.message,
      error
    );
  }
}
