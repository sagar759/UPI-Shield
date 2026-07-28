"use client";

import * as React from "react";
import Link from "next/link";
import {
  QrCode,
  Users,
  Building2,
  ShieldCheck,
  Zap,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { buildAnalyzerUrl, type AnalyzerIntent } from "@/lib/navigation/analyzer-intent";
import { cn } from "@/lib/utils";

export interface PaymentActionItem {
  id: AnalyzerIntent;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  href: string;
  tooltip: string;
}

export const PAYMENT_ACTIONS: PaymentActionItem[] = [
  {
    id: "scan-pay",
    label: "Scan & pay",
    sublabel: "Simulated QR scanner",
    icon: QrCode,
    href: buildAnalyzerUrl({ mode: "scan-pay" }),
    tooltip: "Scan QR code or upload image for simulated scam analysis",
  },
  {
    id: "pay-contact",
    label: "Pay contact",
    sublabel: "Synthetic contact risk",
    icon: Users,
    href: buildAnalyzerUrl({ mode: "pay-contact" }),
    tooltip: "Select a frequent contact to analyze receiver trust score",
  },
  {
    id: "bank-transfer",
    label: "Bank transfer",
    sublabel: "Simulated account check",
    icon: Building2,
    href: buildAnalyzerUrl({ mode: "bank-transfer" }),
    tooltip: "Analyze account number & IFSC against mule graph patterns",
  },
  {
    id: "check-upi-id",
    label: "Check UPI ID",
    sublabel: "VPA risk lookup",
    icon: ShieldCheck,
    href: buildAnalyzerUrl({ mode: "check-upi-id" }),
    tooltip: "Check any UPI handle or VPA against offline synthetic detectors",
  },
];

export type PaymentActionsProps = React.ComponentProps<"section">;

export function PaymentActions({ className, ...props }: PaymentActionsProps) {
  return (
    <section
      aria-labelledby="payment-actions-heading"
      className={cn(
        "p-5 rounded-panel border border-border bg-surface shadow-subtle flex flex-col gap-4",
        className
      )}
      {...props}
    >
      {/* Header & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-control bg-accent-primary/10 text-accent-primary shrink-0">
            <Zap className="size-icon-sm" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="payment-actions-heading"
              className="text-panel-title font-ui-semibold text-fg-primary"
            >
              Quick Payment Actions
            </h2>
            <p className="text-caption text-fg-muted">
              Safe analysis shortcuts into the risk engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-subtle border border-border/80 text-caption text-fg-secondary shrink-0 self-start sm:self-center">
          <ShieldAlert className="size-3.5 text-accent-primary shrink-0" aria-hidden="true" />
          <span>Simulated checks &bull; No money moved</span>
        </div>
      </div>

      {/* Grid of 4 Payment Actions */}
      <div className="grid grid-cols-2 min-[640px]:grid-cols-4 gap-3">
        {PAYMENT_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              title={action.tooltip}
              aria-label={`${action.label}: ${action.sublabel} (simulated analysis)`}
              className="group min-h-[72px] p-3 rounded-control border border-border bg-surface hover:bg-surface-subtle hover:border-accent-primary/40 focus-visible:outline-focus transition-all flex flex-col items-center text-center gap-2 relative"
            >
              <div className="p-2 rounded-pill bg-surface-subtle group-hover:bg-accent-primary/10 text-fg-primary group-hover:text-accent-primary transition-colors shrink-0">
                <Icon className="size-icon-md" aria-hidden="true" />
              </div>
              <div className="flex flex-col items-center gap-0.5 w-full min-w-0">
                <span className="text-body-sm font-ui-semibold text-fg-primary group-hover:text-accent-primary transition-colors truncate w-full">
                  {action.label}
                </span>
                <span className="text-[11px] leading-tight text-fg-muted truncate w-full">
                  {action.sublabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Demo Scenarios Entry Point */}
      <div className="mt-1 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-subtle/50 p-3 rounded-control border border-border/40">
        <div className="flex items-center gap-2 text-left">
          <Sparkles className="size-icon-sm text-accent-primary shrink-0" aria-hidden="true" />
          <div>
            <span className="text-body-sm font-ui-semibold text-fg-primary block">
              Demo Scenarios (Simulated)
            </span>
            <span className="text-caption text-fg-muted block">
              Test pre-built phishing, urgent request, and safe payment flows
            </span>
          </div>
        </div>

        <Link
          href={buildAnalyzerUrl({ mode: "demo-scenarios" })}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-ui-medium rounded-control border border-accent-primary/30 bg-accent-primary/5 hover:bg-accent-primary/10 text-accent-primary transition-colors focus-visible:outline-focus shrink-0"
          aria-label="Explore Demo Scenarios in Risk Analyzer"
        >
          <span>Explore Demo Scenarios</span>
          <Sparkles className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
