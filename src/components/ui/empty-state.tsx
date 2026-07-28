"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.ComponentProps<"div"> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = <Inbox className="size-icon-lg text-fg-muted" aria-hidden="true" />,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-panel border border-border bg-surface shadow-subtle min-h-[220px] max-w-lg mx-auto w-full",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-surface-subtle p-3 text-fg-muted">
          {icon}
        </div>
      ) : null}

      <h3 className="text-panel-title font-ui-semibold text-fg-primary mb-1">
        {title}
      </h3>

      {description ? (
        <p className="text-body-sm text-fg-secondary max-w-sm mb-6">
          {description}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
