import { TransactionCheckInputSchema } from "@/lib/contracts/schemas";
import { TransactionCheckInput, PaymentType } from "@/types/transaction";
import { RupeeAmount, TransactionId, ProfileId, IsoTimestamp } from "@/lib/contracts/primitives";
import { DEMO_PRIMARY_PROFILE, DEMO_COUNTERPARTY_PROFILES } from "@/data/demo/profiles";
import { DEMO_CONTACTS, DemoContact } from "@/data/demo/contacts";
import { DemoScenario } from "@/types/scenario";
import { validateStringInput, detectForbiddenSecrets } from "@/lib/validation/input";

export const MAX_DEMO_TRANSACTION_AMOUNT = 500_000;
export const STANDARD_NPCI_UPI_LIMIT = 100_000;

export interface TransactionFormDraft {
  receiverInput: string;
  contactId?: string;
  scenarioId?: string;
  amount: string;
  paymentType: PaymentType;
  noteCategory: string;
  noteText: string;
  isCollectRequest: boolean;
  hasRefundContext: boolean;
  hasDeviceChange: boolean;
  hasLocationChange: boolean;
  recentFailuresCount: number;
  isKnownRecurring: boolean;
  includeMessage: boolean;
  messageText?: string;
  consentGiven?: boolean;
}

export interface TransactionFormErrors {
  receiverInput?: string;
  amount?: string;
  noteText?: string;
  recentFailuresCount?: string;
  messageText?: string;
  general?: string;
}

export type TransactionFormTouched = Partial<Record<keyof TransactionFormDraft, boolean>>;

export function createDefaultTransactionFormDraft(): TransactionFormDraft {
  return {
    receiverInput: "",
    contactId: undefined,
    scenarioId: undefined,
    amount: "",
    paymentType: "scan_pay",
    noteCategory: "general",
    noteText: "",
    isCollectRequest: false,
    hasRefundContext: false,
    hasDeviceChange: false,
    hasLocationChange: false,
    recentFailuresCount: 0,
    isKnownRecurring: false,
    includeMessage: false,
    messageText: "",
    consentGiven: false,
  };
}

/**
 * Safely parses a raw amount input string into a numeric Rupee value.
 * Handles pasted currency symbols (₹, INR, Rs), commas, and spaces.
 * Rejects zero, negative, NaN, Infinity, and values above the max demo limit (500,000 INR).
 */
export function parseRupeeAmountInput(rawAmount: string): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  if (!rawAmount || typeof rawAmount !== "string") {
    return { valid: false, error: "Amount is required" };
  }

  const cleaned = rawAmount
    .replace(/[₹\s,]|INR|Rs\.?|rs\.?/gi, "")
    .trim();

  if (cleaned.length === 0) {
    return { valid: false, error: "Amount is required" };
  }

  // Reject invalid numeric format (e.g. "12abc", "1.2.3")
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return { valid: false, error: "Please enter a valid numeric amount" };
  }

  const numericValue = Number(cleaned);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    return { valid: false, error: "Amount must be a valid finite number" };
  }

  if (numericValue <= 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }

  if (numericValue > MAX_DEMO_TRANSACTION_AMOUNT) {
    return {
      valid: false,
      error: `Amount exceeds maximum demo UPI transaction limit of ₹${MAX_DEMO_TRANSACTION_AMOUNT.toLocaleString("en-IN")}`,
    };
  }

  return { valid: true, value: numericValue };
}

/**
 * Prefills form draft fields from an approved synthetic demo contact.
 * Strictly populates only supported synthetic identifiers.
 */
export function prefillFromContact(
  contact: DemoContact,
  existingDraft?: Partial<TransactionFormDraft>
): TransactionFormDraft {
  return {
    ...createDefaultTransactionFormDraft(),
    ...existingDraft,
    receiverInput: contact.vpa || contact.displayName,
    contactId: contact.contactId,
    scenarioId: undefined, // Clear scenario if switching to contact
    paymentType: contact.isVerifiedMerchant ? "scan_pay" : "pay_contact",
    isKnownRecurring: contact.relationshipAgeDays > 30,
  };
}

/**
 * Prefills form draft fields from an approved synthetic demo scenario.
 * Strictly populates only fields supplied by the scenario contract.
 */
