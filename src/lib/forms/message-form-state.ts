import { RequestId, IsoTimestamp, MAX_MESSAGE_LENGTH } from "@/lib/contracts/primitives";
import {
  hasControlCharacters,
  hasInvalidEncoding,
  detectForbiddenSecrets,
  redactConcreteCredentials,
  ValidationErrorDetail,
} from "@/lib/validation/input";

export type MessageChannel =
  | "sms"
  | "whatsapp"
  | "telegram"
  | "call_transcript"
  | "social_message";

export interface MessageChannelOption {
  value: MessageChannel;
  label: string;
  description: string;
}

export const MESSAGE_CHANNEL_OPTIONS: MessageChannelOption[] = [
  {
    value: "sms",
    label: "SMS Text Message",
    description: "Standard mobile carrier SMS or bank advisory text",
  },
  {
    value: "whatsapp",
    label: "WhatsApp Message",
    description: "WhatsApp chat transcript or forward",
  },
  {
    value: "telegram",
    label: "Telegram Channel / Chat",
    description: "Telegram direct message or investment channel post",
  },
  {
    value: "call_transcript",
    label: "Call Transcript / Audio Note",
    description: "Notes or transcript from phone call or voicemail",
  },
  {
    value: "social_message",
    label: "Social Media DM / Post",
    description: "Instagram, X (Twitter), Facebook, or LinkedIn message",
  },
];

export interface MessageFormDraft {
  channel: MessageChannel;
  messageText: string;
  consentGiven: boolean;
  retentionConsent: boolean;
  isDemoContent: boolean;
}

export type MessageFormErrors = Record<string, string>;

export function createInitialMessageFormDraft(
  overrides?: Partial<MessageFormDraft>
): MessageFormDraft {
  return {
    channel: "sms",
    messageText: "",
    consentGiven: false,
    retentionConsent: false,
    isDemoContent: false,
    ...overrides,
  };
}

export function validateMessageFormDraft(draft: MessageFormDraft): {
  isValid: boolean;
  errors: MessageFormErrors;
} {
  const errors: MessageFormErrors = {};

  // 1. Mandatory Analysis Consent check
  if (!draft.consentGiven) {
    errors.consentGiven =
      "Explicit consent is required before message text can be analyzed.";
  }

  // 2. Message Text Validation
  const trimmed = draft.messageText.trim();
  if (trimmed.length === 0) {
    errors.messageText = "Message text is required for analysis.";
  } else {
    const redactedText = redactConcreteCredentials(draft.messageText);
    if (hasControlCharacters(draft.messageText)) {
      errors.messageText = "Message contains forbidden control characters.";
    } else if (hasInvalidEncoding(draft.messageText)) {
      errors.messageText = "Message contains invalid Unicode encoding.";
    } else if (detectForbiddenSecrets(redactedText)) {
      // Security Privacy Rule: Do not echo suspected secrets in error messages or logs
      errors.messageText =
        "Message text contains sensitive secret terms (such as PIN, OTP, CVV, or password). Never paste banking credentials.";
    } else if (draft.messageText.length > MAX_MESSAGE_LENGTH) {
      errors.messageText = `Message text exceeds maximum allowed limit of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`;
    }
  }

  // 3. Channel Validation
  const validChannels: MessageChannel[] = [
    "sms",
    "whatsapp",
    "telegram",
    "call_transcript",
    "social_message",
  ];
  if (!validChannels.includes(draft.channel)) {
    errors.channel = "Selected channel is invalid.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface MessageAnalysisInput {
  requestId: RequestId;
  messageText: string;
  channel: MessageChannel;
  consentGiven: boolean;
  retentionConsent: boolean;
  timestamp: IsoTimestamp;
  isDemoContent: boolean;
}

export function buildMessageAnalysisInput(
  draft: MessageFormDraft,
  customTimestamp?: string
): { input?: MessageAnalysisInput; errors: ValidationErrorDetail[] } {
  const validation = validateMessageFormDraft(draft);
  if (!validation.isValid) {
    const errorDetails: ValidationErrorDetail[] = Object.entries(
      validation.errors
    ).map(([field, message]) => ({
      field,
      code: "VALIDATION_ERROR",
      message,
    }));
    return { errors: errorDetails };
  }

  const requestId = `req_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` as RequestId;
  const timestamp = (customTimestamp || new Date().toISOString()) as IsoTimestamp;

  const input: MessageAnalysisInput = {
    requestId,
    messageText: redactConcreteCredentials(draft.messageText.trim()),
    channel: draft.channel,
    consentGiven: draft.consentGiven,
    retentionConsent: draft.retentionConsent,
    timestamp,
    isDemoContent: draft.isDemoContent,
  };

  return { input, errors: [] };
}
