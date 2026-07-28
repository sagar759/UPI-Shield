"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error securely to console / error service without exposing stack traces to end-user UI
    console.error("Unhandled root error:", error);
  }, [error]);

  return (
    <div className="p-page-gutter max-w-content-max mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <ErrorState
        title="Something went wrong"
        error={error}
        onRetry={reset}
        onReset={() => window.location.reload()}
        retryLabel="Try again"
        resetLabel="Reload page"
      />
    </div>
  );
}
