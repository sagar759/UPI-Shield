import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzerWorkspace } from "@/components/analyze/analyzer-workspace";
import { LoadingState } from "@/components/ui/loading-state";

export const metadata: Metadata = {
  title: "Risk Analyzer | UPI Shield",
  description: "Analyze transaction risk, mule receiver accounts, and scam message language.",
};

export default function AnalyzePage() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto space-y-6">
      <div>
        <h1 className="text-page-title font-ui-bold text-fg-primary mb-1">
          Risk Analyzer
        </h1>
        <p className="text-body text-fg-secondary">
          Evaluate payment transactions, scam message transcripts, and receiver mule accounts before sending money.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-12 flex justify-center">
            <LoadingState message="Loading analyzer workspace..." />
          </div>
        }
      >
        <AnalyzerWorkspace />
      </Suspense>
    </div>
  );
}
