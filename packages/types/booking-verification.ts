/** How the customer verified agreement before payment. */
export const AGREEMENT_VERIFICATION_METHODS = [
  "terms_acceptance",
  "eid_signature",
] as const;

export type AgreementVerificationMethod =
  (typeof AGREEMENT_VERIFICATION_METHODS)[number];

/** Checkbox acceptance (Phase 1 / fallback). */
export type TermsAcceptanceVerification = {
  method: "terms_acceptance";
  termsAcceptedAt: string;
  acceptedAgreementSnapshot: string;
};

/** BankID / Scrive / other eID provider (future). */
export type EidSignatureVerification = {
  method: "eid_signature";
  provider: string;
  externalReference: string;
  signedAt: string;
  acceptedAgreementSnapshot: string;
};

export type AgreementVerification =
  | TermsAcceptanceVerification
  | EidSignatureVerification;

export type BookingAgreementVerificationFields = {
  agreement_verification_method: AgreementVerificationMethod;
  agreement_verification_ref: string | null;
};
