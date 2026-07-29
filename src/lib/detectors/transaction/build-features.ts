/**
 * Pure Domain Transaction Point-in-Time Feature Builder
 * Implements Spec 18 requirements & feature-contract/v1
 */

import { FEATURE_VERSION } from "@/lib/contracts/versions";
import type { TransactionFeatures } from "@/types/transaction";
import {
  HistoricalTransaction,
  validateAndSortHistory,
  filterWindow,
  getSenderHistory,
  getSenderReceiverHistory,
} from "./history-windows";
import { TransactionFeatureQuality } from "./feature-schema";

export const RECURRING_NOTE_KEYWORDS = [
  "rent",
  "bill",
  "subscription",
  "sip",
  "salary",
] as const;

const RECURRING_NOTE_REGEX = new RegExp(
  `\\b(${RECURRING_NOTE_KEYWORDS.join("|")})\\b`,
  "i"
);

export function isRecurringNote(note?: string): boolean {
  if (!note || note.trim() === "") return false;
  return RECURRING_NOTE_REGEX.test(note);
}

export interface TransactionFeatureBuildOptions {
  readonly recentFailuresCount?: number;
  readonly hasDeviceChange?: boolean;
  readonly hasLocationChange?: boolean;
  readonly isCollectRequest?: boolean;
  readonly hasRefundContext?: boolean;
  readonly nameMismatch?: boolean;
}

export interface TransactionFeatureInput {
  readonly amount: number;
  readonly timestamp: string;
  readonly senderId: string;
  readonly receiverId: string;
  readonly paymentType?: string;
  readonly device?: string;
  readonly region?: string;
  readonly note?: string;
}

export interface TransactionFeatureBuildResult {
  readonly features: TransactionFeatures;
  readonly metadata: TransactionFeatureQuality;
}

/**
 * Utility to compute median of a numeric array
 */
