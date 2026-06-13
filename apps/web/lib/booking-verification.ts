import type {
  AgreementVerification,
  AgreementVerificationMethod,
  CreateBookingPayload,
} from "@booking-system/types";
import { AGREEMENT_VERIFICATION_METHODS } from "@booking-system/types";
import { ACTIVE_AGREEMENT_VERIFICATION_METHOD } from "@/lib/booking-config";

function isVerificationMethod(
  value: string
): value is AgreementVerificationMethod {
  return (AGREEMENT_VERIFICATION_METHODS as readonly string[]).includes(value);
}

function parseIsoTimestamp(value: string): string | null {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) {
    return null;
  }
  const now = Date.now();
  if (d.getTime() > now + 60_000) return null;
  if (d.getTime() < now - 24 * 60 * 60 * 1000) return null;
  return value;
}

function parseAgreementSnapshot(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 50) return null;
  if (trimmed.length > 100_000) return null;
  return trimmed;
}

function parseTermsAcceptanceVerification(
  raw: Record<string, unknown>
): TermsParseResult {
  const termsAcceptedAt =
    typeof raw.termsAcceptedAt === "string" ? raw.termsAcceptedAt.trim() : "";
  const acceptedAgreementSnapshot = parseAgreementSnapshot(
    raw.acceptedAgreementSnapshot
  );

  const acceptedAt = parseIsoTimestamp(termsAcceptedAt);
  if (!acceptedAt) {
    return { ok: false, error: "termsAcceptedAt must be a valid ISO timestamp" };
  }
  if (!acceptedAgreementSnapshot) {
    return { ok: false, error: "acceptedAgreementSnapshot is required" };
  }

  return {
    ok: true,
    verification: {
      method: "terms_acceptance",
      termsAcceptedAt: acceptedAt,
      acceptedAgreementSnapshot,
    },
  };
}

type TermsParseResult =
  | { ok: true; verification: AgreementVerification }
  | { ok: false; error: string };

export function parseAgreementVerification(
  body: Record<string, unknown>
): { ok: true; verification: AgreementVerification } | { ok: false; error: string } {
  const verificationRaw = body.verification;

  if (verificationRaw && typeof verificationRaw === "object") {
    const v = verificationRaw as Record<string, unknown>;
    const method =
      typeof v.method === "string" ? v.method.trim() : "";

    if (!isVerificationMethod(method)) {
      return { ok: false, error: "verification.method is invalid" };
    }

    if (method === "terms_acceptance") {
      return parseTermsAcceptanceVerification({
        termsAcceptedAt: v.termsAcceptedAt,
        acceptedAgreementSnapshot: v.acceptedAgreementSnapshot,
      });
    }

    const provider = typeof v.provider === "string" ? v.provider.trim() : "";
    const externalReference =
      typeof v.externalReference === "string" ? v.externalReference.trim() : "";
    const signedAt =
      typeof v.signedAt === "string" ? v.signedAt.trim() : "";
    const snapshot = parseAgreementSnapshot(v.acceptedAgreementSnapshot);

    if (!provider || provider.length > 80) {
      return { ok: false, error: "verification.provider is required" };
    }
    if (!externalReference || externalReference.length > 200) {
      return { ok: false, error: "verification.externalReference is required" };
    }
    const parsedSignedAt = parseIsoTimestamp(signedAt);
    if (!parsedSignedAt) {
      return { ok: false, error: "verification.signedAt is invalid" };
    }
    if (!snapshot) {
      return { ok: false, error: "acceptedAgreementSnapshot is required" };
    }

    return {
      ok: true,
      verification: {
        method: "eid_signature",
        provider,
        externalReference,
        signedAt: parsedSignedAt,
        acceptedAgreementSnapshot: snapshot,
      },
    };
  }

  // Legacy flat fields from older checkout clients
  return parseTermsAcceptanceVerification(body);
}

export function assertVerificationMethodEnabled(
  verification: AgreementVerification
): void {
  if (verification.method !== ACTIVE_AGREEMENT_VERIFICATION_METHOD) {
    throw new Error(
      `Verification method "${verification.method}" is not enabled yet`
    );
  }
}

export async function assertEidSignatureVerified(
  _verification: Extract<AgreementVerification, { method: "eid_signature" }>
): Promise<void> {
  throw new Error("eID signature verification is not configured");
}

export function verificationToBookingFields(verification: AgreementVerification): {
  terms_accepted_at: string;
  accepted_agreement_snapshot: string;
  agreement_verification_method: AgreementVerificationMethod;
  agreement_verification_ref: string | null;
} {
  if (verification.method === "terms_acceptance") {
    return {
      terms_accepted_at: verification.termsAcceptedAt,
      accepted_agreement_snapshot: verification.acceptedAgreementSnapshot,
      agreement_verification_method: "terms_acceptance",
      agreement_verification_ref: null,
    };
  }

  return {
    terms_accepted_at: verification.signedAt,
    accepted_agreement_snapshot: verification.acceptedAgreementSnapshot,
    agreement_verification_method: "eid_signature",
    agreement_verification_ref: `${verification.provider}:${verification.externalReference}`,
  };
}

export type CheckoutBookingRequest = Omit<CreateBookingPayload, "verification"> & {
  verification: AgreementVerification;
};

export function buildCreateBookingPayload(
  input: CheckoutBookingRequest
): CreateBookingPayload {
  return input;
}
