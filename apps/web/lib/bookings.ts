import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookingInsertPayload,
  CreateBookingPayload,
} from "@booking-system/types";
import { resolveAgreementText } from "@/lib/agreement-texts";
import {
  assertEidSignatureVerified,
  assertVerificationMethodEnabled,
  parseAgreementVerification,
  verificationToBookingFields,
} from "@/lib/booking-verification";
import { DISCOUNT_DAYS_THRESHOLD, DISCOUNT_PERCENT, daysBetween } from "@/lib/products";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type { CreateBookingPayload as CreateBookingInput };

export type CreatedBookingResult = {
  id: string;
  customerEmail: string;
  customerName: string;
  productName: string;
  productId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  requiresDelivery: boolean;
};

export function isBookingDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime());
}

export function calculateBookingTotal(
  pricePerDay: number,
  startDate: string,
  endDate: string
): { days: number; totalPrice: number } {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const days = daysBetween(start, end);
  const subtotal = days * pricePerDay;
  const hasDiscount = days > DISCOUNT_DAYS_THRESHOLD;
  const discount = hasDiscount ? subtotal * (DISCOUNT_PERCENT / 100) : 0;
  const totalPrice = Math.round(subtotal - discount);
  return { days, totalPrice };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.trim();
}

function normalizeOptionalText(value: string | null, maxLen: number): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) return null;
  return trimmed;
}

