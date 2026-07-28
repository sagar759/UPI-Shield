import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { LiveRegion } from "@/components/ui/live-region";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { DegradedNotice } from "@/components/ui/degraded-notice";
import type { AnalyzerMode } from "@/lib/navigation/analyze-search-state";
import { ShieldCheck, ArrowRightLeft, MessageSquare, UserCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export type ResultState = "idle" | "loading" | "error" | "degraded" | "completed";

export interface AnalyzerResultRegionProps {
  mode: AnalyzerMode;
  state?: ResultState;
  errorMessage?: string;
  degradedNotice?: string;
  scoreResult?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

const MODE_DETAILS: Record<
  AnalyzerMode,
  {
    title: string;
    description: string;
    signals: string[];
    icon: React.ReactNode;
  }
> = {
  transaction: {
    title: "Pre-Payment Risk Assessment",
    description:
      "Evaluates standard payment patterns, unusual transaction amounts, payment velocity, known recipient baseline, and device context.",
    signals: [
      "Amount ratio against personal transaction history",
      "Transaction velocity in 5, 30, and 60-minute windows",
      "Known recipient baseline vs. new receiver VPA",
      "Payment channel context & collect/QR request flags",
    ],
    icon: <ArrowRightLeft className="w-5 h-5 text-[var(--accent-primary,#1a73e8)]" aria-hidden="true" />,
  },
  message: {
    title: "Scam Language Analysis",
    description:
      "Scans SMS, message pastes, or call transcripts for high-risk urgency tactics, fake authority claims, and credential harvesting patterns.",
    signals: [
      "Urgency, threat, or high-pressure language",
      "Fake bank, police, or government authority claims",
      "Payment link, QR code, or PIN/OTP requests",
      "Multilingual IndicBERT/Hinglish scam patterns",
    ],
    icon: <MessageSquare className="w-5 h-5 text-[var(--accent-primary,#1a73e8)]" aria-hidden="true" />,
  },
  receiver: {
    title: "Mule Account Flow Assessment",
    description:
      "Checks receiver account flow aggregates provided by participating financial nodes for rapid pass-through behavior and suspicious transfer bursts.",
    signals: [
      "Fan-in vs. fan-out transaction ratios",
      "Rapid pass-through volume & holding time",
      "Abnormal burst transfers in recent window",
      "Known mule-cluster graph associations",
    ],
    icon: <UserCheck className="w-5 h-5 text-[var(--accent-primary,#1a73e8)]" aria-hidden="true" />,
  },
};

export function AnalyzerResultRegion({
  mode,
  state = "idle",
  errorMessage,
  degradedNotice = "Detector running in offline fallback mode with local baseline rules.",
  scoreResult,
  onRetry,
  className,
}: AnalyzerResultRegionProps) {
  const details = MODE_DETAILS[mode];

  const liveAnnouncement = React.useMemo(() => {
    switch (state) {
      case "loading":
        return `Analyzing ${mode} risk...`;
      case "error":
        return `Analysis failed: ${errorMessage || "An error occurred."}`;
      case "degraded":
        return `Analysis completed with degraded signal. ${degradedNotice}`;
      case "completed":
        return `Analysis completed for ${mode} mode.`;
      case "idle":
      default:
        return `${details.title} ready for evaluation.`;
    }
  }, [state, mode, errorMessage, degradedNotice, details.title]);

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <LiveRegion message={liveAnnouncement} />

      <Panel
        as="section"
        variant="default"
        aria-labelledby="result-region-heading"
        className="w-full flex-1 min-h-[420px] flex flex-col justify-between"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-default,#dfe4ec)]">
            <div className="flex items-center gap-2">
              {details.icon}
              <h2
                id="result-region-heading"
                className="text-base font-semibold text-[var(--text-primary,#172033)]"
              >
                Result & Guidance
              </h2>
            </div>
            {state === "idle" && (
              <StatusBadge variant="neutral">Unscored</StatusBadge>
            )}
            {state === "loading" && (
              <StatusBadge variant="neutral">Analyzing</StatusBadge>
            )}
            {state === "degraded" && (
              <StatusBadge variant="warning">Degraded</StatusBadge>
            )}
            {state === "error" && (
              <StatusBadge variant="danger">Error</StatusBadge>
            )}
            {state === "completed" && (
              <StatusBadge variant="success">Scored</StatusBadge>
            )}
          </div>

          {state === "loading" && (
            <div className="py-8">
              <LoadingState
                message={`Evaluating ${details.title.toLowerCase()}...`}
                showSkeleton
                skeletonCount={3}
                skeletonHeight={36}
              />
            </div>
          )}

          {state === "error" && (
            <div className="py-4">
              <ErrorState
                title="Risk Analysis Error"
                message={errorMessage || "Unable to complete risk calculation at this time."}
                onRetry={onRetry}
              />
            </div>
          )}

          {state === "degraded" && (
            <div className="space-y-4">
              <DegradedNotice
                description={degradedNotice}
              />
              {scoreResult}
            </div>
          )}

          {state === "completed" && scoreResult && (
            <div className="py-2">{scoreResult}</div>
          )}

          {(state === "idle" || (state === "completed" && !scoreResult)) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary,#172033)] mb-1">
                  {details.title}
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary,#566074)] leading-relaxed">
                  {details.description}
                </p>
              </div>

              <div className="bg-[var(--bg-subtle,#f1f5f9)] p-3.5 rounded-[6px] border border-[var(--border-default,#dfe4ec)]">
                <h4 className="text-xs font-semibold text-[var(--text-primary,#172033)] mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent-primary,#1a73e8)]" aria-hidden="true" />
                  Checked Information Signals
                </h4>
                <ul className="space-y-2 text-xs text-[var(--text-secondary,#566074)]">
                  {details.signals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-success,#137333)] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-[var(--border-default,#dfe4ec)] text-xs text-[var(--text-muted,#687181)] flex items-center justify-between">
          <span>Prototype Risk Engine v1</span>
          <span>Local execution</span>
        </div>
      </Panel>
    </div>
  );
}
