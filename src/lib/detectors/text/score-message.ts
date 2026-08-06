/**
 * Scam Message Scoring & Reason Builder Engine
 * Implements Spec 22 (score-message/v1)
 *
 * Scores observable scam tactics, tactic combinations, channel context, entity types,
 * and benign dampening while ensuring single isolated keywords cannot trigger high risk.
 */

import { DetectorReason } from "@/types/detector";
import { NormalizedScore } from "@/lib/contracts/primitives";
import { REASON_CODES } from "@/lib/reasons/reason-codes";
import { TextPreprocessingResult } from "./text-preprocessing";
import { TacticMatch } from "./tactic-patterns";
import { BenignContextResult } from "./benign-context";

export interface MessageScoringResult {
  readonly score: NormalizedScore;
  readonly confidence: NormalizedScore;
  readonly reasons: readonly DetectorReason[];
  readonly matchedTacticCodes: readonly string[];
}

/**
 * Calculates deterministic risk score, confidence, and audit-safe reason codes for message text.
 */
export function scoreMessage(
  prep: TextPreprocessingResult,
  matchedTactics: readonly TacticMatch[],
  benign: BenignContextResult
): MessageScoringResult {
  // 1. Filter out tactics suppressed by benign context
  const activeTactics = matchedTactics.filter(
    (t) => !benign.suppressedTacticCodes.includes(t.code)
  );

  // If no active tactics match or text is empty -> Low Risk Baseline
  if (activeTactics.length === 0) {
    const confidence: NormalizedScore = Math.min(
      0.95,
      Math.max(0.5, prep.tokens.length > 5 ? 0.9 : 0.6)
    ) as NormalizedScore;

    return {
      score: 0.0 as NormalizedScore,
      confidence: (benign.isBenignBankAdvisory ? 0.95 : confidence) as NormalizedScore,
      reasons: [],
      matchedTacticCodes: [],
    };
  }

  // 2. Base Score Calculation from Active Tactics
  const tacticCodes = new Set(activeTactics.map((t) => t.code));
  let baseScore = 0;

  // Maximum base severity among matched active tactics
  const maxBaseSeverity = Math.max(...activeTactics.map((t) => t.baseSeverity));
  baseScore = maxBaseSeverity;

  // Additional incremental weight for multiple distinct tactics (+0.12 per extra tactic)
  if (activeTactics.length > 1) {
    baseScore += (activeTactics.length - 1) * 0.12;
  }

  // 3. High-Risk Tactic Combinations & Multipliers
  let combinationMultiplier = 1.0;

  // Combination A: Digital Arrest / Police Coercion (Authority + Threat + Secrecy or Urgency)
  const isDigitalArrestCombo =
    tacticCodes.has(REASON_CODES.SCAM_AUTHORITY) &&
    (tacticCodes.has(REASON_CODES.SCAM_THREAT) || tacticCodes.has(REASON_CODES.SCAM_SECRECY));

  if (isDigitalArrestCombo) {
    combinationMultiplier *= 1.25;
  }

  // Combination B: Refund QR Trap (Refund QR + Credentials/PIN or Urgency)
  const isRefundTrapCombo =
    tacticCodes.has(REASON_CODES.SCAM_REFUND_QR) &&
    (tacticCodes.has(REASON_CODES.SCAM_CREDENTIALS) || tacticCodes.has(REASON_CODES.SCAM_URGENCY));

  if (isRefundTrapCombo) {
    combinationMultiplier *= 1.25;
  }

  // Combination C: Guaranteed Investment / Task Scheme (Investment + Urgency)
  const isInvestmentCombo =
    tacticCodes.has(REASON_CODES.SCAM_INVESTMENT) && tacticCodes.has(REASON_CODES.SCAM_URGENCY);

  if (isInvestmentCombo) {
    combinationMultiplier *= 1.2;
  }

  // Combination D: Credential Harvesting + Urgency / Remote Access
  const isCredentialCombo =
    tacticCodes.has(REASON_CODES.SCAM_CREDENTIALS) &&
    (tacticCodes.has(REASON_CODES.SCAM_URGENCY) || tacticCodes.has(REASON_CODES.SCAM_REMOTE_ACCESS));

  if (isCredentialCombo) {
    combinationMultiplier *= 1.2;
  }

  // Apply combination multiplier
  let combinedScore = baseScore * combinationMultiplier;

  // 4. Entity Context Signals
  const hasVpa = prep.entities.some((e) => e.type === "vpa");
  const hasUrl = prep.entities.some((e) => e.type === "url");
  const hasPhone = prep.entities.some((e) => e.type === "phone");

  if (hasVpa && (tacticCodes.has(REASON_CODES.SCAM_INVESTMENT) || tacticCodes.has(REASON_CODES.SCAM_REFUND_QR))) {
    combinedScore += 0.08;
  }
  if (hasUrl && (tacticCodes.has(REASON_CODES.SCAM_INVESTMENT) || tacticCodes.has(REASON_CODES.SCAM_CREDENTIALS))) {
    combinedScore += 0.05;
  }
  if (hasPhone && tacticCodes.has(REASON_CODES.SCAM_AUTHORITY)) {
    combinedScore += 0.05;
  }

  // 5. Single Keyword Safety Cap Rule: A single isolated weak tactic (base severity < 0.80) cannot force a high score (>=0.70)
  if (activeTactics.length === 1) {
    const singleTacticCap = maxBaseSeverity < 0.8 ? 0.65 : 0.69;
    combinedScore = Math.min(combinedScore, singleTacticCap);
  }

  // 6. Benign Context Dampening
  combinedScore *= benign.scoreDampeningFactor;

  // Clamp final score to [0.0, 1.0]
  const finalScore = Math.min(1.0, Math.max(0.0, combinedScore));

  // 7. Confidence Calculation
  let rawConfidence = 0.85;

  // Adjust for text length & quality
  if (prep.rawLength < 20 || prep.tokens.length < 4) {
    rawConfidence -= 0.2;
  } else if (prep.rawLength > 100 && prep.tokens.length > 15) {
    rawConfidence += 0.05;
  }

  // Pattern agreement bonus
  if (activeTactics.length >= 2) {
    rawConfidence += 0.08;
  }

  // Benign dampening
  rawConfidence *= benign.confidenceDampeningFactor;

  const finalConfidence = Math.min(1.0, Math.max(0.2, rawConfidence));

  // 8. Build Audit-Safe Detector Reasons
  const reasons: DetectorReason[] = activeTactics.map((t) => {
    // Determine severity for this tactic
    let tacticSeverity = t.baseSeverity;
    if (activeTactics.length === 1 && !isDigitalArrestCombo && !isRefundTrapCombo) {
      tacticSeverity = Math.min(tacticSeverity, 0.65);
    }
    tacticSeverity = Math.min(1.0, Math.max(0.1, tacticSeverity * benign.scoreDampeningFactor));

    // Value metadata: string for authority (sanitized keyword name), boolean for others
    let val: string | number | boolean = true;
    if (t.code === REASON_CODES.SCAM_AUTHORITY && t.matchedKeywords.length > 0) {
      val = t.matchedKeywords[0].toUpperCase();
    }

    return {
      code: t.code,
      severity: Number(tacticSeverity.toFixed(4)) as NormalizedScore,
      value: val,
    };
  });

  return {
    score: Number(finalScore.toFixed(4)) as NormalizedScore,
    confidence: Number(finalConfidence.toFixed(4)) as NormalizedScore,
    reasons,
    matchedTacticCodes: activeTactics.map((t) => t.code),
  };
}
