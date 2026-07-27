import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export interface FieldMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
  variant?: "default" | "error";
  children: React.ReactNode;
}

export const FieldMessage = React.forwardRef<HTMLParagraphElement, FieldMessageProps>(
  ({ className, id, variant = "default", children, ...props }, ref) => {
    const isError = variant === "error";

    return (
      <p
        ref={ref}
        id={id}
        role={isError ? "alert" : undefined}
        className={cn(
          "text-xs mt-1.5 flex items-start gap-1 font-normal leading-tight",
          isError
            ? "text-[var(--state-error,#c5221f)]"
            : "text-[var(--text-muted,#687181)]",
          className
        )}
        {...props}
      >
        {isError && (
          <AlertCircle
            className="h-3.5 w-3.5 shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </p>
    );
  }
);

FieldMessage.displayName = "FieldMessage";
