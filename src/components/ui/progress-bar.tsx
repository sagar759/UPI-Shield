import * as React from "react";
import { cn } from "@/lib/ui/class-names";

export type ProgressBarVariant = "low" | "medium" | "high" | "primary" | "neutral";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressBarVariant;
  label?: string;
  showValueText?: boolean;
  valueFormatter?: (value: number, max: number) => string;
}

const variantFillStyles: Record<ProgressBarVariant, string> = {
  low: "bg-[var(--state-success,#137333)]",
  medium: "bg-[var(--state-warning,#9a6700)]",
  high: "bg-[var(--state-error,#c5221f)]",
  primary: "bg-[var(--accent-primary,#1a73e8)]",
  neutral: "bg-[var(--text-secondary,#566074)]",
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "primary",
      label,
      showValueText = true,
      valueFormatter,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(Math.max(0, value), max);
    const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

    const formattedText = valueFormatter
      ? valueFormatter(clampedValue, max)
      : `${percentage}%`;

    return (
      <div ref={ref} className={cn("w-full space-y-1.5", className)} {...props}>
        {(label || showValueText) && (
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary,#566074)]">
            {label && <span>{label}</span>}
            {showValueText && (
              <span className="font-mono tabular-nums ml-auto text-[var(--text-primary,#172033)] font-semibold">
                {formattedText}
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-label={label || "Progress"}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuetext={formattedText}
          className="w-full h-2 rounded-full bg-[var(--bg-subtle,#f1f5f9)] border border-[var(--border-default,#dfe4ec)] overflow-hidden"
        >
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              variantFillStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
