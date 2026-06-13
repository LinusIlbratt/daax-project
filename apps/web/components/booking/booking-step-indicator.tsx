"use client";

import type { BookingStep } from "@/lib/booking-config";
import { BOOKING_STEP_LABELS, BOOKING_STEPS } from "@/lib/booking-config";

export function BookingStepIndicator({
  currentStep,
}: {
  currentStep: BookingStep;
}) {
  const currentIndex = BOOKING_STEPS.indexOf(currentStep);

  return (
    <ol
      className="grid grid-cols-4 gap-1 rounded-xl border border-brand-border/80 bg-brand-surface p-2 sm:flex sm:gap-0 sm:p-0 sm:shadow-none sm:border-0 sm:bg-transparent"
      aria-label="Bokningssteg"
    >
      {BOOKING_STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = step === currentStep;
        return (
          <li
            key={step}
            className={`flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center sm:flex-1 sm:flex-row sm:justify-center sm:gap-2 sm:px-2 sm:py-0 ${
              active ? "bg-brand-surface-muted sm:bg-transparent" : ""
            }`}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? "bg-brand-primary text-brand-primary-fg"
                  : done
                    ? "border border-brand-border bg-brand-surface text-brand-text"
                    : "border border-brand-border/80 bg-brand-surface text-brand-text-subtle"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span
              className={`text-[10px] leading-tight sm:text-xs ${
                active
                  ? "font-semibold text-brand-text"
                  : done
                    ? "text-brand-text-muted"
                    : "text-brand-text-subtle"
              }`}
            >
              {BOOKING_STEP_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
