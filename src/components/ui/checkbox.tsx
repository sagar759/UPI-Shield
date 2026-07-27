import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/ui/class-names";
import { FieldMessage } from "@/components/ui/field-message";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      id: customId,
      label,
      description,
      error,
      disabled,
      checked,
      indeterminate = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = customId || generatedId;
    const descriptionId = description ? `${inputId}-desc` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex items-start gap-3 cursor-pointer select-none min-h-[44px] py-2 px-1 rounded-[4px] transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={innerRef}
              id={inputId}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              aria-invalid={error ? true : undefined}
              aria-describedby={ariaDescribedBy}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-[4px] border transition-colors flex items-center justify-center",
                "bg-[var(--bg-surface,#ffffff)] border-[var(--border-strong,#c8cfda)]",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring,#8ab4f8)] peer-focus-visible:ring-offset-1",
                "peer-checked:bg-[var(--accent-primary,#1a73e8)] peer-checked:border-[var(--accent-primary,#1a73e8)] peer-checked:text-white",
                indeterminate && "bg-[var(--accent-primary,#1a73e8)] border-[var(--accent-primary,#1a73e8)] text-white",
                error && "border-[var(--state-error,#c5221f)]"
              )}
            >
              {indeterminate ? (
                <Minus className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
              ) : checked ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
              ) : null}
            </div>
          </div>
          <div className="flex-1 text-sm text-[var(--text-primary,#172033)]">
            <span className="font-medium">{label}</span>
          </div>
        </label>
        {description && (
          <FieldMessage id={descriptionId} variant="default" className="ml-9">
            {description}
          </FieldMessage>
        )}
        {error && (
          <FieldMessage id={errorId} variant="error" className="ml-9">
            {error}
          </FieldMessage>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