export function validateCreateBookingInput(
  body: unknown
): { ok: true; data: CreateBookingPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const raw = body as Record<string, unknown>;

  const productId =
    typeof raw.productId === "string" ? raw.productId.trim() : "";
  const startDate =
    typeof raw.startDate === "string" ? raw.startDate.trim() : "";
  const endDate = typeof raw.endDate === "string" ? raw.endDate.trim() : "";
  const customerName =
    typeof raw.customerName === "string" ? raw.customerName.trim() : "";
  const customerEmail =
    typeof raw.customerEmail === "string" ? raw.customerEmail.trim() : "";
  const customerPhone =
    typeof raw.customerPhone === "string" ? raw.customerPhone.trim() : "";
  const orgNumber =
    typeof raw.orgNumber === "string" ? raw.orgNumber.trim() : "";
  const deliveryAddressRaw =
    raw.deliveryAddress === null || raw.deliveryAddress === undefined
      ? null
      : typeof raw.deliveryAddress === "string"
        ? raw.deliveryAddress.trim()
        : "";
  const customerNotesRaw =
    raw.customerNotes === null || raw.customerNotes === undefined
      ? null
      : typeof raw.customerNotes === "string"
        ? raw.customerNotes.trim()
        : "";
  if (!productId || productId.length > 120) {
    return { ok: false, error: "productId is required" };
  }
  if (!isBookingDateString(startDate) || !isBookingDateString(endDate)) {
    return { ok: false, error: "startDate and endDate must be YYYY-MM-DD" };
  }
  if (endDate < startDate) {
    return { ok: false, error: "endDate must be on or after startDate" };
  }
  if (customerName.length < 2 || customerName.length > 200) {
    return { ok: false, error: "customerName is required" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { ok: false, error: "customerEmail is invalid" };
  }
  if (customerPhone.length < 6 || customerPhone.length > 40) {
    return { ok: false, error: "customerPhone is required" };
  }
  if (orgNumber.length < 6 || orgNumber.length > 30) {
    return { ok: false, error: "orgNumber is required" };
  }

  const deliveryAddress =
    deliveryAddressRaw === "" || deliveryAddressRaw === null
      ? null
      : deliveryAddressRaw.length > 500
        ? null
        : deliveryAddressRaw;
  if (deliveryAddressRaw && deliveryAddress === null) {
    return { ok: false, error: "deliveryAddress is too long" };
  }

  const customerNotes = normalizeOptionalText(customerNotesRaw, 2000);
  if (
    customerNotesRaw &&
    customerNotesRaw.trim().length > 0 &&
    customerNotes === null
  ) {
    return { ok: false, error: "customerNotes is too long" };
  }

  const verificationResult = parseAgreementVerification(raw);
  if (!verificationResult.ok) {
    return { ok: false, error: verificationResult.error };
  }

  try {
    assertVerificationMethodEnabled(verificationResult.verification);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification not enabled";
    return { ok: false, error: message };
  }

  return {
    ok: true,
    data: {
      productId,
      startDate,
      endDate,
      customerName,
      customerEmail: normalizeEmail(customerEmail),
      customerPhone: normalizePhone(customerPhone),
      orgNumber,
      deliveryAddress,
      customerNotes,
      verification: verificationResult.verification,
    },
  };
}

export async function createBooking(
  supabase: SupabaseClient,
  input: CreateBookingPayload
): Promise<CreatedBookingResult> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("slug, name, price_per_day, is_active, requires_delivery, agreement")
    .eq("slug", input.productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError) {
    console.error("bookings:create product lookup", productError.message, productError);
    throw new Error("Failed to verify product");
  }
  if (!product) {
    throw new Error("Product not found or not available");
  }

  const requiresDelivery = Boolean(product.requires_delivery);
  if (requiresDelivery && !input.deliveryAddress) {
    throw new Error("deliveryAddress is required for this product");
  }

  const agreementField =
    typeof product.agreement === "string" ? product.agreement : "";
  const expectedSnapshot = resolveAgreementText(agreementField);

  if (input.verification.method === "eid_signature") {
    await assertEidSignatureVerified(input.verification);
  }

  const agreementFields = verificationToBookingFields(input.verification);
  if (
    agreementFields.accepted_agreement_snapshot.trim() !==
    expectedSnapshot.trim()
  ) {
    throw new Error(
      "Agreement text has changed. Please reload the page and accept the terms again."
    );
  }

  const { data: conflictingBookings, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("product_id", input.productId)
    .in("status", ["pending", "confirmed"])
    .in("payment_status", ["pending", "requires_capture", "succeeded"])
    .lte("start_date", input.endDate)
    .gte("end_date", input.startDate)
    .limit(1);

  if (conflictError) {
    console.error(
      "bookings:create overlap check",
      conflictError.message,
      conflictError
    );
    throw new Error("Failed to verify availability");
  }

  if (conflictingBookings && conflictingBookings.length > 0) {
    throw new Error("Selected dates are no longer available for this product");
  }

  const { data: blockedRows, error: blockedError } = await supabase
    .from("blocked_dates")
    .select("date")
    .gte("date", input.startDate)
    .lte("date", input.endDate);

  if (blockedError) {
    console.error("bookings:create blocked_dates", blockedError.message, blockedError);
    throw new Error("Failed to verify availability");
  }

  const blockedSet = new Set(
    (blockedRows ?? []).map((r) => {
      const row = r as { date: string };
      return row.date;
    })
  );

  if (blockedSet.size > 0) {
    const cursor = new Date(`${input.startDate}T12:00:00`);
    const end = new Date(`${input.endDate}T12:00:00`);
    while (cursor <= end) {
      const key = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");
      if (blockedSet.has(key)) {
        throw new Error("Selected dates include blocked days");
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const { totalPrice } = calculateBookingTotal(
    product.price_per_day as number,
    input.startDate,
    input.endDate
  );

  const row: BookingInsertPayload = {
    product_id: input.productId,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    start_date: input.startDate,
    end_date: input.endDate,
    total_price: totalPrice,
    status: "pending",
    payment_status: "pending",
    delivery_address: input.deliveryAddress,
    org_number: input.orgNumber,
    customer_notes: input.customerNotes,
    ...agreementFields,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("bookings:create insert", error.message, error);
    if (error.code === "23P01") {
      throw new Error("Selected dates are no longer available for this product");
    }
    throw new Error("Failed to create booking");
  }

  const id = (data as { id: string } | null)?.id;
  if (!id) {
    throw new Error("Failed to create booking");
  }

  return {
    id,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    productName:
      typeof product.name === "string" ? product.name : input.productId,
    productId: input.productId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice,
    requiresDelivery,
  };
}
