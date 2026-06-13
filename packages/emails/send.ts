import { render } from "@react-email/render";
import {
  BookingConfirmedEmail,
  bookingConfirmedSubject,
  type BookingConfirmedEmailProps,
} from "./BookingConfirmedEmail";
import {
  BookingReceivedEmail,
  bookingReceivedSubject,
  type BookingReceivedEmailProps,
} from "./BookingReceivedEmail";
import { createResendClient, getResendConfigFromEnv } from "./lib/resend-client";

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

export async function sendBookingReceivedEmail(
  to: string,
  props: BookingReceivedEmailProps
): Promise<SendEmailResult> {
  const config = getResendConfigFromEnv();
  if (!config) {
    console.error(
      "emails:sendBookingReceived missing RESEND_API_KEY or RESEND_FROM_EMAIL"
    );
    return {
      ok: false,
      skipped: true,
      reason: "Resend is not configured",
    };
  }

  try {
    const resend = createResendClient(config);
    const html = await render(BookingReceivedEmail(props));
    const { data, error } = await resend.emails.send({
      from: config.from,
      to,
      subject: bookingReceivedSubject(props.productName),
      html,
    });

    if (error) {
      console.error("emails:sendBookingReceived", error.message, error);
      return { ok: false, skipped: false, error: error.message };
    }

    const id = data?.id;
    if (!id) {
      return { ok: false, skipped: false, error: "Resend returned no message id" };
    }

    return { ok: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("emails:sendBookingReceived", message, e);
    return { ok: false, skipped: false, error: message };
  }
}

export async function sendBookingConfirmedEmail(
  to: string,
  props: BookingConfirmedEmailProps
): Promise<SendEmailResult> {
  const config = getResendConfigFromEnv();
  if (!config) {
    console.error(
      "emails:sendBookingConfirmed missing RESEND_API_KEY or RESEND_FROM_EMAIL"
    );
    return {
      ok: false,
      skipped: true,
      reason: "Resend is not configured",
    };
  }

  try {
    const resend = createResendClient(config);
    const html = await render(BookingConfirmedEmail(props));
    const { data, error } = await resend.emails.send({
      from: config.from,
      to,
      subject: bookingConfirmedSubject(props.productName),
      html,
    });

    if (error) {
      console.error("emails:sendBookingConfirmed", error.message, error);
      return { ok: false, skipped: false, error: error.message };
    }

    const id = data?.id;
    if (!id) {
      return { ok: false, skipped: false, error: "Resend returned no message id" };
    }

    return { ok: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("emails:sendBookingConfirmed", message, e);
    return { ok: false, skipped: false, error: message };
  }
}
