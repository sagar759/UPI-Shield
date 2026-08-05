"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, Lock } from "lucide-react";

export interface MessageConsentProps {
  consentGiven: boolean;
  onConsentGivenChange: (checked: boolean) => void;
  consentGivenError?: string;
  retentionConsent: boolean;
  onRetentionConsentChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function MessageConsent({
  consentGiven,
  onConsentGivenChange,
  consentGivenError,
  retentionConsent,
  onRetentionConsentChange,
  disabled = false,
}: MessageConsentProps) {
  return (
    <div className="space-y-4 rounded-[8px] bg-[var(--surface-subtle,#f8fafc)] border border-[var(--border-subtle,#e2e8f0)] p-4">
      {/* Secret Credential Warning Banner */}
      <div className="flex items-start gap-3 p-3 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
        <ShieldAlert
          className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <span className="font-semibold block text-amber-950 mb-0.5">
            Privacy Warning: Never paste secret credentials
          </span>
          Do not paste your 4/6-digit UPI PIN, SMS OTP, CVV, passwords, or full account numbers. This tool analyzes message language patterns only.
        </div>
      </div>

      {/* Primary Mandatory Analysis Consent */}
      <div className="space-y-1">
        <Checkbox
          id="message-analysis-consent"
          label={
            <span className="font-medium text-[var(--text-primary,#172033)] text-sm">
              I consent to analyze this message for scam indicators
            </span>
          }
          description="The prototype processes text in your browser or local session to evaluate scam likelihood."
          checked={consentGiven}
          onChange={(e) => onConsentGivenChange(e.target.checked)}
          error={consentGivenError}
          disabled={disabled}
        />
      </div>

      {/* Secondary Optional Retention Consent (Defaulted OFF) */}
      <div className="pt-2 border-t border-[var(--border-subtle,#e2e8f0)]">
        <Checkbox
          id="message-retention-consent"
          label={
            <span className="font-normal text-[var(--text-secondary,#475569)] text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Allow optional retention of raw text sample (Default: OFF)
            </span>
          }
          description="Without this consent, raw message text is purged upon workflow completion and never saved to persistent storage."
          checked={retentionConsent}
          onChange={(e) => onRetentionConsentChange(e.target.checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
