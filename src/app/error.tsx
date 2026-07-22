"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console or error service
    console.error("Unhandled root error:", error);
  }, [error]);

  return (
    <div className="p-page-gutter max-w-content-max mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="rounded-full bg-error-surface p-3 mb-4">
        <svg
          className="size-icon-lg text-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-page-title font-ui-bold text-fg-primary mb-2">
        Something went wrong
      </h1>
      
      <p className="text-body text-fg-secondary mb-6 max-w-md">
        An unexpected error occurred. Please try again or refresh the page if the issue persists.
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-control items-center justify-center rounded-control bg-action px-6 text-body-sm font-ui-semibold text-surface transition-colors duration-fast ease-standard hover:bg-action-hover focus-visible:outline-focus"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-control items-center justify-center rounded-control border border-border bg-surface px-6 text-body-sm font-ui-semibold text-fg-primary transition-colors duration-fast ease-standard hover:bg-surface-subtle focus-visible:outline-focus"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
