"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DEMO_PRIMARY_PROFILE } from "@/data/demo/profiles";
import { ProtectionSummary } from "./protection-summary";
import { RecentActivityPreview } from "./recent-activity-preview";
import { SafetyTip } from "./safety-tip";
import { PaymentActions } from "./payment-actions";
import { PeopleRow } from "./people-row";
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
          {/* Quick Payment Actions */}
          <PaymentActions />

          {/* People & Recent Contacts */}
          <PeopleRow />

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
