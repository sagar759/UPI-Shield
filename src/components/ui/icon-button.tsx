import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export type IconButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label required for screen readers and tooltips */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  icon: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary,#1a73e8)] text-white hover:bg-[var(--accent-primary-hover,#155fc0)] active:bg-[#124ea3] border border-transparent shadow-xs",
  secondary:
    "bg-[var(--bg-surface,#ffffff)] text-[var(--text-primary,#172033)] border border-[var(--border-default,#dfe4ec)] hover:bg-[var(--bg-subtle,#f1f5f9)] hover:border-[var(--border-strong,#c8cfda)] active:bg-[#e2e8f0]",
  quiet:
    "bg-transparent text-[var(--text-primary,#172033)] hover:bg-[var(--bg-subtle,#f1f5f9)] active:bg-[#e2e8f0] border border-transparent",
  danger:
    "bg-[var(--state-error,#c5221f)] text-white hover:bg-[#a81c19] active:bg-[#8b1715] border border-transparent shadow-xs",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "h-11 w-11 text-sm min-h-[44px] min-w-[44px]", // minimum 44x44px target
  md: "h-11 w-11 text-base min-h-[44px] min-w-[44px]",
  lg: "h-12 w-12 text-lg min-h-[48px] min-w-[48px]",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      label,
      title,
      variant = "quiet",
      size = "md",
      isLoading = false,
      disabled = false,
      icon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isControlDisabled = disabled || isLoading;
    const tooltipTitle = title || label;

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={tooltipTitle}
        disabled={isControlDisabled}
        aria-busy={isLoading ? true : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:ring-offset-1 select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2
            className="h-5 w-5 animate-spin shrink-0"
            aria-hidden="true"
          />
        ) : (
          <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
