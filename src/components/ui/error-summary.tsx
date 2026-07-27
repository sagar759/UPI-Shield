import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export interface FormErrorItem {
  fieldId: string;
  message: string;
}

export interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors: FormErrorItem[];
  onFieldFocus?: (fieldId: string) => void;
}

export const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    {
      className,
      title = "There is a problem",
      errors,
      onFieldFocus,
      ...props
    },
    ref
  ) => {
    const titleId = React.useId();

    if (!errors || errors.length === 0) {
      return null;
    }

    const handleLinkClick = (
      e: React.MouseEvent<HTMLAnchorElement>,
      fieldId: string
    ) => {
      e.preventDefault();
      const element = document.getElementById(fieldId);
      if (element) {
        element.focus();
        if (typeof element.scrollIntoView === "function") {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      if (onFieldFocus) {
        onFieldFocus(fieldId);
      }
    };

    return (
      <div
        ref={ref}
        role="alert"
        aria-labelledby={titleId}
        className={cn(
          "rounded-[8px] border border-[var(--state-error,#c5221f)] bg-[var(--state-error-bg,#fce8e6)] p-4 text-[var(--text-primary,#172033)] shadow-xs",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle
            className="h-5 w-5 text-[var(--state-error,#c5221f)] shrink-0"
            aria-hidden="true"
          />
          <h2
            id={titleId}
            className="text-base font-semibold text-[var(--state-error,#c5221f)]"
          >
            {title}
          </h2>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {errors.map((error, idx) => (
            <li key={`${error.fieldId}-${idx}`}>
              <a
                href={`#${error.fieldId}`}
                onClick={(e) => handleLinkClick(e, error.fieldId)}
                className="text-[var(--state-error,#c5221f)] hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] rounded-[2px]"
              >
                {error.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

ErrorSummary.displayName = "ErrorSummary";
