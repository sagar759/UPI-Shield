"use client";

import * as React from "react";
import { AmountField } from "@/components/ui/amount-field";
import { ErrorSummary, FormErrorItem } from "@/components/ui/error-summary";
import { Button } from "@/components/ui/button";
import { ReceiverField } from "@/components/analyze/transaction/receiver-field";
import { PaymentContextFields } from "@/components/analyze/transaction/payment-context-fields";
import {
  TransactionFormDraft,
  TransactionFormErrors,
  TransactionFormTouched,
  createDefaultTransactionFormDraft,
  validateTransactionFormState,
  buildTransactionCheckInput,
  prefillFromContact,
  prefillFromScenario,
} from "@/lib/forms/transaction-form-state";
import { TransactionCheckInput } from "@/types/transaction";
import { DEMO_CONTACTS, DemoContact } from "@/data/demo/contacts";
import { DEMO_SCENARIOS } from "@/data/demo/scenarios";
import { ShieldCheck } from "lucide-react";

export interface TransactionFormProps {
  initialDraft?: TransactionFormDraft;
  contactId?: string;
  scenarioId?: string;
  onRiskInputSubmit?: (input: TransactionCheckInput) => void;
  onDraftChange?: (draft: TransactionFormDraft) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TransactionForm({
  initialDraft,
  contactId,
  scenarioId,
  onRiskInputSubmit,
  onDraftChange,
  isLoading = false,
  disabled = false,
}: TransactionFormProps) {
  // Initialize draft state
  const [draft, setDraft] = React.useState<TransactionFormDraft>(() => {
    if (initialDraft) return initialDraft;
    if (contactId) {
      const contact = DEMO_CONTACTS.find((c) => c.contactId === contactId);
      if (contact) return prefillFromContact(contact);
    }
    if (scenarioId) {
      const scenario = DEMO_SCENARIOS.find((s) => s.scenarioId === scenarioId);
      if (scenario) return prefillFromScenario(scenario);
    }
    return createDefaultTransactionFormDraft();
  });

  const [touched, setTouched] = React.useState<TransactionFormTouched>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | undefined>(undefined);

  const errorSummaryRef = React.useRef<HTMLDivElement>(null);

  // Adjust draft state during render when prop scenarioId changes externally
  const [prevScenarioId, setPrevScenarioId] = React.useState(scenarioId);
  if (prevScenarioId !== scenarioId) {
    setPrevScenarioId(scenarioId);
    if (scenarioId) {
      const scenario = DEMO_SCENARIOS.find((s) => s.scenarioId === scenarioId);
      if (scenario) {
        setDraft(prefillFromScenario(scenario));
      }
    }
  }

  // Adjust draft state during render when prop contactId changes externally
  const [prevContactId, setPrevContactId] = React.useState(contactId);
  if (prevContactId !== contactId) {
    setPrevContactId(contactId);
    if (contactId) {
      const contact = DEMO_CONTACTS.find((c) => c.contactId === contactId);
      if (contact) {
        setDraft((prev) => prefillFromContact(contact, prev));
      }
    }
  }

  const updateDraft = React.useCallback(
    (updates: Partial<TransactionFormDraft>) => {
      setSubmitError(undefined);
      setDraft((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Store onDraftChange callback in ref to prevent inline callbacks from re-triggering effects
  const onDraftChangeRef = React.useRef(onDraftChange);
  React.useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  React.useEffect(() => {
    onDraftChangeRef.current?.(draft);
  }, [draft]);

  const markTouched = React.useCallback((field: keyof TransactionFormDraft) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Form validation errors
  const errors: TransactionFormErrors = React.useMemo(() => {
    return validateTransactionFormState(draft, touched, isSubmitted);
  }, [draft, touched, isSubmitted]);

  // Map errors into FormErrorItem array for ErrorSummary
  const summaryErrors: FormErrorItem[] = React.useMemo(() => {
    const list: FormErrorItem[] = [];
    if (errors.receiverInput) {
      list.push({ fieldId: "txn-receiver-input", message: errors.receiverInput });
    }
    if (errors.amount) {
      list.push({ fieldId: "txn-amount-input", message: errors.amount });
    }
    if (errors.noteText) {
      list.push({ fieldId: "txn-note-text", message: errors.noteText });
    }
    if (errors.recentFailuresCount) {
      list.push({ fieldId: "txn-failures-count", message: errors.recentFailuresCount });
    }
    if (errors.messageText) {
      list.push({ fieldId: "txn-message-text", message: errors.messageText });
    }
    if (errors.general) {
      list.push({ fieldId: "txn-form-submit", message: errors.general });
    }
    if (submitError) {
      list.push({ fieldId: "txn-form-submit", message: submitError });
    }
    return list;
  }, [errors, submitError]);

  // Move blocked-submit focus handling into an effect that runs post-render when summary is visible
  React.useEffect(() => {
    if (isSubmitted && summaryErrors.length > 0 && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
      if (typeof errorSummaryRef.current.scrollIntoView === "function") {
        errorSummaryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isSubmitted, summaryErrors.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setSubmitError(undefined);

    // Validate all fields
    const fullValidationErrors = validateTransactionFormState(draft, {}, true);

    if (Object.keys(fullValidationErrors).length > 0) {
      return;
    }

    try {
      const scenario = scenarioId
        ? DEMO_SCENARIOS.find((s) => s.scenarioId === scenarioId)
        : undefined;

      const validatedRiskInput = buildTransactionCheckInput(draft, { scenario });
      onRiskInputSubmit?.(validatedRiskInput);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to construct valid transaction risk input";
      setSubmitError(msg);
    }
  };

  const handleReceiverChange = (receiverVal: string, contact?: DemoContact) => {
    markTouched("receiverInput");
    if (contact) {
      const prefilled = prefillFromContact(contact, draft);
      updateDraft(prefilled);
    } else {
      updateDraft({
        receiverInput: receiverVal,
        contactId: undefined, // Cleared if custom text typed
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Transaction Risk Assessment Form"
      className="space-y-5"
    >
      {/* Error Summary rendered on submission block */}
      {isSubmitted && summaryErrors.length > 0 && (
        <ErrorSummary
          ref={errorSummaryRef}
          tabIndex={-1}
          title="Please resolve the following issues before scoring transaction risk"
          errors={summaryErrors}
          className="focus:outline-none focus:ring-2 focus:ring-[var(--state-error,#c5221f)]"
        />
      )}

      {/* Recipient VPA / Contact Field */}
      <ReceiverField
        id="txn-receiver-input"
        value={draft.receiverInput}
        contactId={draft.contactId}
        scenarioId={draft.scenarioId}
        onChange={handleReceiverChange}
        onBlur={() => markTouched("receiverInput")}
        error={isSubmitted || touched.receiverInput ? errors.receiverInput : undefined}
        disabled={disabled || isLoading}
        required
      />

      {/* Transaction Amount Field */}
      <AmountField
        id="txn-amount-input"
        label="Transaction Amount"
        placeholder="0.00"
        value={draft.amount}
        onChange={(e) => updateDraft({ amount: e.target.value })}
        onBlur={() => markTouched("amount")}
        error={isSubmitted || touched.amount ? errors.amount : undefined}
        disabled={disabled || isLoading}
        required
        description="Enter amount in Indian Rupees (INR). Demo limit: ₹5,00,000."
      />

      {/* Payment Channel & Contextual Signal Controls */}
      <PaymentContextFields
        paymentType={draft.paymentType}
        onPaymentTypeChange={(val) => {
          markTouched("paymentType");
          updateDraft({ paymentType: val });
        }}
        noteCategory={draft.noteCategory}
        onNoteCategoryChange={(val) => updateDraft({ noteCategory: val })}
        noteText={draft.noteText}
        onNoteTextChange={(val) => updateDraft({ noteText: val })}
        noteTextError={isSubmitted || touched.noteText ? errors.noteText : undefined}
        isCollectRequest={draft.isCollectRequest}
        onIsCollectRequestChange={(val) => updateDraft({ isCollectRequest: val })}
        hasRefundContext={draft.hasRefundContext}
        onHasRefundContextChange={(val) => updateDraft({ hasRefundContext: val })}
        hasDeviceChange={draft.hasDeviceChange}
        onHasDeviceChangeChange={(val) => updateDraft({ hasDeviceChange: val })}
        hasLocationChange={draft.hasLocationChange}
        onHasLocationChangeChange={(val) => updateDraft({ hasLocationChange: val })}
        recentFailuresCount={draft.recentFailuresCount}
        onRecentFailuresCountChange={(count) => updateDraft({ recentFailuresCount: count })}
        recentFailuresError={isSubmitted || touched.recentFailuresCount ? errors.recentFailuresCount : undefined}
        isKnownRecurring={draft.isKnownRecurring}
        onIsKnownRecurringChange={(val) => updateDraft({ isKnownRecurring: val })}
        includeMessage={draft.includeMessage}
        onIncludeMessageChange={(val) => updateDraft({ includeMessage: val })}
        messageText={draft.messageText}
        onMessageTextChange={(val) => updateDraft({ messageText: val })}
        consentGiven={draft.consentGiven}
        onConsentGivenChange={(val) => updateDraft({ consentGiven: val })}
        messageTextError={isSubmitted || touched.messageText ? errors.messageText : undefined}
        disabled={disabled || isLoading}
      />

      {/* Form Submission Action */}
      <Button
        id="txn-form-submit"
        type="submit"
        variant="primary"
        disabled={disabled || isLoading}
        className="w-full min-h-[48px] text-base font-semibold shadow-xs flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        {isLoading ? "Evaluating Transaction Signals..." : "Evaluate Transaction Risk"}
      </Button>
    </form>
  );
}
