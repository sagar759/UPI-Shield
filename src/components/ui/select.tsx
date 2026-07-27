import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/class-names";
import { FieldMessage } from "@/components/ui/field-message";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options?: SelectOption[];
  description?: string;
  error?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      id: customId,
      label,
      options,
      description,
      error,
      required,
      disabled,
      children,
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
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "w-full h-11 pl-3 pr-10 text-sm rounded-[6px] transition-colors border appearance-none cursor-pointer",
              "bg-[var(--bg-surface,#ffffff)] text-[var(--text-primary,#172033)]",
              "border-[var(--border-default,#dfe4ec)] hover:border-[var(--border-strong,#c8cfda)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle,#f1f5f9)]",
              error && "border-[var(--state-error,#c5221f)] focus-visible:ring-[var(--state-error,#c5221f)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            className={cn(
              "absolute right-3 h-4 w-4 text-[var(--text-secondary,#566074)] pointer-events-none shrink-0",
              disabled && "opacity-50"
            )}
            aria-hidden="true"
          />
        </div>
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

Select.displayName = "Select";
