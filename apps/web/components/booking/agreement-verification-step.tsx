"use client";

import { useState } from "react";
import type { AgreementVerification } from "@booking-system/types";
import { ACTIVE_AGREEMENT_VERIFICATION_METHOD } from "@/lib/booking-config";

function AvtalModal({
  productName,
  agreementText,
  open,
  onClose,
}: {
  productName: string;
  agreementText: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-text/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avtal-modal-title"
    >
      <div
        className="theme-card flex max-h-[90vh] w-full max-w-lg flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-brand-border px-6 py-4">
          <h2
            id="avtal-modal-title"
            className="text-lg font-semibold text-brand-text"
          >
            Hyresvillkor – {productName}
          </h2>
          <p className="mt-1 text-sm text-brand-text-muted">
            Läs igenom villkoren nedan innan du godkänner.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-b border-brand-border px-6 py-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-brand-text-muted">
            {agreementText}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4">
          <button type="button" onClick={onClose} className="theme-btn-secondary w-full">
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsAcceptanceStep({
  productName,
  agreementText,
  verified,
  onVerified,
  onClear,
}: {
  productName: string;
  agreementText: string;
  verified: Extract<AgreementVerification, { method: "terms_acceptance" }> | null;
  onVerified: (
    verification: Extract<AgreementVerification, { method: "terms_acceptance" }>
  ) => void;
  onClear: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [checked, setChecked] = useState(verified !== null);

  const handleCheck = (next: boolean) => {
    setChecked(next);
    if (next && agreementText.length >= 50) {
      onVerified({
        method: "terms_acceptance",
        termsAcceptedAt: new Date().toISOString(),
        acceptedAgreementSnapshot: agreementText,
      });
      return;
    }
    onClear();
  };

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!agreementText}
          className="theme-btn-secondary w-full border-dashed py-4"
        >
          Läs hyresvillkoren
        </button>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-border bg-brand-surface-muted px-4 py-3">
          <input
            type="checkbox"
            checked={checked}
            disabled={!agreementText}
            onChange={(e) => handleCheck(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-brand-text-muted">
            Jag har läst och godkänner hyresvillkoren
          </span>
        </label>

        {verified ? (
          <p className="text-sm font-medium text-brand-success">
            Godkänt{" "}
            {new Date(verified.termsAcceptedAt).toLocaleString("sv-SE", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        ) : (
          <p className="text-sm font-medium text-brand-error">
            Du måste läsa och godkänna hyresvillkoren innan betalning.
          </p>
        )}
      </div>

      <AvtalModal
        productName={productName}
        agreementText={agreementText}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

function EidSignaturePlaceholder() {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface-muted px-4 py-6 text-center">
      <p className="text-sm font-medium text-brand-text">
        BankID-signering aktiveras här
      </p>
      <p className="mt-2 text-sm text-brand-text-muted">
        Metoden är förberedd i systemet men inte aktiverad ännu. Kontakta oss om
        du behöver hjälp med bokningen.
      </p>
    </div>
  );
}

export function AgreementVerificationStep({
  productName,
  agreementText,
  verified,
  onVerified,
  onClear,
}: {
  productName: string;
  agreementText: string;
  verified: AgreementVerification | null;
  onVerified: (verification: AgreementVerification) => void;
  onClear: () => void;
}) {
  if (ACTIVE_AGREEMENT_VERIFICATION_METHOD === "eid_signature") {
    return <EidSignaturePlaceholder />;
  }

  return (
    <TermsAcceptanceStep
      productName={productName}
      agreementText={agreementText}
      verified={
        verified?.method === "terms_acceptance" ? verified : null
      }
      onVerified={onVerified}
      onClear={onClear}
    />
  );
}