function calculateMedian(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculates IST (Asia/Kolkata) hour (0-23) for a given ISO timestamp string
 */
export function getIstHour(isoTimestamp: string): number {
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO timestamp: ${isoTimestamp}`);
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  return hour % 24;
}

/**
 * Computes shortest circular hour distance between two hours (0-23)
 */
export function calculateCircularHourDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 24 - diff);
}

/**
 * Checks if two timestamps represent a valid weekly (5-9 days) or monthly (25-35 days) interval
 */
function hasValidPeriodicity(t1Iso: string, t2Iso: string): boolean {
  const ms1 = Date.parse(t1Iso);
  const ms2 = Date.parse(t2Iso);
  if (isNaN(ms1) || isNaN(ms2)) return false;
  const days = Math.abs(ms1 - ms2) / (1000 * 60 * 60 * 24);
  const isWeekly = days >= 5 && days <= 9;
  const isMonthly = days >= 25 && days <= 35;
  return isWeekly || isMonthly;
}

/**
 * Determines if a transaction is part of a recurring payment pattern to payee
 */
function detectRecurringPattern(
  currentAmount: number,
  payeeHistory: readonly HistoricalTransaction[],
  decisionTimestamp?: string,
  currentNote?: string
): boolean {
  if (payeeHistory.length === 0) return false;

  // Filter qualifying completed prior transactions matching amount within 5% tolerance
  // Excludes both failed and reversed transactions consistently
  const matchingTxns = payeeHistory.filter((tx) => {
    if (tx.status === "failed" || tx.status === "reversed") return false;
    const diffRatio = Math.abs(tx.amount - currentAmount) / Math.max(1, currentAmount);
    return diffRatio <= 0.05;
  });

  if (matchingTxns.length === 0) return false;

  // Require matching amount-similar qualifying history before note-based or periodicity checks apply
  if (isRecurringNote(currentNote) || matchingTxns.some((tx) => isRecurringNote(tx.note))) {
    return true;
  }

  // Check periodicity: either interval between matching txns or to decisionTimestamp
  if (decisionTimestamp) {
    for (const tx of matchingTxns) {
      if (hasValidPeriodicity(tx.timestamp, decisionTimestamp)) {
        return true;
      }
    }
  }

  for (let i = 0; i < matchingTxns.length; i++) {
    for (let j = i + 1; j < matchingTxns.length; j++) {
      if (hasValidPeriodicity(matchingTxns[i].timestamp, matchingTxns[j].timestamp)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Builds point-in-time features for a payment decision strictly using information available
 * prior to decision timestamp.
 */
export function buildTransactionFeatures(
  input: TransactionFeatureInput,
  history: readonly HistoricalTransaction[] = [],
  options?: TransactionFeatureBuildOptions
): TransactionFeatureBuildResult {
  // Validate current transaction input
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error(`Invalid payment amount: ${input.amount}`);
  }
  const decisionMs = Date.parse(input.timestamp);
  if (isNaN(decisionMs)) {
    throw new Error(`Invalid decision timestamp: ${input.timestamp}`);
  }
  if (!input.senderId || typeof input.senderId !== "string" || input.senderId.trim() === "") {
    throw new Error("Missing valid senderId in payment input.");
  }
  if (!input.receiverId || typeof input.receiverId !== "string" || input.receiverId.trim() === "") {
    throw new Error("Missing valid receiverId in payment input.");
  }

  // 1. Process prior history (Strict Point-in-Time filtering: excludes txMs >= decisionMs)
  const validHistory = validateAndSortHistory(history, input.timestamp);
  const senderHistory = getSenderHistory(validHistory, input.senderId);
  const senderReceiverHistory = getSenderReceiverHistory(validHistory, input.senderId, input.receiverId);

  // 2. Sender Amount Median & Robust Deviation (MAD Z-Score)
  const completedSenderTxns = senderHistory.filter(
    (tx) => tx.status !== "failed" && tx.status !== "reversed"
  );
  const senderAmounts = completedSenderTxns.map((tx) => tx.amount);

  let amountRatio = 1.0;
  let amountZScore = 0.0;
  let hasZeroDispersion = false;

  if (senderAmounts.length > 0) {
    const medianAmount = calculateMedian(senderAmounts);
    amountRatio = input.amount / Math.max(1, medianAmount);

    // MAD calculation: Median Absolute Deviation
    const absoluteDeviations = senderAmounts.map((amt) => Math.abs(amt - medianAmount));
    const mad = calculateMedian(absoluteDeviations);

    if (mad > 0) {
      // Robust standard deviation estimation using MAD (normal distribution factor ~1.4826)
      const robustStd = mad * 1.4826;
      amountZScore = (input.amount - medianAmount) / robustStd;
    } else {
      // Fallback to standard deviation if MAD is 0
      const mean = senderAmounts.reduce((sum, a) => sum + a, 0) / senderAmounts.length;
      const variance =
        senderAmounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / senderAmounts.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        amountZScore = (input.amount - mean) / stdDev;
      } else {
        // Zero dispersion in history (MAD and stdDev are 0)
        hasZeroDispersion = true;
        if (input.amount === medianAmount) {
          amountZScore = 0.0;
        } else {
          const relativeDiff = (input.amount - medianAmount) / Math.max(1, medianAmount);
          amountZScore = Math.sign(relativeDiff) * Math.min(10, Math.abs(relativeDiff));
        }
      }
    }
  }

  // 3. New Payee, Relationship Age, and Recurring Similarity
  const isNewPayee = senderReceiverHistory.length === 0;
  let relationshipAgeDays = 0;
  if (!isNewPayee) {
    const earliestMs = Date.parse(senderReceiverHistory[0].timestamp);
    relationshipAgeDays = Math.max(0, Math.floor((decisionMs - earliestMs) / (1000 * 60 * 60 * 24)));
  }

  // Check recurring payment similarity (e.g. rent, bills)
  const isKnownRecurring = detectRecurringPattern(
    input.amount,
    senderReceiverHistory,
    input.timestamp,
    input.note
  );

  // 4. Active IST Hour Deviation
  const currentIstHour = getIstHour(input.timestamp);
  let hourDeviation = 0.0;

  if (senderHistory.length > 0) {
    const priorHours = senderHistory.map((tx) => getIstHour(tx.timestamp));
    // Calculate distance to closest historical active hour
    const distances = priorHours.map((h) => calculateCircularHourDistance(currentIstHour, h));
    hourDeviation = Math.min(...distances);
  }

  // 5. Velocity Windows (5m, 30m, 60m) - strictly prior to decision timestamp
  const win5m = filterWindow(senderHistory, input.timestamp, 5);
  const velocityCount5m = win5m.length;
  const velocityValue5m = win5m.reduce((sum, tx) => sum + tx.amount, 0);

  const win30m = filterWindow(senderHistory, input.timestamp, 30);
  const velocityCount30m = win30m.length;
  const velocityValue30m = win30m.reduce((sum, tx) => sum + tx.amount, 0);

  const win60m = filterWindow(senderHistory, input.timestamp, 60);
  const velocityCount60m = win60m.length;
  const velocityValue60m = win60m.reduce((sum, tx) => sum + tx.amount, 0);

  // 6. Recent Failures & Inactivity Days
  const historyFailuresCount = win60m.filter((tx) => tx.status === "failed").length;
  const recentFailuresCount = options?.recentFailuresCount ?? historyFailuresCount;

  let inactivityDays = 0.0;
  if (senderHistory.length > 0) {
    const latestPriorMs = Date.parse(senderHistory[senderHistory.length - 1].timestamp);
    inactivityDays = Math.max(0, (decisionMs - latestPriorMs) / (1000 * 60 * 60 * 24));
  }

  // 7. Contextual Device / Location / Collect / Refund / Mismatch Flags
  let hasDeviceChange = options?.hasDeviceChange ?? false;
  if (options?.hasDeviceChange === undefined && input.device && senderHistory.length > 0) {
    const priorDevices = new Set(senderHistory.map((tx) => tx.device).filter(Boolean));
    if (priorDevices.size > 0 && !priorDevices.has(input.device)) {
      hasDeviceChange = true;
    }
  }

  const hasLocationChange = options?.hasLocationChange ?? false;
  const isCollectRequest = options?.isCollectRequest ?? false;
  const noteText = (input.note || "").toLowerCase();
  const hasRefundContext =
    options?.hasRefundContext ?? (noteText.includes("refund") || noteText.includes("cashback"));
  const nameMismatch = options?.nameMismatch ?? false;

  // 8. Quality Metadata
  const qualityFlags: string[] = [];
  if (senderHistory.length === 0) qualityFlags.push("no_prior_sender_history");
  if (senderHistory.length > 0 && senderHistory.length < 3) qualityFlags.push("sparse_sender_history");
  if (isNewPayee) qualityFlags.push("new_payee_relationship");
  if (hasZeroDispersion) qualityFlags.push("zero_dispersion_amount_history");

  const metadata: TransactionFeatureQuality = {
    featureVersion: FEATURE_VERSION,
    evaluatedAt: input.timestamp,
    historyEventCount: validHistory.length,
    senderPriorEventCount: senderHistory.length,
    receiverPriorEventCount: senderReceiverHistory.length,
    isSparseHistory: senderHistory.length < 3,
    qualityFlags,
  };

  // 9. Feature Object (Pure features, keeping raw IDs out of the return object)
  const features: TransactionFeatures = {
    amountRatio,
    amountZScore,
    isNewPayee,
    relationshipAgeDays,
    isKnownRecurring,
    hourDeviation,
    velocityCount5m,
    velocityValue5m,
    velocityCount30m,
    velocityValue30m,
    velocityCount60m,
    velocityValue60m,
    recentFailuresCount,
    inactivityDays,
    hasDeviceChange,
    hasLocationChange,
    isCollectRequest,
    hasRefundContext,
    nameMismatch,
  };

  return { features, metadata };
}
