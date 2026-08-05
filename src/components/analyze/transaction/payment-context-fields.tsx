"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import { PaymentType } from "@/types/transaction";
import { MessageForm } from "@/components/analyze/message/message-form";
import { QrCode, UserCheck, Landmark, Search, ShieldAlert, MessageSquare } from "lucide-react";

import { MessageAnalysisInput } from "@/lib/forms/message-form-state";

export interface PaymentContextFieldsProps {
  paymentType: PaymentType;
  onPaymentTypeChange: (value: PaymentType) => void;
  noteCategory: string;
  onNoteCategoryChange: (value: string) => void;
  noteText: string;
  onNoteTextChange: (value: string) => void;
  noteTextError?: string;
  isCollectRequest: boolean;
  onIsCollectRequestChange: (checked: boolean) => void;
  hasRefundContext: boolean;
  onHasRefundContextChange: (checked: boolean) => void;
  hasDeviceChange: boolean;
  onHasDeviceChangeChange: (checked: boolean) => void;
  hasLocationChange: boolean;
  onHasLocationChangeChange: (checked: boolean) => void;
  recentFailuresCount: number;
  onRecentFailuresCountChange: (count: number) => void;
  recentFailuresError?: string;
  isKnownRecurring: boolean;
  onIsKnownRecurringChange: (checked: boolean) => void;
  includeMessage: boolean;
  onIncludeMessageChange: (checked: boolean) => void;
  messageText?: string;
  onMessageTextChange?: (value: string) => void;
  consentGiven?: boolean;
  onConsentGivenChange?: (checked: boolean) => void;
  onMessageAnalysisSubmit?: (input: MessageAnalysisInput) => void;
  messageTextError?: string;
  disabled?: boolean;
}

const PAYMENT_TYPE_OPTIONS: RadioOption[] = [
  {
    value: "scan_pay",
    label: (
      <span className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-blue-600" aria-hidden="true" />
        QR Code / Scan & Pay
      </span>
    ),
    description: "In-store counter QR or personal scan",
  },
  {
    value: "pay_contact",
    label: (
      <span className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        Pay Contact / Phone
      </span>
    ),
    description: "Direct transfer to saved contact",
  },
  {
    value: "bank_transfer",
    label: (
      <span className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-purple-600" aria-hidden="true" />
        Bank Account / IFSC
      </span>
    ),
    description: "Direct account & IFSC transfer",
  },
  {
    value: "check_upi",
    label: (
      <span className="flex items-center gap-2">
        <Search className="w-4 h-4 text-amber-600" aria-hidden="true" />
        Manual UPI Handle Check
      </span>
    ),
    description: "Verify unlinked or newly created handle",
  },
];

const NOTE_CATEGORY_OPTIONS = [
  { value: "general", label: "General Payment" },
  { value: "rent", label: "House Rent / Maintenance" },
  { value: "investment", label: "Investment / Crypto / Stocks" },
  { value: "medical", label: "Medical / Hospital Emergency" },
  { value: "shopping", label: "E-Commerce / Goods Purchase" },
  { value: "collect", label: "Collect Request / Pending Payment" },
  { value: "refund", label: "Refund / Cashback Claim" },
  { value: "other", label: "Other Category" },
];

const FAILURE_COUNT_OPTIONS = [
  { value: "0", label: "0 (No recent failures)" },
  { value: "1", label: "1 failure in last 24h" },
  { value: "2", label: "2 failures in last 24h" },
  { value: "3", label: "3 failures in last 24h" },
  { value: "5", label: "5+ failures in last 24h" },
];

