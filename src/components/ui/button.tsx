import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary,#1a73e8)] text-white hover:bg-[var(--accent-primary-hover,#155fc0)] active:bg-[#124ea3] border border-transparent shadow-xs",
  secondary:
    "bg-[var(--bg-surface,#ffffff)] text-[var(--text-primary,#172033)] border border-[var(--border-default,#dfe4ec)] hover:bg-[var(--bg-subtle,#f1f5f9)] hover:border-[var(--border-strong,#c8cfda)] active:bg-[#e2e8f0]",
  quiet:
    "bg-transparent text-[var(--text-primary,#172033)] hover:bg-[var(--bg-subtle,#f1f5f9)] active:bg-[#e2e8f0] border border-transparent",
  danger:
    "bg-[var(--state-error,#c5221f)] text-white hover:bg-[#a81c19] active:bg-[#8b1715] border border-transparent shadow-xs",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 min-h-[44px] min-w-[44px]",
  md: "text-sm px-4 py-2.5 min-h-[44px] min-w-[44px]",
  lg: "text-base px-5 py-3 min-h-[48px] min-w-[48px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isControlDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isControlDisabled}
        aria-busy={isLoading ? true : undefined}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:ring-offset-1 select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Ensure min target 44px on touch devices
          "min-h-[44px]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin shrink-0"
              aria-hidden="true"
            />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2 inline-flex shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className="ml-2 inline-flex shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
