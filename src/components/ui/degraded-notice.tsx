"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DegradedNoticeProps extends React.ComponentProps<"div"> {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function DegradedNotice({
  title = "System Degraded",
  description,
  icon = <AlertTriangle className="size-icon-md text-state-warning shrink-0" aria-hidden="true" />,
  action,
  onDismiss,
  dismissLabel = "Dismiss notice",
  className,
  ...props
}: DegradedNoticeProps) {
  return (
    <div
      data-slot="degraded-notice"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-panel border border-state-warning/30 bg-state-warning-bg text-fg-primary w-full",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon}
        <div className="flex flex-col gap-0.5">
          {title ? (
            <p className="text-body-sm font-ui-semibold text-fg-primary">
              {title}
            </p>
          ) : null}
          <p className="text-body-sm text-fg-secondary">
            {description}
          </p>
        </div>
      </div>

      {action || onDismiss ? (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {action}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex size-control-compact items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard hover:bg-surface/50 hover:text-fg-primary focus-visible:outline-focus min-h-[44px] min-w-[44px]"
              aria-label={dismissLabel}
              title={dismissLabel}
            >
              <X className="size-icon-sm" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
