/**
 * Primary Text Preprocessing Engine & Contract
 * Aligned with Spec 21 (text-preprocessing/v1 & entity-extraction/v1)
 *
 * Combines multilingual text normalization, obfuscation cleaning, and privacy entity extraction
 * into a pure, deterministic, versioned preprocessing result for downstream scam detectors.
 */

import { MAX_MESSAGE_LENGTH } from "@/lib/contracts/primitives";
import {
  TEXT_PREPROCESSING_VERSION,
  ENTITY_EXTRACTION_VERSION,
} from "@/lib/contracts/versions";
import { normalizeScamText } from "./normalize-text";
import { extractAndMaskEntities, ExtractedEntity } from "./extract-entities";

export { TEXT_PREPROCESSING_VERSION, ENTITY_EXTRACTION_VERSION };

export interface TextPreprocessingOptions {
  readonly maxLength?: number;
}

export interface TextPreprocessingResult {
  readonly version: typeof TEXT_PREPROCESSING_VERSION;
  readonly entityVersion: typeof ENTITY_EXTRACTION_VERSION;
  readonly rawLength: number;
  readonly normalizedText: string;
  readonly tokens: string[];
  readonly entities: ExtractedEntity[];
  readonly warnings: string[];
}

/**
 * Tokenizes normalized text with placeholders into a clean token list for downstream features.
 * Matches placeholders, Devanagari word sequences, and Latin alphanumeric tokens.
 */
function tokenizeText(text: string): string[] {
  if (!text) return [];

  // Match placeholders [MASKED_...], Devanagari unicode words, or ASCII word tokens
  const tokenRegex = /\[[A-Z_]+\]|[\u0900-\u097F]+|\b[a-zA-Z0-9_]+\b/g;
  const matches = text.match(tokenRegex);
  if (!matches) return [];

  return matches.map((t) => (/^\[[A-Z_]+\]$/.test(t) ? t : t.toLowerCase()));
}

/**
 * Primary text preprocessing function for scam message analysis.
 * Takes raw multiline/multilingual message text and returns a versioned,
 * normalized, tokenized, and privacy-entity-extracted result.
 */
export function preprocessMessageText(
  rawText?: string | null,
  options?: TextPreprocessingOptions
): TextPreprocessingResult {
  const maxLen = options?.maxLength ?? MAX_MESSAGE_LENGTH;
  const warnings: string[] = [];

  if (!rawText || typeof rawText !== "string") {
    return {
      version: TEXT_PREPROCESSING_VERSION,
      entityVersion: ENTITY_EXTRACTION_VERSION,
      rawLength: 0,
      normalizedText: "",
      tokens: [],
      entities: [],
      warnings: ["Input message text is empty or invalid."],
    };
  }

  const rawLength = rawText.length;
  let textToProcess = rawText;

  // 1. Max Length Bounds Checking & Safe Truncation
  if (rawLength > maxLen) {
    textToProcess = rawText.slice(0, maxLen);
    const lastCode = textToProcess.charCodeAt(textToProcess.length - 1);
    if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
      textToProcess = textToProcess.slice(0, -1);
    }
    warnings.push(`Text exceeds maximum allowed length of ${maxLen.toLocaleString()} characters and was truncated.`);
  }

  // 2. Multilingual Normalization & Obfuscation Cleaning
  const normalization = normalizeScamText(textToProcess);
  if (normalization.warnings.length > 0) {
    warnings.push(...normalization.warnings);
  }

  // 3. Entity Extraction & Privacy Masking
  const { maskedText, entities } = extractAndMaskEntities(normalization.normalized);

  // 4. Downstream Token Extraction
  const tokens = tokenizeText(maskedText);

  return {
    version: TEXT_PREPROCESSING_VERSION,
    entityVersion: ENTITY_EXTRACTION_VERSION,
    rawLength,
    normalizedText: maskedText,
    tokens,
    entities,
    warnings,
  };
}
