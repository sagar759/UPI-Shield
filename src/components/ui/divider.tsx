import * as React from "react";
import { cn } from "@/lib/ui/class-names";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", label, ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn(
            "inline-block w-[1px] self-stretch bg-[var(--border-default,#dfe4ec)] mx-2",
            className
          )}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn("flex items-center my-4 w-full", className)}
          {...props}
        >
          <div className="flex-1 h-[1px] bg-[var(--border-default,#dfe4ec)]" />
          <span className="px-3 text-xs font-medium text-[var(--text-muted,#687181)] uppercase tracking-wider">
            {label}
          </span>
          <div className="flex-1 h-[1px] bg-[var(--border-default,#dfe4ec)]" />
        </div>
      );
    }

    return (
      <hr
        ref={ref as unknown as React.Ref<HTMLHRElement>}
        className={cn(
          "my-4 border-0 h-[1px] bg-[var(--border-default,#dfe4ec)] w-full",
          className
        )}
        {...(props as React.HTMLAttributes<HTMLHRElement>)}
      />
    );
  }
);

Divider.displayName = "Divider";
