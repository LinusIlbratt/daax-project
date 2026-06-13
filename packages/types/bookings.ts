import type {
  AgreementVerification,
  AgreementVerificationMethod,
} from "./booking-verification";

export type { AgreementVerification, AgreementVerificationMethod };

export const BOOKING_STATUSES = ["pending", "confirmed", "canceled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_PAYMENT_STATUSES = [
  "pending",
  "requires_capture",
  "succeeded",
  "canceled",
  "refunded",
] as const;
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number];

/** Fields added for checkout / logistics (nullable in DB). */
export type BookingCustomerExtraFields = {
  delivery_address: string | null;
  org_number: string | null;
  customer_notes: string | null;
};

/** Legal acceptance captured at checkout (null on legacy rows). */
export type BookingTermsFields = {
  terms_accepted_at: string | null;
  accepted_agreement_snapshot: string | null;
};

export type BookingStripePaymentFields = {
  stripe_payment_intent_id: string | null;
  payment_status: BookingPaymentStatus;
};

export type BookingRecordFields = {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus;
} & BookingCustomerExtraFields &
  BookingTermsFields &
  BookingStripePaymentFields;

export type CreateBookingPayload = {
  productId: string;
  startDate: string;
  endDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orgNumber: string;
  deliveryAddress: string | null;
  customerNotes: string | null;
  verification: AgreementVerification;
};

export type BookingInsertPayload = {
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending";
  payment_status: "pending";
  stripe_payment_intent_id?: string | null;
  delivery_address: string | null;
  org_number: string;
  customer_notes: string | null;
  terms_accepted_at: string;
  accepted_agreement_snapshot: string;
  agreement_verification_method: AgreementVerificationMethod;
  agreement_verification_ref?: string | null;
};
