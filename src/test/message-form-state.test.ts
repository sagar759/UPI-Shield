import { describe, it, expect } from "vitest";
import {
  createInitialMessageFormDraft,
  validateMessageFormDraft,
  buildMessageAnalysisInput,
  MESSAGE_CHANNEL_OPTIONS,
  MessageFormDraft,
} from "@/lib/forms/message-form-state";
import { MAX_MESSAGE_LENGTH } from "@/lib/contracts/primitives";

describe("MessageFormState & Validation Logic", () => {
  it("initializes draft with retention consent defaulted OFF and consentGiven false", () => {
    const draft = createInitialMessageFormDraft();
    expect(draft.channel).toBe("sms");
    expect(draft.messageText).toBe("");
    expect(draft.consentGiven).toBe(false);
    expect(draft.retentionConsent).toBe(false);
    expect(draft.isDemoContent).toBe(false);
  });

  it("requires explicit analysis consent to pass validation", () => {
    const draft: MessageFormDraft = {
      channel: "whatsapp",
      messageText: "Suspicious refund message",
      consentGiven: false,
      retentionConsent: false,
      isDemoContent: false,
    };

    const validation = validateMessageFormDraft(draft);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.consentGiven).toBe(
      "Explicit consent is required before message text can be analyzed."
    );
  });

  it("fails validation on empty or whitespace message text", () => {
    const draft: MessageFormDraft = {
      channel: "telegram",
      messageText: "   \n\t  ",
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: false,
    };

    const validation = validateMessageFormDraft(draft);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.messageText).toBe("Message text is required for analysis.");
  });

  it("accepts ordinary mentions of secret terms (PIN, OTP, CVV, password) without concrete values", () => {
    const draft: MessageFormDraft = {
      channel: "sms",
      messageText: "Do not share your OTP or PIN with callers claiming to be bank staff.",
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: false,
    };

    const validation = validateMessageFormDraft(draft);
    expect(validation.isValid).toBe(true);
  });

  it("redacts concrete credential values (PIN 1234, OTP 482910) in buildMessageAnalysisInput", () => {
    const draft: MessageFormDraft = {
      channel: "sms",
      messageText: "Please enter your 4-digit PIN 1234 or OTP 482910 to proceed with refund",
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: false,
    };

    const result = buildMessageAnalysisInput(draft);
    expect(result.input?.messageText).toContain("[REDACTED]");
    expect(result.input?.messageText).not.toContain("1234");
    expect(result.input?.messageText).not.toContain("482910");
  });

  it("rejects message text exceeding MAX_MESSAGE_LENGTH (10,000 chars)", () => {
    const longText = "a".repeat(MAX_MESSAGE_LENGTH + 1);
    const draft: MessageFormDraft = {
      channel: "social_message",
      messageText: longText,
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: false,
    };

    const validation = validateMessageFormDraft(draft);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.messageText).toContain("exceeds maximum allowed limit");
  });

  it("handles valid Unicode, multilingual Hinglish, and emojis correctly", () => {
    const draft: MessageFormDraft = {
      channel: "whatsapp",
      messageText: "Bhai urgent payment 🚀 transfer ₹5000 right now for double return 💰",
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: false,
    };

    const validation = validateMessageFormDraft(draft);
    expect(validation.isValid).toBe(true);
    expect(Object.keys(validation.errors).length).toBe(0);
  });

  it("builds structured MessageAnalysisInput when draft is valid", () => {
    const draft: MessageFormDraft = {
      channel: "call_transcript",
      messageText: "Call transcript claiming bank account suspension",
      consentGiven: true,
      retentionConsent: false,
      isDemoContent: true,
    };

    const result = buildMessageAnalysisInput(draft, "2026-08-05T10:00:00.000Z");
    expect(result.errors.length).toBe(0);
    expect(result.input).toBeDefined();
    expect(result.input?.channel).toBe("call_transcript");
    expect(result.input?.messageText).toBe("Call transcript claiming bank account suspension");
    expect(result.input?.consentGiven).toBe(true);
    expect(result.input?.retentionConsent).toBe(false);
    expect(result.input?.isDemoContent).toBe(true);
    expect(result.input?.requestId).toMatch(/^req_msg_/);
    expect(result.input?.timestamp).toBe("2026-08-05T10:00:00.000Z");
  });

  it("provides 5 valid channel options", () => {
    expect(MESSAGE_CHANNEL_OPTIONS.length).toBe(5);
    const channels = MESSAGE_CHANNEL_OPTIONS.map((c) => c.value);
    expect(channels).toEqual([
      "sms",
      "whatsapp",
      "telegram",
      "call_transcript",
      "social_message",
    ]);
  });
});
