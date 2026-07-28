"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, Users, ArrowUpRight } from "lucide-react";
import { DEMO_PRIMARY_PROFILE } from "@/data/demo/profiles";
import { ProtectionSummary } from "./protection-summary";
import { RecentActivityPreview } from "./recent-activity-preview";
import { SafetyTip } from "./safety-tip";
import { cn } from "@/lib/utils";

export type HomeDashboardProps = React.ComponentProps<"div">;

export function HomeDashboard({ className, ...props }: HomeDashboardProps) {
  return (
    <div
      data-slot="home-dashboard"
      className={cn("p-page-gutter max-w-content-max mx-auto w-full", className)}
      {...props}
    >
      {/* Top Profile Context & Page Header */}
      <div className="mb-6 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title font-ui-bold text-fg-primary mb-1">
            UPI Shield Home
          </h1>
          <p className="text-body text-fg-secondary">
            Welcome back,{" "}
            <strong className="font-ui-semibold text-fg-primary">
              {DEMO_PRIMARY_PROFILE.displayName}
            </strong>{" "}
            <span className="text-fg-muted font-mono text-body-sm">
              ({DEMO_PRIMARY_PROFILE.maskedVpa})
            </span>
          </p>
        </div>

        <Link
          href="/analyze"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] min-w-[44px] text-xs font-medium rounded-[6px] border border-border bg-surface text-fg-primary hover:bg-surface-subtle transition-colors focus-visible:outline-focus self-start sm:self-center"
        >
          <span>Open Risk Analyzer</span>
          <ArrowUpRight className="size-icon-xs" aria-hidden="true" />
        </Link>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="flex flex-col min-[900px]:flex-row gap-6 items-start">
        {/* Primary Payment & Activity Column */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
          {/* Reserved Slot: Quick Payment Actions */}
          <section
            aria-labelledby="payment-actions-slot-heading"
            className="p-5 rounded-panel border border-border bg-surface shadow-subtle flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-control bg-surface-subtle text-fg-secondary shrink-0">
                <Zap className="size-icon-sm" aria-hidden="true" />
              </div>
              <h2
                id="payment-actions-slot-heading"
                className="text-panel-title font-ui-semibold text-fg-primary"
              >
                Quick Payment Actions
              </h2>
            </div>
            <div className="p-4 rounded-control border border-dashed border-border bg-surface-subtle/50 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-body-sm font-ui-medium text-fg-secondary">
                Payment Actions Slot (Spec 15)
              </span>
              <span className="text-caption text-fg-muted">
                Scan & pay, Pay contact, Bank transfer, and Check UPI ID shortcuts will mount here.
              </span>
            </div>
          </section>

          {/* Reserved Slot: People & Contacts */}
          <section
            aria-labelledby="people-slot-heading"
            className="p-5 rounded-panel border border-border bg-surface shadow-subtle flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-control bg-surface-subtle text-fg-secondary shrink-0">
                <Users className="size-icon-sm" aria-hidden="true" />
              </div>
              <h2
                id="people-slot-heading"
                className="text-panel-title font-ui-semibold text-fg-primary"
              >
                People & Recent Contacts
              </h2>
            </div>
            <div className="p-4 rounded-control border border-dashed border-border bg-surface-subtle/50 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-body-sm font-ui-medium text-fg-secondary">
                People Shortcuts Slot (Spec 15)
              </span>
              <span className="text-caption text-fg-muted">
                Frequent contacts and quick transaction triggers will mount here.
              </span>
            </div>
          </section>

          {/* Recent Activity Section */}
          <RecentActivityPreview />
        </div>

        {/* Desktop 340px Protection Rail Column (Stacks on mobile) */}
        <aside className="w-full min-[900px]:w-[340px] shrink-0 flex flex-col gap-6">
          <ProtectionSummary />
          <SafetyTip />
        </aside>
      </div>
    </div>
  );
}
