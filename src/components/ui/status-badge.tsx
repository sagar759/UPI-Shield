import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export type StatusBadgeVariant =
  | "low"
  | "medium"
  | "high"
  | "unavailable"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  label?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantConfig: Record<
  StatusBadgeVariant,
  { style: string; defaultIcon: React.ReactNode; defaultLabel: string }
> = {
  low: {
    style:
      "bg-[var(--state-success-bg,#e6f4ea)] text-[var(--state-success,#137333)] border-[var(--state-success,#137333)]/20",
    defaultIcon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Low Risk",
  },
  success: {
    style:
      "bg-[var(--state-success-bg,#e6f4ea)] text-[var(--state-success,#137333)] border-[var(--state-success,#137333)]/20",
    defaultIcon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Success",
  },
  medium: {
    style:
      "bg-[var(--state-warning-bg,#fef7e0)] text-[var(--state-warning,#9a6700)] border-[var(--state-warning,#9a6700)]/20",
    defaultIcon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Medium Risk",
  },
  warning: {
    style:
      "bg-[var(--state-warning-bg,#fef7e0)] text-[var(--state-warning,#9a6700)] border-[var(--state-warning,#9a6700)]/20",
    defaultIcon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Warning",
  },
  high: {
    style:
      "bg-[var(--state-error-bg,#fce8e6)] text-[var(--state-error,#c5221f)] border-[var(--state-error,#c5221f)]/20",
    defaultIcon: <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "High Risk",
  },
  danger: {
    style:
      "bg-[var(--state-error-bg,#fce8e6)] text-[var(--state-error,#c5221f)] border-[var(--state-error,#c5221f)]/20",
    defaultIcon: <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Danger",
  },
  unavailable: {
    style:
      "bg-[var(--bg-subtle,#f1f5f9)] text-[var(--text-muted,#687181)] border-[var(--border-default,#dfe4ec)]",
    defaultIcon: <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Not Provided",
  },
  neutral: {
    style:
      "bg-[var(--bg-subtle,#f1f5f9)] text-[var(--text-secondary,#566074)] border-[var(--border-default,#dfe4ec)]",
    defaultIcon: <Info className="h-3.5 w-3.5" aria-hidden="true" />,
    defaultLabel: "Info",
  },
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      className,
      variant = "neutral",
      label,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantConfig[variant] || variantConfig.neutral;
    const displayText = children || label || config.defaultLabel;
    const displayIcon = icon !== undefined ? icon : config.defaultIcon;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shrink-0 leading-none select-none",
          config.style,
          className
        )}
        {...props}
      >
        {displayIcon && (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {displayIcon}
          </span>
        )}
        <span>{displayText}</span>
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
