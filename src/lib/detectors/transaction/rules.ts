/**
 * Transaction Risk Detector Rule Configuration & Thresholds
 * Aligned with Spec 19 (transaction-rules/v1)
 *
 * Keeps internal thresholds explicit for scoring while protecting sensitive
 * rule parameters from consumer-facing display copy.
 */

export const TRANSACTION_RULE_VERSION = "transaction-rules/v1";

export interface TransactionRuleThresholds {
  readonly amountRatio: {
    readonly moderate: number;
    readonly high: number;
    readonly extreme: number;
  };
  readonly amountZScore: {
    readonly moderate: number;
    readonly high: number;
    readonly extreme: number;
  };
  readonly newPayeeBaseRisk: number;
  readonly shortRelationshipDays: number;
  readonly establishedRelationshipDays: number;
  readonly recurringMitigationFactor: number;
  readonly hourDeviationHours: number;
  readonly velocity5mCount: number;
  readonly velocity30mCount: number;
  readonly velocity60mCount: number;
  readonly recentFailuresCount: number;
  readonly inactivityDays: number;
  readonly deviceChangeRisk: number;
  readonly locationChangeRisk: number;
  readonly collectRequestRisk: number;
  readonly refundContextRisk: number;
  readonly nameMismatchRisk: number;
}

export interface TransactionRuleConfig {
  readonly version: string;
  readonly thresholds: TransactionRuleThresholds;
  readonly weights: {
    readonly amountRatio: number;
    readonly amountZScore: number;
    readonly newPayee: number;
    readonly hourDeviation: number;
    readonly velocity: number;
    readonly failures: number;
    readonly inactivity: number;
    readonly deviceChange: number;
    readonly locationChange: number;
    readonly collectRequest: number;
    readonly refundContext: number;
    readonly nameMismatch: number;
  };
}

export const DEFAULT_TRANSACTION_RULES: TransactionRuleConfig = {
  version: TRANSACTION_RULE_VERSION,
  thresholds: {
    amountRatio: {
      moderate: 2.0,
      high: 4.0,
      extreme: 8.0,
    },
    amountZScore: {
      moderate: 2.0,
      high: 3.5,
      extreme: 5.0,
    },
    newPayeeBaseRisk: 0.25,
    shortRelationshipDays: 7,
    establishedRelationshipDays: 30,
    recurringMitigationFactor: 0.35,
    hourDeviationHours: 3.5,
    velocity5mCount: 2,
    velocity30mCount: 4,
    velocity60mCount: 6,
    recentFailuresCount: 2,
    inactivityDays: 30,
    deviceChangeRisk: 0.45,
    locationChangeRisk: 0.30,
    collectRequestRisk: 0.50,
    refundContextRisk: 0.40,
    nameMismatchRisk: 0.45,
  },
  weights: {
    amountRatio: 0.25,
    amountZScore: 0.25,
    newPayee: 0.20,
    hourDeviation: 0.15,
    velocity: 0.30,
    failures: 0.25,
    inactivity: 0.20,
    deviceChange: 0.35,
    locationChange: 0.20,
    collectRequest: 0.40,
    refundContext: 0.35,
    nameMismatch: 0.35,
  },
};

/**
 * Validates a TransactionRuleConfig object.
 * Enforces finite normalized risk values and weights, non-negative operational thresholds,
 * and ordered amount cutoffs. Throws an Error if validation fails.
 */
export function validateTransactionRuleConfig(config: TransactionRuleConfig): void {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid TransactionRuleConfig: Config must be an object");
  }

  if (config.version !== TRANSACTION_RULE_VERSION) {
    throw new Error(`Invalid TransactionRuleConfig: Unsupported rule version '${config.version}'`);
  }

  const { thresholds: t, weights: w } = config;

  if (!t || typeof t !== "object" || !w || typeof w !== "object") {
    throw new Error("Invalid TransactionRuleConfig: Missing thresholds or weights");
  }

  const isFiniteNum = (val: unknown): val is number => typeof val === "number" && Number.isFinite(val);
  const isNormalized = (val: unknown): val is number => isFiniteNum(val) && val >= 0.0 && val <= 1.0;
  const isNonNegative = (val: unknown): val is number => isFiniteNum(val) && val >= 0;

  // Validate weights across all 12 declared weight keys
  const declaredWeightKeys: Array<keyof TransactionRuleConfig["weights"]> = [
    "amountRatio",
    "amountZScore",
    "newPayee",
    "hourDeviation",
    "velocity",
    "failures",
    "inactivity",
    "deviceChange",
    "locationChange",
    "collectRequest",
    "refundContext",
    "nameMismatch",
  ];

  for (const key of declaredWeightKeys) {
    const val = w[key];
    if (!isNormalized(val)) {
      throw new Error(`Invalid TransactionRuleConfig: Weight '${key}' must be a finite number between 0.0 and 1.0`);
    }
  }

  // Validate risk values in thresholds
  const normalizedRiskKeys: Array<keyof TransactionRuleThresholds> = [
    "newPayeeBaseRisk",
    "recurringMitigationFactor",
    "deviceChangeRisk",
    "locationChangeRisk",
    "collectRequestRisk",
    "refundContextRisk",
    "nameMismatchRisk",
  ];
  for (const key of normalizedRiskKeys) {
    if (!isNormalized(t[key])) {
      throw new Error(`Invalid TransactionRuleConfig: Threshold risk '${key}' must be a finite number between 0.0 and 1.0`);
    }
  }

  // Validate operational thresholds
  const nonNegativeThresholdKeys: Array<keyof TransactionRuleThresholds> = [
    "shortRelationshipDays",
    "establishedRelationshipDays",
    "hourDeviationHours",
    "velocity5mCount",
    "velocity30mCount",
    "velocity60mCount",
    "recentFailuresCount",
    "inactivityDays",
  ];
  for (const key of nonNegativeThresholdKeys) {
    if (!isNonNegative(t[key])) {
      throw new Error(`Invalid TransactionRuleConfig: Operational threshold '${key}' must be a finite non-negative number`);
    }
  }

  // Validate ordered amount cutoffs
  if (
    !t.amountRatio ||
    !isNonNegative(t.amountRatio.moderate) ||
    !isNonNegative(t.amountRatio.high) ||
    !isNonNegative(t.amountRatio.extreme) ||
    !(t.amountRatio.moderate <= t.amountRatio.high && t.amountRatio.high <= t.amountRatio.extreme)
  ) {
    throw new Error(
      "Invalid TransactionRuleConfig: amountRatio cutoffs must be finite non-negative numbers ordered moderate <= high <= extreme"
    );
  }

  if (
    !t.amountZScore ||
    !isFiniteNum(t.amountZScore.moderate) ||
    !isFiniteNum(t.amountZScore.high) ||
    !isFiniteNum(t.amountZScore.extreme) ||
    !(t.amountZScore.moderate <= t.amountZScore.high && t.amountZScore.high <= t.amountZScore.extreme)
  ) {
    throw new Error(
      "Invalid TransactionRuleConfig: amountZScore cutoffs must be finite numbers ordered moderate <= high <= extreme"
    );
  }
}
