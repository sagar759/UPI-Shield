"use client";

import * as React from "react";
import { Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const SAFETY_TIPS = [
  {
    id: "tip-pin",
    title: "UPI PIN Security",
    content: "Your 6-digit UPI PIN is ONLY required to send money or check your balance. You NEVER need to enter a PIN to receive money.",
  },
  {
    id: "tip-qr",
    title: "QR Code Refunds",
    content: "Scanning a QR code always debits money from your account. Genuine merchants or support desks never ask you to scan a QR code to receive a refund.",
  },
  {
    id: "tip-arrest",
    title: "Digital Arrest Fraud",
    content: "Legitimate police, CBI, or government authorities never place citizen accounts under 'digital arrest' or demand urgent transfers via video call.",
  },
  {
    id: "tip-return",
    title: "Guaranteed High Returns",
    content: "Be cautious of investment schemes promising 200%-500% returns in 24 hours. High-yield telegram groups often use fake payout screenshots.",
  },
  {
    id: "tip-remote",
    title: "Remote Access Apps",
    content: "Never install remote desktop apps (e.g. AnyDesk, TeamViewer) at the request of an unknown caller claiming to be bank customer care.",
  },
] as const;

export interface SafetyTipProps extends React.ComponentProps<"div"> {
  initialIndex?: number;
}

export function SafetyTip({ initialIndex, className, ...props }: SafetyTipProps) {
  const defaultIndex = React.useMemo(() => {
    const len = SAFETY_TIPS.length;
    if (typeof initialIndex === "number" && Number.isFinite(initialIndex)) {
      const intVal = Math.floor(initialIndex);
      return ((intVal % len) + len) % len;
    }
    return 0;
  }, [initialIndex]);

  const [currentIndex, setCurrentIndex] = React.useState<number>(defaultIndex);

  const currentTip = SAFETY_TIPS[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SAFETY_TIPS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SAFETY_TIPS.length) % SAFETY_TIPS.length);
  };

  return (
    <section
      data-slot="safety-tip"
      aria-labelledby="safety-tip-heading"
      className={cn(
        "flex flex-col gap-3 p-5 rounded-panel border border-border bg-surface shadow-subtle",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-control bg-state-warning-bg text-state-warning shrink-0">
            <Lightbulb className="size-icon-sm" aria-hidden="true" />
          </div>
          <h2
            id="safety-tip-heading"
            className="text-body font-ui-semibold text-fg-primary leading-tight"
          >
            Safety Reminder
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous safety tip"
            title="Previous safety tip"
            className="inline-flex size-7 items-center justify-center rounded-control text-fg-muted hover:bg-surface-subtle hover:text-fg-primary focus-visible:outline-focus min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="text-caption font-mono text-fg-muted px-1" aria-label={`Tip ${currentIndex + 1} of ${SAFETY_TIPS.length}`}>
            {currentIndex + 1}/{SAFETY_TIPS.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next safety tip"
            title="Next safety tip"
            className="inline-flex size-7 items-center justify-center rounded-control text-fg-muted hover:bg-surface-subtle hover:text-fg-primary focus-visible:outline-focus min-h-[44px] min-w-[44px]"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-body-sm font-ui-medium text-fg-primary">
          {currentTip.title}
        </h3>
        <p className="text-body-sm text-fg-secondary leading-relaxed">
          {currentTip.content}
        </p>
      </div>
    </section>
  );
}