export function prefillFromScenario(scenario: DemoScenario): TransactionFormDraft {
  const rawTxn = scenario.transactionInput.raw;
  const features = scenario.transactionInput.features;

  // Try resolving receiver contact name or VPA if possible
  const matchingContact = DEMO_CONTACTS.find(
    (c) => c.profileId === rawTxn.receiverId || c.vpa === rawTxn.receiverId
  );

  const receiverDisplay =
    matchingContact?.vpa || matchingContact?.displayName || rawTxn.receiverId;

  return {
    ...createDefaultTransactionFormDraft(),
    receiverInput: receiverDisplay,
    contactId: matchingContact?.contactId,
    scenarioId: scenario.scenarioId,
    amount: String(rawTxn.amount),
    paymentType: rawTxn.paymentType,
    noteCategory: features.hasRefundContext
      ? "refund"
      : features.isCollectRequest
      ? "collect"
      : "general",
    noteText: rawTxn.note || "",
    isCollectRequest: features.isCollectRequest,
    hasRefundContext: features.hasRefundContext,
    hasDeviceChange: features.hasDeviceChange,
    hasLocationChange: features.hasLocationChange,
    recentFailuresCount: features.recentFailuresCount,
    isKnownRecurring: features.relationshipAgeDays > 30 && !features.isNewPayee,
    includeMessage: Boolean(scenario.messageInput),
    messageText: scenario.messageInput?.messageText || "",
    consentGiven: Boolean(scenario.messageInput?.consentGiven),
  };
}

/**
 * Validates transaction form draft fields.
 * Validates touched fields or all fields if submission is attempted.
 */
export function validateTransactionFormState(
  draft: TransactionFormDraft,
  touched: TransactionFormTouched = {},
  isSubmitted: boolean = false
): TransactionFormErrors {
  const errors: TransactionFormErrors = {};

  // 1. Receiver field check
  if (isSubmitted || touched.receiverInput) {
    if (!draft.receiverInput || draft.receiverInput.trim().length === 0) {
      errors.receiverInput = "Recipient VPA, UPI ID, or contact is required";
    } else {
      const stringVal = validateStringInput(draft.receiverInput, {
        fieldName: "Recipient",
        maxLength: 128,
        minLength: 3,
      });
      if (stringVal.errors.length > 0) {
        errors.receiverInput = stringVal.errors[0].message;
      }
    }
  }

  // 2. Amount field check
  if (isSubmitted || touched.amount) {
    const parsed = parseRupeeAmountInput(draft.amount);
    if (!parsed.valid) {
      errors.amount = parsed.error || "Invalid amount";
    }
  }

  // 3. Note text field check (if provided)
  if ((isSubmitted || touched.noteText) && draft.noteText) {
    const stringVal = validateStringInput(draft.noteText, {
      fieldName: "Note",
      maxLength: 500,
      allowEmpty: true,
    });
    if (stringVal.errors.length > 0) {
      errors.noteText = stringVal.errors[0].message;
    }
  }

  // 4. Recent failures count check
  if (isSubmitted || touched.recentFailuresCount) {
    const count = Number(draft.recentFailuresCount);
    if (Number.isNaN(count) || count < 0 || count > 10) {
      errors.recentFailuresCount = "Recent failures count must be between 0 and 10";
    }
  }

  // 5. Message text check (if includeMessage toggle is active)
  if (draft.includeMessage && (isSubmitted || touched.messageText)) {
    if (draft.messageText && draft.messageText.trim().length > 0) {
      if (!draft.consentGiven) {
        errors.messageText = "Consent is required to analyze message text";
      } else if (detectForbiddenSecrets(draft.messageText)) {
        errors.messageText = "Message contains sensitive secret terms (PIN, OTP, CVV, or password)";
      } else if (draft.messageText.length > 10000) {
        errors.messageText = "Message text exceeds maximum length of 10,000 characters";
      }
    }
  }

  return errors;
}

/**
 * Resolves a receiver input string to a synthetic ProfileId.
 * Checks known contacts first, then maps or generates a safe synthetic profile identifier.
 */
