import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Analyzer",
};

export default function AnalyzePage() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto">
      <h1 className="text-page-title font-ui-bold text-fg-primary mb-4">
        Risk Analyzer
      </h1>
      <p className="text-body text-fg-secondary">
        Analyze transaction risk, mule receiver accounts, and scam message language.
      </p>
    </div>
  );
}
