"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VettedUserError {
  userMessage: string;
  isUserFacing: boolean;
}

export class UserFacingError extends Error implements VettedUserError {
  userMessage: string;
  isUserFacing: boolean;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "UserFacingError";
    this.userMessage = userMessage || message;
    this.isUserFacing = true;
  }
}

export interface ErrorStateProps extends React.ComponentProps<"div"> {
  title?: string;
  message?: string;
  error?: Error | VettedUserError | string | null;
  onRetry?: () => void;
  onReset?: () => void;
  retryLabel?: string;
  resetLabel?: string;
}

const DEFAULT_SAFE_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again or refresh the page.";

/**
 * Sanitizes error objects to ensure stack traces, detector internals, or unmasked user content are never rendered.
 */
function getSafeErrorMessage(
  error?: Error | VettedUserError | string | null,
  fallbackMessage?: string
): string {
  if (fallbackMessage) {
    return fallbackMessage;
  }

  if (typeof error === "object" && error !== null) {
    if ("isUserFacing" in error && error.isUserFacing === true) {
      if ("userMessage" in error && typeof error.userMessage === "string" && error.userMessage.trim()) {
        return error.userMessage.trim();
      }
      if ("message" in error && typeof error.message === "string" && error.message.trim()) {
        return error.message.trim();
      }
    }
  }

  return DEFAULT_SAFE_ERROR_MESSAGE;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  onReset,
  retryLabel = "Try again",
  resetLabel = "Reset and reload",
  className,
  ...props
}: ErrorStateProps) {
  const safeMessage = getSafeErrorMessage(error, message);

  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center rounded-panel border border-state-error/30 bg-state-error-bg text-fg-primary shadow-subtle min-h-[200px] max-w-lg mx-auto w-full",
        className
      )}
      {...props}
    >
      <div className="mb-4 inline-flex items-center justify-center rounded-full bg-error/10 p-3 text-state-error">
        <AlertTriangle className="size-icon-lg" aria-hidden="true" />
      </div>

      <h2 className="text-panel-title font-ui-bold text-fg-primary mb-1">
        {title}
      </h2>

      <p className="text-body-sm text-fg-secondary max-w-sm mb-6">
        {safeMessage}
      </p>

      {onRetry || onReset ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-control items-center justify-center gap-2 rounded-control bg-action px-5 text-body-sm font-ui-semibold text-surface transition-colors duration-fast ease-standard hover:bg-action-hover focus-visible:outline-focus min-h-[44px] w-full sm:w-auto"
            >
              <RefreshCw className="size-icon-sm" aria-hidden="true" />
              {retryLabel}
            </button>
          ) : null}

          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-control items-center justify-center rounded-control border border-border bg-surface px-5 text-body-sm font-ui-medium text-fg-primary transition-colors duration-fast ease-standard hover:bg-surface-subtle focus-visible:outline-focus min-h-[44px] w-full sm:w-auto"
            >
              {resetLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