export function PaymentContextFields({
  paymentType,
  onPaymentTypeChange,
  noteCategory,
  onNoteCategoryChange,
  noteText,
  onNoteTextChange,
  noteTextError,
  isCollectRequest,
  onIsCollectRequestChange,
  hasRefundContext,
  onHasRefundContextChange,
  hasDeviceChange,
  onHasDeviceChangeChange,
  hasLocationChange,
  onHasLocationChangeChange,
  recentFailuresCount,
  onRecentFailuresCountChange,
  recentFailuresError,
  isKnownRecurring,
  onIsKnownRecurringChange,
  includeMessage,
  onIncludeMessageChange,
  messageText = "",
  onMessageTextChange,
  consentGiven = false,
  onConsentGivenChange,
  onMessageAnalysisSubmit,
  disabled = false,
}: PaymentContextFieldsProps) {
  const failureCountOptions = React.useMemo(() => {
    const valStr = String(recentFailuresCount);
    const exists = FAILURE_COUNT_OPTIONS.some((opt) => opt.value === valStr);
    if (exists) {
      return FAILURE_COUNT_OPTIONS;
    }
    const dynamicOption = {
      value: valStr,
      label: `${recentFailuresCount} failures in last 24h`,
    };
    return [...FAILURE_COUNT_OPTIONS, dynamicOption].sort(
      (a, b) => Number(a.value) - Number(b.value)
    );
  }, [recentFailuresCount]);

  return (
    <div className="w-full space-y-5 border-t border-[var(--border-default,#dfe4ec)] pt-4 mt-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary,#172033)] flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-blue-600" aria-hidden="true" />
        Payment Channel & Contextual Risk Signals
      </h3>

      {/* Payment Type Selection */}
      <RadioGroup
        name="paymentType"
        legend="Payment Type / Channel"
        options={PAYMENT_TYPE_OPTIONS}
        value={paymentType}
        onChange={(val) => onPaymentTypeChange(val as PaymentType)}
        disabled={disabled}
        required
      />

      {/* Note Category & Free-Text Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Note Category"
          options={NOTE_CATEGORY_OPTIONS}
          value={noteCategory}
          onChange={(e) => onNoteCategoryChange(e.target.value)}
          disabled={disabled}
          description="Contextual classification for payment risk evaluation"
        />

        <Select
          label="Recent Payment Failures"
          options={failureCountOptions}
          value={String(recentFailuresCount)}
          onChange={(e) => onRecentFailuresCountChange(Number(e.target.value))}
          disabled={disabled}
          error={recentFailuresError}
          description="Failed or declined attempts in past 24 hours"
        />
      </div>

      <TextArea
        label="Payment Note / Description"
        placeholder="e.g. Rent payment for July 2026, or refund claim details"
        value={noteText}
        onChange={(e) => onNoteTextChange(e.target.value)}
        error={noteTextError}
        disabled={disabled}
        rows={2}
        description="Optional memo or description (up to 500 characters). Do NOT include PIN/OTP."
      />

      {/* Point-in-time Risk Signal Toggles */}
      <fieldset className="space-y-3 p-3 bg-[var(--bg-subtle,#f1f5f9)] rounded-[8px] border border-[var(--border-default,#dfe4ec)]">
        <legend className="text-xs font-semibold text-[var(--text-secondary,#566074)] uppercase tracking-wider mb-2">
          Point-in-Time Contextual Signals
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Checkbox
            label="This is a UPI collect request"
            description="Payment was requested by payee"
            checked={isCollectRequest}
            onChange={(e) => onIsCollectRequestChange(e.target.checked)}
            disabled={disabled}
          />

          <Checkbox
            label="Associated with refund or cashback claim"
            description="Payee claims you will receive money back"
            checked={hasRefundContext}
            onChange={(e) => onHasRefundContextChange(e.target.checked)}
            disabled={disabled}
          />

          <Checkbox
            label="New or untrusted device"
            description="SIM swap or app re-installation"
            checked={hasDeviceChange}
            onChange={(e) => onHasDeviceChangeChange(e.target.checked)}
            disabled={disabled}
          />

          <Checkbox
            label="Unusual location detected"
            description="Transaction outside home city/region"
            checked={hasLocationChange}
            onChange={(e) => onHasLocationChangeChange(e.target.checked)}
            disabled={disabled}
          />

          <Checkbox
            label="Recognized recurring payment"
            description="Regular rent, bills, or subscription"
            checked={isKnownRecurring}
            onChange={(e) => onIsKnownRecurringChange(e.target.checked)}
            disabled={disabled}
          />
        </div>
      </fieldset>

      {/* Optional Include Scam Message Integration Slot (Spec 20 Slot) */}
      <div className="p-3.5 bg-blue-50/50 rounded-[8px] border border-blue-200/80 space-y-3">
        <Checkbox
          label={
            <span className="font-semibold text-blue-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Include Scam Message / Chat Transcript for Analysis
            </span>
          }
          description="Analyze accompanying message text for scam patterns (Spec 20 slot)"
          checked={includeMessage}
          onChange={(e) => onIncludeMessageChange(e.target.checked)}
          disabled={disabled}
        />

        {includeMessage && (
          <div className="pt-2 border-t border-blue-200/60">
            <MessageForm
              mode="embedded"
              initialDraft={{
                messageText: messageText || "",
                consentGiven: consentGiven ?? false,
              }}
              onDraftChange={(draft) => {
                onMessageTextChange?.(draft.messageText);
                onConsentGivenChange?.(draft.consentGiven);
              }}
              onAnalysisSubmit={onMessageAnalysisSubmit}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
