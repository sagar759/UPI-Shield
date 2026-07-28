"use client";

import * as React from "react";
import { ShieldCheck, Activity, MessageSquareText, Share2, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export type ProtectionSummaryProps = React.ComponentProps<"div">;

export function ProtectionSummary({ className, ...props }: ProtectionSummaryProps) {
  const detectors = [
    {
      id: "transaction",
      name: "Transaction Behavior",
      description: "Amount ratios, velocity & unusual hour patterns",
      icon: <Activity className="size-icon-sm text-accent shrink-0" aria-hidden="true" />,
      status: "available" as const,
      label: "Active",
    },
    {
      id: "message",
      name: "Scam Message Text",
      description: "Urgency, threats & credential harvesting text",
      icon: <MessageSquareText className="size-icon-sm text-accent shrink-0" aria-hidden="true" />,
      status: "available" as const,
      label: "Active",
    },
    {
      id: "receiver",
      name: "Receiver Graph",
      description: "Mule account detection & rapid pass-through burst",
      icon: <Share2 className="size-icon-sm text-accent shrink-0" aria-hidden="true" />,
      status: "available" as const,
      label: "Active",
    },
  ];

  return (
    <section
      data-slot="protection-summary"
      aria-labelledby="protection-summary-heading"
      className={cn(
        "flex flex-col gap-4 p-5 rounded-panel border border-border bg-surface shadow-subtle",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="p-2 rounded-control bg-state-success-bg text-state-success shrink-0">
          <ShieldCheck className="size-icon-md" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="protection-summary-heading"
            className="text-panel-title font-ui-semibold text-fg-primary leading-tight"
          >
            Protection Status
          </h2>
          <p className="text-body-sm text-fg-secondary">
            3 Signal Detectors Active
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {detectors.map((d) => (
          <div
            key={d.id}
            className="flex items-start justify-between gap-3 p-3 rounded-control border border-border/60 bg-surface-subtle/50"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5">{d.icon}</div>
              <div className="flex flex-col">
                <span className="text-body-sm font-ui-medium text-fg-primary leading-snug">
                  {d.name}
                </span>
                <span className="text-caption text-fg-muted leading-tight">
                  {d.description}
                </span>
              </div>
            </div>
            <StatusBadge variant="low" label={d.label} className="shrink-0 text-[11px] px-2 py-0.5" />
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-control border border-border/80 bg-surface-subtle text-fg-secondary text-caption leading-normal mt-1">
        <Info className="size-icon-sm text-fg-muted shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="font-ui-semibold text-fg-primary">Prototype Explanation:</strong> Evaluated strictly via synthetic fixtures and local rules. No live bank connection or account access.
        </p>
      </div>
    </section>
  );
}
