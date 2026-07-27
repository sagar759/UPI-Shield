import * as React from "react";
import { cn } from "@/lib/ui/class-names";
import { FieldMessage } from "@/components/ui/field-message";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  id?: string;
  name: string;
  legend: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  description?: string;
  error?: string;
  required?: boolean;
}

export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      className,
      id: customId,
      name,
      legend,
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      description,
      error,
      required,
      disabled: groupDisabled = false,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldsetId = customId || generatedId;
    const descriptionId = description ? `${fieldsetId}-desc` : undefined;
    const errorId = error ? `${fieldsetId}-error` : undefined;

    const callerDescribedBy = props["aria-describedby"];
    const mergedDescribedBy =
      [callerDescribedBy, descriptionId, errorId].filter(Boolean).join(" ") ||
      undefined;

    const computedInvalid = error ? true : props["aria-invalid"];

    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

    const currentValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const handleChange = (val: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(val);
      }
      if (onChange) {
        onChange(val);
      }
    };

    return (
      <fieldset
        ref={ref}
        {...props}
        id={fieldsetId}
        tabIndex={-1}
        aria-describedby={mergedDescribedBy}
        aria-invalid={computedInvalid}
        className={cn(
          "w-full border-none p-0 m-0 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:ring-offset-2",
          className
        )}
      >
        <legend className="block text-sm font-medium text-[var(--text-primary,#172033)] mb-2">
          {legend}
          {required && (
            <span className="text-[var(--state-error,#c5221f)] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </legend>

        <div className="space-y-1">
          {options.map((option) => {
            const radioId = `${fieldsetId}-${option.value}`;
            const isOptionDisabled = groupDisabled || option.disabled;
            const isChecked = currentValue === option.value;

            return (
              <div key={option.value} className="w-full">
                <label
                  htmlFor={radioId}
                  className={cn(
                    "inline-flex items-start gap-3 cursor-pointer select-none w-full min-h-[44px] py-2 px-2.5 rounded-[6px] transition-colors border",
                    "border-transparent hover:bg-[var(--bg-subtle,#f1f5f9)]",
                    isChecked && "bg-[var(--bg-subtle,#f1f5f9)] border-[var(--border-default,#dfe4ec)]",
                    isOptionDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                  )}
                >
                  <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                    <input
                      id={radioId}
                      type="radio"
                      name={name}
                      value={option.value}
                      checked={isChecked}
                      disabled={isOptionDisabled}
                      required={required}
                      onChange={() => handleChange(option.value)}
                      className="peer sr-only"
                    />
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border transition-colors flex items-center justify-center",
                        "bg-[var(--bg-surface,#ffffff)] border-[var(--border-strong,#c8cfda)]",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring,#8ab4f8)] peer-focus-visible:ring-offset-1",
                        isChecked &&
                          "border-[var(--accent-primary,#1a73e8)] bg-[var(--bg-surface,#ffffff)]",
                        error && "border-[var(--state-error,#c5221f)]"
                      )}
                    >
                      {isChecked && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-primary,#1a73e8)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-sm text-[var(--text-primary,#172033)]">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-[var(--text-muted,#687181)] mt-0.5 font-normal">
                        {option.description}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {description && (
          <FieldMessage id={descriptionId} variant="default" className="mt-1.5">
            {description}
          </FieldMessage>
        )}
        {error && (
          <FieldMessage id={errorId} variant="error" className="mt-1.5">
            {error}
          </FieldMessage>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
