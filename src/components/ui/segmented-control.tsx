import * as React from "react";
import { cn } from "@/lib/ui/class-names";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(
  (
    {
      options,
      value,
      onChange,
      label = "View mode selection",
      name,
      className,
      disabled = false,
    },
    ref
  ) => {
    const groupName = React.useId();
    const activeName = name || groupName;
    const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      currentIndex: number
    ) => {
      if (disabled || options.length === 0) return;

      let targetIndex = -1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        let idx = (currentIndex + 1) % options.length;
        while (idx !== currentIndex) {
          if (!options[idx]?.disabled) {
            targetIndex = idx;
            break;
          }
          idx = (idx + 1) % options.length;
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        let idx = (currentIndex - 1 + options.length) % options.length;
        while (idx !== currentIndex) {
          if (!options[idx]?.disabled) {
            targetIndex = idx;
            break;
          }
          idx = (idx - 1 + options.length) % options.length;
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        for (let idx = 0; idx < options.length; idx++) {
          if (!options[idx]?.disabled) {
            targetIndex = idx;
            break;
          }
        }
      } else if (e.key === "End") {
        e.preventDefault();
        for (let idx = options.length - 1; idx >= 0; idx--) {
          if (!options[idx]?.disabled) {
            targetIndex = idx;
            break;
          }
        }
      }

      if (
        targetIndex !== -1 &&
        targetIndex !== currentIndex &&
        !options[targetIndex]?.disabled &&
        !disabled
      ) {
        onChange(options[targetIndex].value);
        buttonRefs.current[targetIndex]?.focus();
      }
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={cn(
          "w-full bg-[var(--bg-subtle,#f1f5f9)] p-1 rounded-[8px] border border-[var(--border-default,#dfe4ec)] grid auto-cols-fr grid-flow-col gap-1 overflow-hidden",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        {options.map((option, idx) => {
          const isSelected = option.value === value;
          const isOptionDisabled = disabled || option.disabled;

          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              name={activeName}
              aria-checked={isSelected}
              disabled={isOptionDisabled}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                if (!isOptionDisabled) {
                  onChange(option.value);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 py-2 text-xs md:text-sm font-medium rounded-[6px] transition-all select-none truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:ring-offset-1",
                isSelected
                  ? "bg-[var(--bg-surface,#ffffff)] text-[var(--accent-primary,#1a73e8)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary,#566074)] hover:text-[var(--text-primary,#172033)] hover:bg-[rgba(255,255,255,0.5)]",
                isOptionDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.icon && (
                <span className="shrink-0 inline-flex items-center" aria-hidden="true">
                  {option.icon}
                </span>
              )}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

SegmentedControl.displayName = "SegmentedControl";
