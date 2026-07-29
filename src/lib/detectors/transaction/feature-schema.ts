/**
 * Transaction Point-in-Time Feature Schema & Metadata Definitions
 * Aligned with Spec 18 (feature-contract/v1)
 */

import { FEATURE_VERSION } from "@/lib/contracts/versions";
import type { TransactionFeatures } from "@/types/transaction";

export const TRANSACTION_FEATURE_VERSION = FEATURE_VERSION;

export type FeatureSource =
  | "transaction_request"
  | "sender_prior_history"
  | "receiver_relationship"
  | "device_context"
  | "scenario_context";

export type FeatureDataType = "number" | "boolean" | "integer";

export type FeatureCalculationWindow =
  | "none"
  | "5m"
  | "30m"
  | "60m"
  | "30d"
  | "lifetime";

export type UnavailableBehavior =
  | "use_default_and_flag_quality"
  | "pass_request_value"
  | "mark_unavailable";

export interface TransactionFeatureDefinition {
  readonly name: keyof TransactionFeatures;
  readonly description: string;
  readonly source: FeatureSource;
  readonly dataType: FeatureDataType;
  readonly window: FeatureCalculationWindow;
  readonly defaultValue: number | boolean;
  readonly unavailableBehavior: UnavailableBehavior;
  readonly leakageNote: string;
}

export const TRANSACTION_FEATURE_CATALOG: Record<
  keyof TransactionFeatures,
  TransactionFeatureDefinition
> = {
  amountRatio: {
    name: "amountRatio",
    description: "Ratio of current transaction amount to sender's prior median transaction amount",
    source: "sender_prior_history",
    dataType: "number",
    window: "lifetime",
    defaultValue: 1.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strictly excludes transactions with timestamp >= decision timestamp.",
  },
  amountZScore: {
    name: "amountZScore",
    description: "Robust deviation (MAD z-score) of current amount from sender's prior distribution",
    source: "sender_prior_history",
    dataType: "number",
    window: "lifetime",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Requires at least 2 prior transactions. Strictly excludes current payment.",
  },
  isNewPayee: {
    name: "isNewPayee",
    description: "Boolean indicating if sender has no prior transaction to this receiver",
    source: "receiver_relationship",
    dataType: "boolean",
    window: "lifetime",
    defaultValue: true,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Checked strictly prior to decision timestamp.",
  },
  relationshipAgeDays: {
    name: "relationshipAgeDays",
    description: "Days elapsed since earliest prior transaction between sender and receiver",
    source: "receiver_relationship",
    dataType: "integer",
    window: "lifetime",
    defaultValue: 0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Calculated from first transaction timestamp prior to decision timestamp.",
  },
  isKnownRecurring: {
    name: "isKnownRecurring",
    description: "Boolean indicating if payment matches historical periodic/recurring pattern to payee",
    source: "receiver_relationship",
    dataType: "boolean",
    window: "lifetime",
    defaultValue: false,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Evaluates prior amounts and monthly/weekly intervals strictly before current time.",
  },
  hourDeviation: {
    name: "hourDeviation",
    description: "Absolute hour deviation between current IST time and sender's historical active hours",
    source: "sender_prior_history",
    dataType: "number",
    window: "lifetime",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Uses Asia/Kolkata timezone strictly on prior events.",
  },
  velocityCount5m: {
    name: "velocityCount5m",
    description: "Sender attempt count in prior 5-minute window [t - 5m, t)",
    source: "sender_prior_history",
    dataType: "integer",
    window: "5m",
    defaultValue: 0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 5m, t). Excludes events at or after decision timestamp.",
  },
  velocityValue5m: {
    name: "velocityValue5m",
    description: "Sender total attempted value in prior 5-minute window [t - 5m, t)",
    source: "sender_prior_history",
    dataType: "number",
    window: "5m",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 5m, t). Excludes current transaction.",
  },
  velocityCount30m: {
    name: "velocityCount30m",
    description: "Sender attempt count in prior 30-minute window [t - 30m, t)",
    source: "sender_prior_history",
    dataType: "integer",
    window: "30m",
    defaultValue: 0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 30m, t).",
  },
  velocityValue30m: {
    name: "velocityValue30m",
    description: "Sender total attempted value in prior 30-minute window [t - 30m, t)",
    source: "sender_prior_history",
    dataType: "number",
    window: "30m",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 30m, t).",
  },
  velocityCount60m: {
    name: "velocityCount60m",
    description: "Sender attempt count in prior 60-minute window [t - 60m, t)",
    source: "sender_prior_history",
    dataType: "integer",
    window: "60m",
    defaultValue: 0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 60m, t).",
  },
  velocityValue60m: {
    name: "velocityValue60m",
    description: "Sender total attempted value in prior 60-minute window [t - 60m, t)",
    source: "sender_prior_history",
    dataType: "number",
    window: "60m",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Strict cutoff: [t - 60m, t).",
  },
  recentFailuresCount: {
    name: "recentFailuresCount",
    description: "Count of recent failed transaction attempts by sender",
    source: "sender_prior_history",
    dataType: "integer",
    window: "60m",
    defaultValue: 0,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Derived from prior history or request input context.",
  },
  inactivityDays: {
    name: "inactivityDays",
    description: "Days elapsed since sender's most recent prior transaction",
    source: "sender_prior_history",
    dataType: "number",
    window: "lifetime",
    defaultValue: 0.0,
    unavailableBehavior: "use_default_and_flag_quality",
    leakageNote: "Calculated relative to latest prior transaction strictly before decision time.",
  },
  hasDeviceChange: {
    name: "hasDeviceChange",
    description: "Flag indicating payment is from a new or unrecognised device",
    source: "device_context",
    dataType: "boolean",
    window: "none",
    defaultValue: false,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Supplied directly by request or derived by comparing request device to prior history.",
  },
  hasLocationChange: {
    name: "hasLocationChange",
    description: "Flag indicating payment originates from an unusual location/region",
    source: "device_context",
    dataType: "boolean",
    window: "none",
    defaultValue: false,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Supplied directly by request contract.",
  },
  isCollectRequest: {
    name: "isCollectRequest",
    description: "Flag indicating payment was initiated via collect request / pull transaction",
    source: "transaction_request",
    dataType: "boolean",
    window: "none",
    defaultValue: false,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Supplied by request contract.",
  },
  hasRefundContext: {
    name: "hasRefundContext",
    description: "Flag indicating payment is framed as a refund or cash-back claim",
    source: "transaction_request",
    dataType: "boolean",
    window: "none",
    defaultValue: false,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Supplied by request contract / note context.",
  },
  nameMismatch: {
    name: "nameMismatch",
    description: "Flag indicating mismatch between display payee name and verified bank name",
    source: "transaction_request",
    dataType: "boolean",
    window: "none",
    defaultValue: false,
    unavailableBehavior: "pass_request_value",
    leakageNote: "Supplied by request contract.",
  },
};

export interface TransactionFeatureQuality {
  readonly featureVersion: string;
  readonly evaluatedAt: string;
  readonly historyEventCount: number;
  readonly senderPriorEventCount: number;
  readonly receiverPriorEventCount: number;
  readonly isSparseHistory: boolean;
  readonly qualityFlags: readonly string[];
}