export function resolveReceiverProfileId(receiverInput: string): ProfileId {
  const trimmed = receiverInput.trim();

  // 1. Check matching synthetic contacts
  const matchedContact = DEMO_CONTACTS.find(
    (c) =>
      c.contactId === trimmed ||
      c.vpa.toLowerCase() === trimmed.toLowerCase() ||
      c.displayName.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedContact) {
    return matchedContact.profileId;
  }

  // 2. Check predefined demo counterparty profiles
  const profiles = Object.values(DEMO_COUNTERPARTY_PROFILES);
  const matchedProfile = profiles.find(
    (p) =>
      p.maskedVpa.toLowerCase() === trimmed.toLowerCase() ||
      p.displayName.toLowerCase() === trimmed.toLowerCase() ||
      p.profileId === trimmed
  );
  if (matchedProfile) {
    return matchedProfile.profileId;
  }

  // 3. Fallback: Create safe synthetic profile ID from receiver string without real PII
  const sanitizedHandle = trimmed.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 32);
  return `profile_manual_${sanitizedHandle || "demo_payee"}` as ProfileId;
}

/**
 * Builds a parsed, runtime-validated TransactionCheckInput (TransactionRiskInput)
 * adhering strictly to the v1 TransactionCheckInputSchema contract.
 * Throws ZodError if contract validation fails.
 */
export function buildTransactionCheckInput(
  draft: TransactionFormDraft,
  options?: {
    scenario?: DemoScenario;
    timestamp?: string;
  }
): TransactionCheckInput {
  if (draft.includeMessage && draft.messageText && draft.messageText.trim().length > 0 && !draft.consentGiven) {
    throw new Error("Consent is required to analyze message text");
  }

  const parsedAmountResult = parseRupeeAmountInput(draft.amount);
  if (!parsedAmountResult.valid || parsedAmountResult.value === undefined) {
    throw new Error(parsedAmountResult.error || "Cannot build input from invalid amount");
  }

  const numericAmount = parsedAmountResult.value;
  const receiverProfileId = resolveReceiverProfileId(draft.receiverInput);
  const timestamp = (options?.timestamp || new Date().toISOString()) as IsoTimestamp;

  // Use prefilled scenario features if scenarioId matches, otherwise derive default signals
  let features = options?.scenario?.transactionInput.features;

  if (!features || options?.scenario?.scenarioId !== draft.scenarioId) {
    const isNewPayee = !draft.isKnownRecurring;
    const relationshipAgeDays = draft.isKnownRecurring ? 180 : 0;
    const amountRatio = Number((numericAmount / 2500).toFixed(2));
    const amountZScore = Number(((numericAmount - 2500) / 1500).toFixed(2));

    features = {
      amountRatio,
      amountZScore,
      isNewPayee,
      relationshipAgeDays,
      hourDeviation: 0.5,
      velocityCount5m: 1,
      velocityValue5m: numericAmount,
      velocityCount30m: 1,
      velocityValue30m: numericAmount,
      velocityCount60m: 1,
      velocityValue60m: numericAmount,
      recentFailuresCount: draft.recentFailuresCount,
      inactivityDays: 0,
      hasDeviceChange: draft.hasDeviceChange,
      hasLocationChange: draft.hasLocationChange,
      isCollectRequest: draft.isCollectRequest,
      hasRefundContext: draft.hasRefundContext,
      nameMismatch: false,
    };
  } else {
    // Override scenario features with user-modified draft toggles
    features = {
      ...features,
      isCollectRequest: draft.isCollectRequest,
      hasRefundContext: draft.hasRefundContext,
      hasDeviceChange: draft.hasDeviceChange,
      hasLocationChange: draft.hasLocationChange,
      recentFailuresCount: draft.recentFailuresCount,
      isNewPayee: !draft.isKnownRecurring,
    };
  }

  const rawInput = {
    transactionId: `txn_chk_${Date.now()}` as TransactionId,
    senderId: DEMO_PRIMARY_PROFILE.profileId,
    receiverId: receiverProfileId,
    amount: numericAmount as RupeeAmount,
    currency: "INR" as const,
    timestamp,
    paymentType: draft.paymentType,
    channel: "mobile_app",
    device: "Android_Pixel7_Aarav",
    region: "IN-DL",
    note: draft.noteText.trim() ? draft.noteText.trim() : null,
  };

  const payload = {
    raw: rawInput,
    features,
  };

  // Validate strictly against v1 Zod contract
  return TransactionCheckInputSchema.parse(payload) as TransactionCheckInput;
}
