import * as React from "react";
import { cn } from "@/lib/ui/class-names";

export type PanelVariant =
  | "default"
  | "subtle"
  | "bordered"
  | "danger"
  | "warning"
  | "success";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
  variant?: PanelVariant;
  children: React.ReactNode;
}

const variantStyles: Record<PanelVariant, string> = {
  default:
    "bg-[var(--bg-surface,#ffffff)] border border-[var(--border-default,#dfe4ec)] text-[var(--text-primary,#172033)]",
  subtle:
    "bg-[var(--bg-subtle,#f1f5f9)] border border-[var(--border-default,#dfe4ec)] text-[var(--text-primary,#172033)]",
  bordered:
    "bg-[var(--bg-surface,#ffffff)] border-2 border-[var(--border-strong,#c8cfda)] text-[var(--text-primary,#172033)]",
  danger:
    "bg-[var(--state-error-bg,#fce8e6)] border border-[var(--state-error,#c5221f)] text-[var(--text-primary,#172033)]",
  warning:
    "bg-[var(--state-warning-bg,#fef7e0)] border border-[var(--state-warning,#9a6700)] text-[var(--text-primary,#172033)]",
  success:
    "bg-[var(--state-success-bg,#e6f4ea)] border border-[var(--state-success,#137333)] text-[var(--text-primary,#172033)]",
};

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      as: Component = "div",
      variant = "default",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Tag = Component as React.ElementType;

    return (
      <Tag
        ref={ref}
        className={cn(
          "rounded-[8px] p-4 md:p-5 transition-colors shadow-2xs",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

Panel.displayName = "Panel";
