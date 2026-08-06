/**
 * Deterministic Scam Language Detector Entry Point
 * Implements Spec 22 (text-detector/v1)
 *
 * Provides a pure, deterministic, versioned text scam detector that evaluates
 * message text for social engineering tactics across English, Hinglish, and Devanagari Hindi.
 * Output is audit-safe and strictly respects user consent boundaries.
 */

import { MessageCheckInput } from "@/types/message";
import { DetectorResult, DetectorVersion } from "@/types/detector";
import { MessageCheckInputSchema, DetectorResultSchema } from "@/lib/contracts/schemas";
import { NormalizedScore } from "@/lib/contracts/primitives";
import { TEXT_DETECTOR_VERSION } from "@/lib/contracts/versions";
import { preprocessMessageText } from "./text-preprocessing";
import { matchScamTactics } from "./tactic-patterns";
import { evaluateBenignContext } from "./benign-context";
import { scoreMessage } from "./score-message";

export { TEXT_DETECTOR_VERSION };

export interface TextDetectorOptions {
  readonly clock?: () => number;
}

/**
 * Primary text scam evaluation function.
 * Evaluates message text and returns a fully compliant DetectorResult.
 */
export function evaluateMessageScamRisk(
  input?: MessageCheckInput | null,
  options?: TextDetectorOptions
): DetectorResult {
  const getTimestamp = options?.clock || (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  const startTime = getTimestamp();

  // 1. Missing or Null Input Check -> Unavailable State
  if (!input) {
    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const result: DetectorResult = {
      name: "message",
      version: TEXT_DETECTOR_VERSION as DetectorVersion,
      availability: "unavailable",
      score: null,
      confidence: null,
      reasons: [],
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  // 2. Input Schema Boundary & Consent Check -> Unavailable State
  const validationResult = MessageCheckInputSchema.safeParse(input);
  if (!validationResult.success || !input.consentGiven || !input.messageText || input.messageText.trim().length === 0) {
    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const result: DetectorResult = {
      name: "message",
      version: TEXT_DETECTOR_VERSION as DetectorVersion,
      availability: "unavailable",
      score: null,
      confidence: null,
      reasons: [],
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  const validMessageInput = validationResult.data;

  // 3. Preprocess Message Text (Spec 21: NFKC normalization, entity masking, tokenization)
  const prep = preprocessMessageText(validMessageInput.messageText);

  // 4. Degraded Coverage Check (e.g., unsupported non-Latin script emitting zero tokens)
  if (prep.tokens.length === 0 && prep.rawLength > 0) {
    const matchedTactics = matchScamTactics(prep.normalizedText);
    const benign = evaluateBenignContext(prep.normalizedText, matchedTactics);
    const scoring = scoreMessage(prep, matchedTactics, benign);

    const endTime = getTimestamp();
    const latencyMs = Math.max(0, Math.round(endTime - startTime));
    const result: DetectorResult = {
      name: "message",
      version: TEXT_DETECTOR_VERSION as DetectorVersion,
      availability: "degraded",
      score: scoring.score as NormalizedScore,
      confidence: (scoring.confidence * 0.5) as NormalizedScore,
      degradedReason: "Message text contains unsupported script tokens or unusable transcription.",
      reasons: [...scoring.reasons],
      latencyMs,
    };
    return DetectorResultSchema.parse(result);
  }

  // 5. Match Tactics & Evaluate Benign Context
  const matchedTactics = matchScamTactics(prep.normalizedText);
  const benign = evaluateBenignContext(prep.normalizedText, matchedTactics);

  // 6. Score Message & Build Reasons
  const scoring = scoreMessage(prep, matchedTactics, benign);

  const endTime = getTimestamp();
  const latencyMs = Math.max(0, Math.round(endTime - startTime));

  const result: DetectorResult = {
    name: "message",
    version: TEXT_DETECTOR_VERSION as DetectorVersion,
    availability: "available",
    score: scoring.score as NormalizedScore,
    confidence: scoring.confidence as NormalizedScore,
    reasons: [...scoring.reasons],
    latencyMs,
  };

  return DetectorResultSchema.parse(result);
}
