import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Resources",
};

export default function HelpPage() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto">
      <h1 className="text-page-title font-ui-bold text-fg-primary mb-4">
        Help & Resources
      </h1>
      <p className="text-body text-fg-secondary">
        Official guides, reporting checklists, and references for cyber-crime reporting.
      </p>
    </div>
  );
}
