import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decision History",
};

export default function ActivityPage() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto">
      <h1 className="text-page-title font-ui-bold text-fg-primary mb-4">
        Decision History
      </h1>
      <p className="text-body text-fg-secondary">
        Review prior UPI pre-payment fraud risk assessments and generated complaint drafts.
      </p>
    </div>
  );
}
