/**
 * Deterministic Transaction Risk Detector Entry Point
 * Implements Spec 19 (transaction-detector/v1)
 *
 * Provides a pure, deterministic, versioned transaction risk detector that
 * evaluates point-in-time transaction signals without depending on text/graph evidence
 * or global fusion weights.
 */

import { TransactionCheckInput } from "@/types/transaction";
import { DetectorResult, DetectorVersion } from "@/types/detector";
import { TransactionCheckInputSchema, DetectorResultSchema } from "@/lib/contracts/schemas";
import { NormalizedScore } from "@/lib/contracts/primitives";
import {
  TransactionRuleConfig,
  DEFAULT_TRANSACTION_RULES,
  validateTransactionRuleConfig,
} from "./rules";
import { scoreTransaction } from "./score-transaction";

export const TRANSACTION_DETECTOR_VERSION = "transaction-detector/v1" as DetectorVersion;

export interface TransactionDetectorOptions {
  readonly clock?: () => number;
  readonly rules?: TransactionRuleConfig;
}

/**
 * Primary transaction risk evaluation function.
 * Evaluates transaction input signals and returns a fully compliant DetectorResult.
 */
export function evaluateTransactionRisk(
  input?: TransactionCheckInput | null,
  options?: TransactionDetectorOptions
): DetectorResult {
  const rules = options?.rules || DEFAULT_TRANSACTION_RULES;
  validateTransactionRuleConfig(rules);

  const getTimestamp = options?.clock || (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  const startTime = getTimestamp();

  // 1. Missing or Null Input Check -> Unavailable State
  if (!input) {
    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const result: DetectorResult = {
      name: "transaction",
      version: TRANSACTION_DETECTOR_VERSION,
      availability: "unavailable",
      score: null,
      confidence: null,
      reasons: [],
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  // 2. Input Schema Validation Boundary
  const validationResult = TransactionCheckInputSchema.safeParse(input);
  if (!validationResult.success) {
    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const result: DetectorResult = {
      name: "transaction",
      version: TRANSACTION_DETECTOR_VERSION,
      availability: "unavailable",
      score: null,
      confidence: null,
      reasons: [],
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  const validCheckInput = validationResult.data;

  // 3. Degraded Feature / Input Quality Check
  const rawAmount = validCheckInput.raw.amount;
  if (rawAmount <= 0 || !Number.isFinite(rawAmount)) {
    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const scoring = scoreTransaction(validCheckInput.features, rules);
    const result: DetectorResult = {
      name: "transaction",
      version: TRANSACTION_DETECTOR_VERSION,
      availability: "degraded",
      score: scoring.score as NormalizedScore,
      confidence: scoring.confidence as NormalizedScore,
      degradedReason: "Invalid or zero transaction amount in raw input context.",
      reasons: scoring.reasons,
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  // 4. Normal Scoring Evaluation
  const scoring = scoreTransaction(validCheckInput.features, rules);
  const endTime = getTimestamp();
  const latencyMs = Math.max(0, Math.round(endTime - startTime));

  const result: DetectorResult = {
    name: "transaction",
    version: TRANSACTION_DETECTOR_VERSION,
    availability: "available",
    score: scoring.score as NormalizedScore,
    confidence: scoring.confidence as NormalizedScore,
    reasons: scoring.reasons,
    latencyMs,
  };

  return DetectorResultSchema.parse(result);
}
