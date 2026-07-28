"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, History, ShieldAlert } from "lucide-react";
import { DecisionAuditRecord } from "@/types/risk";
import { getDecisionRepository, StorageHealth } from "@/lib/storage";
import { formatRupeeFull } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date-time";
import { maskVPA, maskAccountID } from "@/lib/privacy/mask";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DegradedNotice } from "@/components/ui/degraded-notice";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";

export interface RecentActivityPreviewProps extends React.ComponentProps<"section"> {
  initialRecords?: DecisionAuditRecord[];
  initialHealth?: StorageHealth;
  limit?: number;
}

export function RecentActivityPreview({
  initialRecords,
  initialHealth,
  limit = 4,
  className,
  ...props
}: RecentActivityPreviewProps) {
  const [records, setRecords] = React.useState<DecisionAuditRecord[] | null>(initialRecords ?? null);
  const [health, setHealth] = React.useState<StorageHealth | null>(initialHealth ?? null);
  const [loading, setLoading] = React.useState<boolean>(!initialRecords || !initialHealth);

  React.useEffect(() => {
    let isMounted = true;
    const repository = getDecisionRepository();

    async function loadData() {
      try {
        const healthRes = await repository.getHealth();
        let recordsRes = initialRecords ?? null;
        if (!initialRecords) {
          recordsRes = await repository.listDecisions();
        }
        if (isMounted) {
          setHealth(initialHealth || healthRes);
          setRecords(recordsRes);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealth(
            initialHealth || {
              status: "degraded_unavailable",
              message: "Failed to access local storage repository",
            }
          );
          if (!initialRecords) {
            setRecords([]);
          }
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialRecords, initialHealth]);

  // Filter & sort decisions (newest first)
  const sortedRecords = React.useMemo(() => {
    if (!records) return [];
    return [...records].sort(
      (a, b) => new Date(b.decision.timestamp).getTime() - new Date(a.decision.timestamp).getTime()
    ).slice(0, limit);
  }, [records, limit]);

  const isDegraded = Boolean(health && health.status !== "ok");

  return (
    <section
      data-slot="recent-activity-preview"
      aria-labelledby="recent-activity-heading"
      className={cn(
        "flex flex-col gap-4 p-5 rounded-panel border border-border bg-surface shadow-subtle",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-control bg-surface-subtle text-fg-secondary shrink-0">
            <History className="size-icon-md" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="recent-activity-heading"
              className="text-panel-title font-ui-semibold text-fg-primary leading-tight"
            >
              Recent Activity
            </h2>
            <p className="text-body-sm text-fg-secondary">
              Latest risk decisions and audits
            </p>
          </div>
        </div>

        {records && records.length > 0 ? (
          <Link
            href="/activity"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary,#1565c0)] hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="size-icon-xs" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {/* Storage Degraded State */}
      {isDegraded ? (
        <DegradedNotice
          title="Storage Notice"
          description={
            health?.message || "Local audit storage is operating in degraded mode."
          }
          className="my-1"
        />
      ) : null}

      {/* Loading State */}
      {loading ? (
        <LoadingState message="Loading recent activity..." showSkeleton skeletonCount={3} skeletonHeight={56} />
      ) : null}

      {/* Empty State */}
      {!loading && sortedRecords.length === 0 ? (
        <EmptyState
          title="No recent decisions recorded"
          description="Analyze a payment scenario or text message to view risk evaluations and audit entries here."
          icon={<ShieldAlert className="size-icon-lg text-fg-muted" aria-hidden="true" />}
          action={
            <Link
              href="/analyze"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-control bg-[var(--accent-primary,#1565c0)] text-white hover:bg-[var(--accent-primary-hover,#1255a8)] transition-colors min-h-[44px] min-w-[44px]"
            >
              Analyze a Payment
            </Link>
          }
        />
      ) : null}

      {/* Populated / Seeded State */}
      {!loading && sortedRecords.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedRecords.map((record) => {
            const summary = record.summary;
            const receiverId = summary?.receiverId;
            const payeeName = summary?.payeeName;
            const receiverDisplay = payeeName
              ? payeeName
              : receiverId
              ? receiverId.includes("@")
                ? maskVPA(receiverId)
                : maskAccountID(receiverId)
              : maskAccountID(record.decision.decisionId);

            const amount = typeof summary?.amount === "number" ? summary.amount : 0;
            const formattedAmount = formatRupeeFull(amount);
            const formattedTime = formatDateTime(record.decision.timestamp, {
              dateStyle: "medium",
              timeStyle: "short",
            });

            // Map risk band to status badge variant
            const badgeVariant =
              record.decision.riskBand === "high"
                ? "high"
                : record.decision.riskBand === "medium"
                ? "medium"
                : "low";

            return (
              <Link
                key={record.decision.decisionId}
                href={`/activity/${record.decision.decisionId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-control border border-border/80 bg-surface-subtle/30 hover:bg-surface-subtle/80 transition-colors duration-fast group focus-visible:outline-focus"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body-sm font-ui-semibold text-fg-primary">
                      {receiverDisplay}
                    </span>
                    <StatusBadge variant={badgeVariant} className="text-[11px] px-2 py-0.5" />
                  </div>
                  <span className="text-caption text-fg-muted">
                    {formattedTime}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-body-sm font-ui-bold text-fg-primary font-mono">
                    {formattedAmount}
                  </span>
                  <span className="text-[var(--accent-primary,#1565c0)] group-hover:translate-x-0.5 transition-transform duration-fast inline-flex items-center text-body-sm font-ui-medium">
                    Details
                    <ArrowRight className="size-icon-xs ml-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
