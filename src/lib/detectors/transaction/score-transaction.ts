/**
 * Transaction Risk Scoring Engine
 * Aligned with Spec 19 requirements & DetectorResult contract
 */

import { TransactionFeatures } from "@/types/transaction";
import { DetectorReason } from "@/types/detector";
import { REASON_CODES } from "@/lib/reasons/reason-codes";
import { NormalizedScore } from "@/lib/contracts/primitives";
import {
  TransactionRuleConfig,
  DEFAULT_TRANSACTION_RULES,
  validateTransactionRuleConfig,
} from "./rules";

export interface TransactionScoringResult {
  readonly score: NormalizedScore;
  readonly confidence: NormalizedScore;
  readonly reasons: DetectorReason[];
}

/**
 * Utility to clamp a numeric value to [min, max]
 */
function clamp(val: number, min = 0.0, max = 1.0): number {
  if (isNaN(val) || !Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

/**
 * Scores observable transaction signals, applies legitimate context mitigations,
 * deduplicates closely related reasons, and returns clamped score, confidence, and reasons.
 */
export function scoreTransaction(
  features: TransactionFeatures,
  config: TransactionRuleConfig = DEFAULT_TRANSACTION_RULES
): TransactionScoringResult {
  validateTransactionRuleConfig(config);

  const t = config.thresholds;
  const w = config.weights;

  const reasons: DetectorReason[] = [];
  const activeContributions: Array<{ severity: number; weight: number }> = [];

  // 1. Amount Ratio Risk (TXN_AMOUNT_RATIO_HIGH)
  if (features.amountRatio >= t.amountRatio.moderate) {
    let rawSeverity = 0.2;
    if (features.amountRatio >= t.amountRatio.extreme) {
      rawSeverity = 0.85 + Math.min(0.15, (features.amountRatio - t.amountRatio.extreme) * 0.01);
    } else if (features.amountRatio >= t.amountRatio.high) {
      rawSeverity = 0.55 + ((features.amountRatio - t.amountRatio.high) / (t.amountRatio.extreme - t.amountRatio.high)) * 0.3;
    } else {
      rawSeverity = 0.20 + ((features.amountRatio - t.amountRatio.moderate) / (t.amountRatio.high - t.amountRatio.moderate)) * 0.35;
    }

    // Apply legitimate recurring payment mitigation (e.g. recurring rent/bills)
    if (features.isKnownRecurring) {
      rawSeverity *= t.recurringMitigationFactor;
    }

    const severity = clamp(rawSeverity, 0.1, 0.95) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_AMOUNT_RATIO_HIGH,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: Math.round(features.amountRatio * 100) / 100,
    });
    activeContributions.push({ severity, weight: w.amountRatio });
  }

  // 2. Amount Z-Score Risk (TXN_AMOUNT_ZSCORE_HIGH)
  if (features.amountZScore >= t.amountZScore.moderate) {
    let rawSeverity = 0.2;
    if (features.amountZScore >= t.amountZScore.extreme) {
      rawSeverity = 0.85 + Math.min(0.15, (features.amountZScore - t.amountZScore.extreme) * 0.02);
    } else if (features.amountZScore >= t.amountZScore.high) {
      rawSeverity = 0.55 + ((features.amountZScore - t.amountZScore.high) / (t.amountZScore.extreme - t.amountZScore.high)) * 0.3;
    } else {
      rawSeverity = 0.20 + ((features.amountZScore - t.amountZScore.moderate) / (t.amountZScore.high - t.amountZScore.moderate)) * 0.35;
    }

    // Apply legitimate recurring payment mitigation
    if (features.isKnownRecurring) {
      rawSeverity *= t.recurringMitigationFactor;
    }

    const severity = clamp(rawSeverity, 0.1, 0.95) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_AMOUNT_ZSCORE_HIGH,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: Math.round(features.amountZScore * 100) / 100,
    });
    activeContributions.push({ severity, weight: w.amountZScore });
  }

  // 3. New Payee Risk (TXN_NEW_PAYEE)
  if (features.isNewPayee) {
    const severity = clamp(t.newPayeeBaseRisk + (features.relationshipAgeDays === 0 ? 0.15 : 0.0), 0.1, 0.9) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_NEW_PAYEE,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.newPayee });
  } else if (features.relationshipAgeDays < t.shortRelationshipDays) {
    const severity = 0.20 as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_NEW_PAYEE,
      severity,
      value: features.relationshipAgeDays,
    });
    activeContributions.push({ severity, weight: w.newPayee * 0.5 });
  }

  // 4. Hour Deviation Risk (TXN_HOUR_DEVIATION)
  if (features.hourDeviation >= t.hourDeviationHours) {
    let rawSeverity = 0.25 + Math.min(0.45, (features.hourDeviation - t.hourDeviationHours) * 0.1);
    // Mitigate hour deviation if payee relationship is established
    if (!features.isNewPayee && features.relationshipAgeDays >= t.establishedRelationshipDays) {
      rawSeverity *= 0.6;
    }
    const severity = clamp(rawSeverity, 0.1, 0.85) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_HOUR_DEVIATION,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: Math.round(features.hourDeviation * 10) / 10,
    });
    activeContributions.push({ severity, weight: w.hourDeviation });
  }

  // 5. Velocity Risk (TXN_VELOCITY_HIGH) - Deduplicated across 5m, 30m, 60m
  let topVelocitySeverity = 0;
  let topVelocityValue = 0;

  if (features.velocityCount5m >= t.velocity5mCount) {
    const sev = clamp(0.40 + (features.velocityCount5m - t.velocity5mCount) * 0.15, 0.4, 0.95);
    if (sev > topVelocitySeverity) {
      topVelocitySeverity = sev;
      topVelocityValue = features.velocityCount5m;
    }
  }
  if (features.velocityCount30m >= t.velocity30mCount) {
    const sev = clamp(0.35 + (features.velocityCount30m - t.velocity30mCount) * 0.10, 0.35, 0.90);
    if (sev > topVelocitySeverity) {
      topVelocitySeverity = sev;
      topVelocityValue = features.velocityCount30m;
    }
  }
  if (features.velocityCount60m >= t.velocity60mCount) {
    const sev = clamp(0.30 + (features.velocityCount60m - t.velocity60mCount) * 0.08, 0.30, 0.85);
    if (sev > topVelocitySeverity) {
      topVelocitySeverity = sev;
      topVelocityValue = features.velocityCount60m;
    }
  }

  if (topVelocitySeverity >= 0.2) {
    const severity = Math.round(topVelocitySeverity * 1000) / 1000 as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_VELOCITY_HIGH,
      severity,
      value: topVelocityValue,
    });
    activeContributions.push({ severity: topVelocitySeverity, weight: w.velocity });
  }

  // 6. Recent Failures Risk (TXN_FAILURES_COUNT_HIGH)
  if (features.recentFailuresCount >= t.recentFailuresCount) {
    const severity = clamp(
      0.30 + (features.recentFailuresCount - t.recentFailuresCount) * 0.15,
      0.3,
      0.85
    ) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_FAILURES_COUNT_HIGH,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: features.recentFailuresCount,
    });
    activeContributions.push({ severity, weight: w.failures });
  }

  // 7. Inactivity Resume Risk (TXN_INACTIVITY_RESUME)
  if (features.inactivityDays >= t.inactivityDays) {
    const severity = clamp(
      0.25 + Math.min(0.45, (features.inactivityDays - t.inactivityDays) * 0.005),
      0.25,
      0.75
    ) as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_INACTIVITY_RESUME,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: Math.round(features.inactivityDays),
    });
    activeContributions.push({ severity, weight: w.inactivity });
  }

  // 8. Device Change Risk (TXN_DEVICE_CHANGE)
  if (features.hasDeviceChange) {
    const severity = t.deviceChangeRisk as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_DEVICE_CHANGE,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.deviceChange });
  }

  // 9. Location Change Risk (TXN_LOCATION_CHANGE)
  if (features.hasLocationChange) {
    const severity = t.locationChangeRisk as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_LOCATION_CHANGE,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.locationChange });
  }

  // 10. Collect Request Risk (TXN_COLLECT_REQUEST)
  if (features.isCollectRequest) {
    const severity = t.collectRequestRisk as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_COLLECT_REQUEST,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.collectRequest });
  }

  // 11. Refund Context Risk (TXN_REFUND_CONTEXT)
  if (features.hasRefundContext) {
    const severity = t.refundContextRisk as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_REFUND_CONTEXT,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.refundContext });
  }

  // 12. Name Mismatch Risk (TXN_NAME_MISMATCH)
  if (features.nameMismatch) {
    const severity = t.nameMismatchRisk as NormalizedScore;
    reasons.push({
      code: REASON_CODES.TXN_NAME_MISMATCH,
      severity: Math.round(severity * 1000) / 1000 as NormalizedScore,
      value: true,
    });
    activeContributions.push({ severity, weight: w.nameMismatch });
  }

  // Calculate composite risk score using non-linear noisy-OR combination
  let rawScore = 0;
  if (activeContributions.length > 0) {
    let unrisk = 1.0;
    for (const c of activeContributions) {
      unrisk *= 1.0 - c.severity * c.weight;
    }
    rawScore = clamp(1.0 - unrisk, 0.0, 1.0);
  }

  const score = (Math.round(rawScore * 10000) / 10000) as NormalizedScore;

  // Calculate confidence score based on feature quality and signal clarity
  let baseConfidence = 0.85;
  if (features.isNewPayee) baseConfidence -= 0.05;
  if (features.hasDeviceChange || features.hasLocationChange) baseConfidence -= 0.05;
  if (features.isKnownRecurring) baseConfidence += 0.05;
  if (!features.isNewPayee && features.relationshipAgeDays >= t.establishedRelationshipDays) {
    baseConfidence += 0.05;
  }
  const confidence = (Math.round(clamp(baseConfidence, 0.4, 0.98) * 10000) / 10000) as NormalizedScore;

  return {
    score,
    confidence,
    reasons,
  };
}
