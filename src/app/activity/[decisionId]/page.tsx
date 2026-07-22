import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decision Detail",
};

interface DecisionDetailPageProps {
  params: Promise<{
    decisionId: string;
  }>;
}

export default async function DecisionDetailPage({
  params,
}: DecisionDetailPageProps) {
  const { decisionId } = await params;

  return (
    <div className="p-page-gutter max-w-content-max mx-auto">
      <h1 className="text-page-title font-ui-bold text-fg-primary mb-4">
        Decision Detail
      </h1>
      <p className="text-body text-fg-secondary">
        Details for risk decision ID: <span className="font-technical text-action">{decisionId}</span>
      </p>
    </div>
  );
}
