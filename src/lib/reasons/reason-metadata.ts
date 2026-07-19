import { ReasonCode, DetectorName } from "../../types/detector";
import { REASON_CODES, StableReasonCode } from "./reason-codes";
import { PROTOTYPE_POLICY } from "../policy/prototype-policy";

/**
 * Metadata configuration structure for each stable reason.
 */
export interface ReasonMetadata {
  readonly code: ReasonCode;
  readonly sourceDetector: DetectorName | "system";
  readonly severityRange: {
    readonly min: number;
    readonly max: number;
  };
  readonly valueType: "string" | "number" | "boolean" | "none";
  readonly isConsumerDisplayable: boolean;
}

/**
 * Complete, static reason metadata catalog.
 * Keep sentence copy out of this file (mapped separately in translation/copy files).
 */
export const REASON_METADATA_CATALOG: Record<StableReasonCode, ReasonMetadata> = {
  // --- Transaction Behavior (Owned by "transaction") ---
  [REASON_CODES.TXN_AMOUNT_RATIO_HIGH]: {
    code: REASON_CODES.TXN_AMOUNT_RATIO_HIGH,
    sourceDetector: "transaction",
    severityRange: { min: 0.1, max: 0.8 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_AMOUNT_ZSCORE_HIGH]: {
    code: REASON_CODES.TXN_AMOUNT_ZSCORE_HIGH,
    sourceDetector: "transaction",
    severityRange: { min: 0.1, max: 0.9 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_NEW_PAYEE]: {
    code: REASON_CODES.TXN_NEW_PAYEE,
    sourceDetector: "transaction",
    severityRange: { min: 0.2, max: 0.5 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_HOUR_DEVIATION]: {
    code: REASON_CODES.TXN_HOUR_DEVIATION,
    sourceDetector: "transaction",
    severityRange: { min: 0.1, max: 0.6 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_VELOCITY_HIGH]: {
    code: REASON_CODES.TXN_VELOCITY_HIGH,
    sourceDetector: "transaction",
    severityRange: { min: 0.3, max: 0.9 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_FAILURES_COUNT_HIGH]: {
    code: REASON_CODES.TXN_FAILURES_COUNT_HIGH,
    sourceDetector: "transaction",
    severityRange: { min: 0.2, max: 0.7 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_INACTIVITY_RESUME]: {
    code: REASON_CODES.TXN_INACTIVITY_RESUME,
    sourceDetector: "transaction",
    severityRange: { min: 0.1, max: 0.5 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_DEVICE_CHANGE]: {
    code: REASON_CODES.TXN_DEVICE_CHANGE,
    sourceDetector: "transaction",
    severityRange: { min: 0.3, max: 0.8 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_LOCATION_CHANGE]: {
    code: REASON_CODES.TXN_LOCATION_CHANGE,
    sourceDetector: "transaction",
    severityRange: { min: 0.2, max: 0.7 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_COLLECT_REQUEST]: {
    code: REASON_CODES.TXN_COLLECT_REQUEST,
    sourceDetector: "transaction",
    severityRange: { min: 0.3, max: 0.7 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_REFUND_CONTEXT]: {
    code: REASON_CODES.TXN_REFUND_CONTEXT,
    sourceDetector: "transaction",
    severityRange: { min: 0.2, max: 0.6 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.TXN_NAME_MISMATCH]: {
    code: REASON_CODES.TXN_NAME_MISMATCH,
    sourceDetector: "transaction",
    severityRange: { min: 0.3, max: 0.8 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },

  // --- Scam Tactic (Owned by "message" / text) ---
  [REASON_CODES.SCAM_URGENCY]: {
    code: REASON_CODES.SCAM_URGENCY,
    sourceDetector: "message",
    severityRange: { min: 0.4, max: 0.9 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_AUTHORITY]: {
    code: REASON_CODES.SCAM_AUTHORITY,
    sourceDetector: "message",
    severityRange: { min: 0.5, max: 1.0 },
    valueType: "string",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_THREAT]: {
    code: REASON_CODES.SCAM_THREAT,
    sourceDetector: "message",
    severityRange: { min: 0.6, max: 1.0 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_SECRECY]: {
    code: REASON_CODES.SCAM_SECRECY,
    sourceDetector: "message",
    severityRange: { min: 0.4, max: 0.8 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_INVESTMENT]: {
    code: REASON_CODES.SCAM_INVESTMENT,
    sourceDetector: "message",
    severityRange: { min: 0.5, max: 1.0 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_REFUND_QR]: {
    code: REASON_CODES.SCAM_REFUND_QR,
    sourceDetector: "message",
    severityRange: { min: 0.5, max: 0.9 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_CREDENTIALS]: {
    code: REASON_CODES.SCAM_CREDENTIALS,
    sourceDetector: "message",
    severityRange: { min: 0.7, max: 1.0 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_REMOTE_ACCESS]: {
    code: REASON_CODES.SCAM_REMOTE_ACCESS,
    sourceDetector: "message",
    severityRange: { min: 0.6, max: 1.0 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.SCAM_RECOVERY_FEE]: {
    code: REASON_CODES.SCAM_RECOVERY_FEE,
    sourceDetector: "message",
    severityRange: { min: 0.4, max: 0.9 },
    valueType: "boolean",
    isConsumerDisplayable: true,
  },

  // --- Receiver Flow (Owned by "receiver" / graph) ---
  [REASON_CODES.RCV_UNIQUE_SENDERS_HIGH]: {
    code: REASON_CODES.RCV_UNIQUE_SENDERS_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.2, max: 0.8 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_UNIQUE_RECEIVERS_HIGH]: {
    code: REASON_CODES.RCV_UNIQUE_RECEIVERS_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.2, max: 0.8 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_INCOMING_VALUE_HIGH]: {
    code: REASON_CODES.RCV_INCOMING_VALUE_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.3, max: 0.9 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_OUTGOING_VALUE_HIGH]: {
    code: REASON_CODES.RCV_OUTGOING_VALUE_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.2, max: 0.8 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_PASS_THROUGH_RATIO_HIGH]: {
    code: REASON_CODES.RCV_PASS_THROUGH_RATIO_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.4, max: 0.9 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_SHORT_HOLDING_TIME]: {
    code: REASON_CODES.RCV_SHORT_HOLDING_TIME,
    sourceDetector: "receiver",
    severityRange: { min: 0.4, max: 0.9 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_BURST_RATIO_HIGH]: {
    code: REASON_CODES.RCV_BURST_RATIO_HIGH,
    sourceDetector: "receiver",
    severityRange: { min: 0.3, max: 0.8 },
    valueType: "number",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.RCV_NEW_ACCOUNT]: {
    code: REASON_CODES.RCV_NEW_ACCOUNT,
    sourceDetector: "receiver",
    severityRange: { min: 0.2, max: 0.6 },
    valueType: "number",
    isConsumerDisplayable: true,
  },

  // --- Missing/Degraded Signals (Owned by respective detectors) ---
  [REASON_CODES.SIG_TRANSACTION_UNAVAILABLE]: {
    code: REASON_CODES.SIG_TRANSACTION_UNAVAILABLE,
    sourceDetector: "transaction",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: false,
  },
  [REASON_CODES.SIG_TRANSACTION_DEGRADED]: {
    code: REASON_CODES.SIG_TRANSACTION_DEGRADED,
    sourceDetector: "transaction",
    severityRange: { min: 0.0, max: 0.2 },
    valueType: "string",
    isConsumerDisplayable: false,
  },
  [REASON_CODES.SIG_TEXT_UNAVAILABLE]: {
    code: REASON_CODES.SIG_TEXT_UNAVAILABLE,
    sourceDetector: "message",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: false,
  },
  [REASON_CODES.SIG_TEXT_DEGRADED]: {
    code: REASON_CODES.SIG_TEXT_DEGRADED,
    sourceDetector: "message",
    severityRange: { min: 0.0, max: 0.2 },
    valueType: "string",
    isConsumerDisplayable: false,
  },
  [REASON_CODES.SIG_GRAPH_UNAVAILABLE]: {
    code: REASON_CODES.SIG_GRAPH_UNAVAILABLE,
    sourceDetector: "receiver",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: false,
  },
  [REASON_CODES.SIG_GRAPH_DEGRADED]: {
    code: REASON_CODES.SIG_GRAPH_DEGRADED,
    sourceDetector: "receiver",
    severityRange: { min: 0.0, max: 0.2 },
    valueType: "string",
    isConsumerDisplayable: false,
  },

  // --- Policy Outcomes (Owned by system) ---
  [REASON_CODES.OUT_LOW_RISK]: {
    code: REASON_CODES.OUT_LOW_RISK,
    sourceDetector: "system",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.OUT_MEDIUM_RISK]: {
    code: REASON_CODES.OUT_MEDIUM_RISK,
    sourceDetector: "system",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.OUT_HIGH_RISK]: {
    code: REASON_CODES.OUT_HIGH_RISK,
    sourceDetector: "system",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: true,
  },
  [REASON_CODES.OUT_REVIEW_REQUIRED]: {
    code: REASON_CODES.OUT_REVIEW_REQUIRED,
    sourceDetector: "system",
    severityRange: { min: 0.0, max: 0.0 },
    valueType: "none",
    isConsumerDisplayable: true,
  },
};

/**
 * Display limits configured for reason filtering.
 */
export const DISPLAY_LIMITS = {
  maxDisplayedReasons: PROTOTYPE_POLICY.limits.maxDisplayedReasons,
} as const;

/**
 * Validates the integrity of the reason catalog.
 * Rejects duplicate reasons and unsupported detector ownerships.
 */
export function validateReasonCatalog(catalog: Record<StableReasonCode, ReasonMetadata>): void {
  const codesSeen = new Set<string>();
  const validDetectors = ["transaction", "message", "receiver", "system"];

  for (const [key, metadata] of Object.entries(catalog)) {
    // Check key matches code
    if (key !== metadata.code) {
      throw new Error(`Catalog key "${key}" does not match metadata code "${metadata.code}"`);
    }

    // Check for duplicates
    if (codesSeen.has(metadata.code)) {
      throw new Error(`Duplicate reason code detected in catalog: ${metadata.code}`);
    }
    codesSeen.add(metadata.code);

    // Reject unsupported detector ownership
    if (!validDetectors.includes(metadata.sourceDetector)) {
      throw new Error(
        `Unsupported detector ownership: "${metadata.sourceDetector}" for reason code ${metadata.code}`
      );
    }

    // Validate severity range ordering and limits
    const { min, max } = metadata.severityRange;
    if (
      !Number.isFinite(min) || min < 0 || min > 1 ||
      !Number.isFinite(max) || max < 0 || max > 1 ||
      min > max
    ) {
      throw new Error(`Invalid severity range [${min}, ${max}] for reason code ${metadata.code}`);
    }
  }

  // Verify completeness: all declared codes must have metadata
  for (const expectedCode of Object.values(REASON_CODES)) {
    if (!codesSeen.has(expectedCode)) {
      throw new Error(`Reason code "${expectedCode}" is missing metadata in the catalog`);
    }
  }
}

/**
 * Deterministically sorts, filters, and selects reasons displayable to the consumer.
 * 
 * Rules:
 * 1. Filter for isConsumerDisplayable = true.
 * 2. Sort by severity/contribution descending. If severity is not specified, 
 *    defaults to the minimum severity in the metadata.
 * 3. Tie-breaker: sort by ReasonCode alphabetically ascending.
 * 4. Return up to displayLimit (default 5).
 */
export function selectConsumerReasons(
  reasons: Array<{ readonly code: ReasonCode; readonly severity?: number }>,
  displayLimit = DISPLAY_LIMITS.maxDisplayedReasons
): ReasonCode[] {
  // 1. Filter displayable
  const displayable = reasons.filter((r) => {
    const meta = REASON_METADATA_CATALOG[r.code];
    return meta?.isConsumerDisplayable ?? false;
  });

  // 2. Sort deterministically
  const sorted = displayable.sort((a, b) => {
    const metaA = REASON_METADATA_CATALOG[a.code];
    const metaB = REASON_METADATA_CATALOG[b.code];

    const sevA = a.severity ?? metaA?.severityRange.min ?? 0;
    const sevB = b.severity ?? metaB?.severityRange.min ?? 0;

    if (Math.abs(sevB - sevA) > 1e-9) {
      return sevB - sevA; // Severity descending
    }
    // Alphabetical tie-break
    return a.code.localeCompare(b.code);
  });

  // 3. Limit output
  return sorted.slice(0, displayLimit).map((r) => r.code);
}

// Perform verification at module load time to guarantee safety
validateReasonCatalog(REASON_METADATA_CATALOG);
