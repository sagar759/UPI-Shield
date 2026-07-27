import * as React from "react";
import { cn } from "@/lib/ui/class-names";
import { FieldMessage } from "@/components/ui/field-message";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      id: customId,
      label,
      description,
      error,
      required,
      disabled,
      readOnly,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = customId || generatedId;
    const descriptionId = description ? `${inputId}-desc` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-primary,#172033)] mb-1"
        >
          {label}
          {required && (
            <span className="text-[var(--state-error,#c5221f)] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-[6px] transition-colors border resize-y min-h-[80px]",
            "bg-[var(--bg-surface,#ffffff)] text-[var(--text-primary,#172033)]",
            "border-[var(--border-default,#dfe4ec)] hover:border-[var(--border-strong,#c8cfda)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle,#f1f5f9)]",
            "read-only:bg-[var(--bg-subtle,#f1f5f9)] read-only:cursor-default",
            error && "border-[var(--state-error,#c5221f)] focus-visible:ring-[var(--state-error,#c5221f)]",
            className
          )}
          {...props}
        />
        {description && (
          <FieldMessage id={descriptionId} variant="default">
            {description}
          </FieldMessage>
        )}
        {error && (
          <FieldMessage id={errorId} variant="error">
            {error}
          </FieldMessage>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
