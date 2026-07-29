"use client";

import * as React from "react";
import { cn } from "@/lib/ui/class-names";
import { FieldMessage } from "@/components/ui/field-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { DEMO_CONTACTS, DemoContact } from "@/data/demo/contacts";
import { UserCheck, Sparkles, Building2, User, ShoppingBag, HeartPulse } from "lucide-react";

export interface ReceiverFieldProps {
  id?: string;
  value: string;
  contactId?: string;
  scenarioId?: string;
  onChange: (value: string, contact?: DemoContact) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ReceiverField({
  id: customId,
  value,
  contactId,
  scenarioId,
  onChange,
  onBlur,
  error,
  required = true,
  disabled = false,
}: ReceiverFieldProps) {
  const generatedId = React.useId();
  const inputId = customId || generatedId;
  const descriptionId = `${inputId}-desc`;
  const errorId = error ? `${inputId}-error` : undefined;

  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxId = `${inputId}-listbox`;

  // Find resolved synthetic contact
  const selectedContact = React.useMemo(() => {
    if (contactId) {
      return DEMO_CONTACTS.find((c) => c.contactId === contactId);
    }
    return DEMO_CONTACTS.find(
      (c) =>
        c.vpa.toLowerCase() === value.trim().toLowerCase() ||
        c.displayName.toLowerCase() === value.trim().toLowerCase()
    );
  }, [contactId, value]);

  // Handle click outside dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryIcon = (category: DemoContact["category"]) => {
    switch (category) {
      case "landlord":
        return <Building2 className="w-3.5 h-3.5" />;
      case "friend":
        return <User className="w-3.5 h-3.5" />;
      case "merchant":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "medical":
        return <HeartPulse className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const handleSelectContact = (contact: DemoContact) => {
    onChange(contact.vpa, contact);
    setIsSelectOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Escape") {
      if (isSelectOpen) {
        e.preventDefault();
        setIsSelectOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isSelectOpen) {
        setIsSelectOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev < DEMO_CONTACTS.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isSelectOpen) {
        setIsSelectOpen(true);
        setActiveIndex(DEMO_CONTACTS.length - 1);
      } else {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : DEMO_CONTACTS.length - 1));
      }
    } else if (e.key === "Enter") {
      if (isSelectOpen && activeIndex >= 0 && DEMO_CONTACTS[activeIndex]) {
        e.preventDefault();
        handleSelectContact(DEMO_CONTACTS[activeIndex]);
      }
    }
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-primary,#172033)]"
        >
          Recipient VPA or UPI ID
          {required && (
            <span className="text-[var(--state-error,#c5221f)] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <span className="text-xs text-[var(--text-secondary,#566074)]">
          Synthetic Demo Identifier
        </span>
      </div>

      {/* Input container with autocomplete suggestion dropdown */}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isSelectOpen && !disabled}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            isSelectOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isSelectOpen) setIsSelectOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsSelectOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="e.g., ramesh.verma@okaxis or guptamart@upi"
          aria-invalid={error ? true : undefined}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
          autoComplete="off"
          className={cn(
            "w-full h-11 px-3 text-base rounded-[6px] transition-colors border",
            "bg-[var(--bg-surface,#ffffff)] text-[var(--text-primary,#172033)]",
            "border-[var(--border-default,#dfe4ec)] hover:border-[var(--border-strong,#c8cfda)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle,#f1f5f9)]",
            error && "border-[var(--state-error,#c5221f)] focus-visible:ring-[var(--state-error,#c5221f)]"
          )}
        />

        {/* Quick synthetic contact suggestions popup */}
        {isSelectOpen && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Synthetic Contacts"
            className="absolute z-20 w-full mt-1 bg-[var(--bg-surface,#ffffff)] border border-[var(--border-default,#dfe4ec)] rounded-[6px] shadow-lg max-h-60 overflow-y-auto py-1"
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary,#566074)] uppercase tracking-wider bg-[var(--bg-subtle,#f1f5f9)]">
              Approved Synthetic Demo Contacts
            </div>
            {DEMO_CONTACTS.map((contact, index) => {
              const isOptionActive = activeIndex === index;
              const isOptionSelected = selectedContact?.contactId === contact.contactId;

              return (
                <button
                  key={contact.contactId}
                  id={`${listboxId}-opt-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isOptionSelected}
                  onClick={() => handleSelectContact(contact)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center justify-between text-sm transition-colors hover:bg-[var(--bg-subtle,#f1f5f9)] focus:bg-[var(--bg-subtle,#f1f5f9)] focus:outline-none",
                    (isOptionActive || isOptionSelected) && "bg-blue-50/80 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-[var(--bg-subtle,#f1f5f9)] text-[var(--text-secondary,#566074)]">
                      {getCategoryIcon(contact.category)}
                    </div>
                    <div className="truncate">
                      <div className="text-[var(--text-primary,#172033)] truncate font-medium">
                        {contact.displayName}
                      </div>
                      <div className="text-xs text-[var(--text-secondary,#566074)] truncate font-mono">
                        {contact.vpa}
                      </div>
                    </div>
                  </div>

                  {contact.isVerifiedMerchant && (
                    <StatusBadge variant="neutral" className="ml-2 shrink-0 text-[11px] py-0.5 px-1.5">
                      Verified Merchant
                    </StatusBadge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Synthetic Prefill Disclosure Banner / Chip */}
      {selectedContact && (
        <div className="flex items-center gap-2 p-2 bg-blue-50/80 rounded-[6px] border border-blue-200 text-xs text-blue-900">
          <UserCheck className="w-4 h-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span>
            Prefilled synthetic contact: <strong className="font-semibold">{selectedContact.displayName}</strong> ({selectedContact.vpa})
          </span>
        </div>
      )}

      {!selectedContact && scenarioId && (
        <div className="flex items-center gap-2 p-2 bg-purple-50/80 rounded-[6px] border border-purple-200 text-xs text-purple-900">
          <Sparkles className="w-4 h-4 shrink-0 text-purple-600" aria-hidden="true" />
          <span>Prefilled from synthetic demo scenario ID: <code className="font-mono">{scenarioId}</code></span>
        </div>
      )}

      <FieldMessage id={descriptionId} variant="default">
        Select a synthetic contact or enter a VPA (e.g. name@upi). Never uses real bank data.
      </FieldMessage>

      {error && (
        <FieldMessage id={errorId} variant="error">
          {error}
        </FieldMessage>
      )}
    </div>
  );
}
