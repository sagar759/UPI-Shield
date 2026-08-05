"use client";

import * as React from "react";
import { MessageChannel } from "@/lib/forms/message-form-state";
import { Sparkles, CheckCircle2 } from "lucide-react";

export interface SyntheticExample {
  id: string;
  title: string;
  category: "Scam" | "Advisory";
  channel: MessageChannel;
  text: string;
  badgeText: string;
}

export const SYNTHETIC_MESSAGE_EXAMPLES: SyntheticExample[] = [
  {
    id: "invest_scam",
    title: "Student Investment Scheme",
    category: "Scam",
    channel: "telegram",
    text: "Urgent! Exclusive student investment opportunity: Double your money in 24 hours guaranteed! Transfer ₹5,000 to TEST_VPA_INVEST_001@example.invalid immediately. Limited slots remaining! Contact Telegram @scam_test for details.",
    badgeText: "High Risk • Investment Scam",
  },
  {
    id: "refund_scam",
    title: "Refund / Collect Request",
    category: "Scam",
    channel: "sms",
    text: "Dear customer, your refund of Rs 2500 for order #9821 is approved. Scan QR code or approve collect request to receive money in bank account instantly. Enter UPI PIN to confirm receipt.",
    badgeText: "High Risk • Fake Refund QR",
  },
  {
    id: "digital_arrest",
    title: "Digital Arrest Threat",
    category: "Scam",
    channel: "whatsapp",
    text: "TRAI & Cyber Crime Cell NOTICE: Your mobile number +919800000000 is suspended due to illegal money laundering package. Transfer ₹25,000 security clearance deposit to TEST_VPA_POLICE_001@example.invalid immediately within 30 minutes to avoid digital arrest.",
    badgeText: "High Risk • Cyber Police Coercion",
  },
  {
    id: "bank_advisory",
    title: "Legitimate Bank Advisory",
    category: "Advisory",
    channel: "sms",
    text: "HDFC Bank Security Advisory: Your daily UPI limit is ₹100,000. Never share your 6-digit UPI PIN or OTP with anyone. Stay safe.",
    badgeText: "Low Risk • Authentic Bank Warning",
  },
];

export interface MessageExamplesProps {
  onSelectExample: (example: SyntheticExample) => void;
  activeExampleId?: string;
  disabled?: boolean;
}

export function MessageExamples({
  onSelectExample,
  activeExampleId,
  disabled = false,
}: MessageExamplesProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary,#475569)]">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <span>Try a safe synthetic example from catalog:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SYNTHETIC_MESSAGE_EXAMPLES.map((example) => {
          const isSelected = activeExampleId === example.id;
          return (
            <button
              key={example.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectExample(example)}
              className={`p-2.5 rounded-[6px] text-left transition-all border text-xs min-h-[44px] flex flex-col justify-between gap-1 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring,#8ab4f8)] ${
                isSelected
                  ? "bg-blue-50/90 border-blue-400 ring-1 ring-blue-400"
                  : "bg-[var(--surface-base,#ffffff)] border-[var(--border-subtle,#e2e8f0)] hover:bg-[var(--surface-hover,#f1f5f9)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--text-primary,#172033)]">
                  {example.title}
                </span>
                {isSelected && (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-blue-600 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span
                className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] w-fit ${
                  example.category === "Scam"
                    ? "bg-amber-100/80 text-amber-900"
                    : "bg-emerald-100/80 text-emerald-900"
                }`}
              >
                {example.badgeText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
