import { POLICY_VERSION } from "../contracts/versions";
import { DetectorName } from "../../types/detector";
import { RiskBand, RecommendedAction } from "../../types/risk";

/**
 * Action policy structure for a given risk state.
 */
export interface ActionPolicy {
  readonly recommendedAction: RecommendedAction;
  readonly requiresExplicitConfirmation: boolean;
  readonly allowCancellation: boolean;
  readonly offerReportingSupport: boolean;
}

/**
 * Trigger thresholds for entering degraded/review states.
 */
export interface ReviewTriggers {
  readonly minCoverage: number; // 0.45
  readonly noSignals: boolean;
  readonly detectorTimeout: boolean;
  readonly detectorFailure: boolean;
  readonly minConfidence: number; // e.g. 0.50 (insufficient confidence if below this)
}

/**
 * Versioned prototype policy configuration interface.
 */
export interface PolicyConfig {
  readonly version: typeof POLICY_VERSION;
  readonly weights: Record<DetectorName, number>;
  readonly thresholds: {
    readonly lowMax: number;    // Boundary between Low and Medium
    readonly mediumMax: number; // Boundary between Medium and High
  };
  readonly triggers: ReviewTriggers;
  readonly limits: {
    readonly maxDisplayedReasons: number;
  };
  readonly actions: Record<RiskBand, ActionPolicy>;
}

/**
 * The single versioned prototype policy configuration.
 */
export const PROTOTYPE_POLICY: PolicyConfig = {
  version: POLICY_VERSION,
  weights: {
    transaction: 0.45,
    message: 0.30,
    receiver: 0.25,
  },
  thresholds: {
    lowMax: 0.40,
    mediumMax: 0.70,
  },
  triggers: {
    minCoverage: 0.45,
    noSignals: true,
    detectorTimeout: true,
    detectorFailure: true,
    minConfidence: 0.50,
  },
  limits: {
    maxDisplayedReasons: 5,
  },
  actions: {
    low: {
      recommendedAction: "allow",
      requiresExplicitConfirmation: false,
      allowCancellation: true,
      offerReportingSupport: false,
    },
    medium: {
      recommendedAction: "verify",
      requiresExplicitConfirmation: true,
      allowCancellation: true,
      offerReportingSupport: true,
    },
    high: {
      recommendedAction: "interrupt",
      requiresExplicitConfirmation: true,
      allowCancellation: true,
      offerReportingSupport: true,
    },
    review: {
      recommendedAction: "review",
      requiresExplicitConfirmation: true,
      allowCancellation: true,
      offerReportingSupport: true,
    },
  },
} as const;

/**
 * Validates the invariants of a PolicyConfig object.
 * Throws an Error if any invariant fails.
 */
export function validatePolicy(policy: PolicyConfig): void {
  // 1. Invariants on weights (finite, non-negative, total 1.0)
  const weights = policy.weights;
  let totalWeight = 0;
  const detectorKeys: DetectorName[] = ["transaction", "message", "receiver"];

  for (const detector of detectorKeys) {
    const w = weights[detector];
    if (w === undefined) {
      throw new Error(`Weight for detector "${detector}" is missing`);
    }
    if (!Number.isFinite(w) || w < 0) {
      throw new Error(`Weight for detector "${detector}" must be a finite, non-negative number`);
    }
    totalWeight += w;
  }

  if (Math.abs(totalWeight - 1.0) > 1e-9) {
    throw new Error(`Total weights must sum to exactly 1.0 (got ${totalWeight})`);
  }

  // 2. Invariants on thresholds (ordered, cover all valid scores [0, 1])
  const { lowMax, mediumMax } = policy.thresholds;
  if (!Number.isFinite(lowMax) || lowMax < 0 || lowMax > 1) {
    throw new Error("Threshold lowMax must be a finite number between 0 and 1");
  }
  if (!Number.isFinite(mediumMax) || mediumMax < 0 || mediumMax > 1) {
    throw new Error("Threshold mediumMax must be a finite number between 0 and 1");
  }
  if (lowMax >= mediumMax) {
    throw new Error("Threshold lowMax must be strictly less than mediumMax");
  }

  // 3. Triggers validation
  const { minCoverage, minConfidence } = policy.triggers;
  if (!Number.isFinite(minCoverage) || minCoverage < 0 || minCoverage > 1) {
    throw new Error("Trigger minCoverage must be a finite number between 0 and 1");
  }
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
    throw new Error("Trigger minConfidence must be a finite number between 0 and 1");
  }
}

// Perform validation at module load time to guarantee safety
validatePolicy(PROTOTYPE_POLICY);
