/**
 * Text Normalization Module for Multilingual Payment Scam Messages
 * Aligned with Spec 21 (text-preprocessing/v1)
 *
 * Deterministically normalizes English, Hindi transliteration (Hinglish), and Devanagari text
 * without erasing decisive scam tactics, benign negations, or security tokens.
 */

export interface NormalizationResult {
  readonly normalized: string;
  readonly warnings: string[];
}

/**
 * Removes control characters (U+0000..U+001F except \t \n \r, U+007F..U+009F)
 * and zero-width spaces (U+200B..U+200D, U+FEFF).
 */
function purgeControlAndInvisibleChars(text: string): { cleaned: string; hadInvisible: boolean } {
  const invisibleRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g;
  const hadInvisible = invisibleRegex.test(text);
  const cleaned = text.replace(invisibleRegex, "");
  return { cleaned, hadInvisible };
}

/**
 * Normalizes repeated punctuation characters while preserving single punctuation delimiters.
 * e.g., "!!!" -> "!", "???" -> "?", "...." -> "."
 */
function normalizeRepeatedPunctuation(text: string): string {
  return text
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\.{2,}/g, ".");
}

/**
 * Standardizes common character obfuscation (leetspeak / symbol replacement)
 * inside obfuscated words without destroying valid URLs or VPAs.
 */
function unmaskObfuscation(text: string): string {
  // Replace symbol obfuscation ($ -> s, ! -> i) in words (e.g. $ecure -> secure, cl!ck -> click)
  // Ensures words starting with $ or ! match without mutating currency values (e.g. $500) or URLs/VPAs.
  return text.replace(/(?:^|\s|[a-zA-Z0-9])[a-zA-Z0-9]*[$!][a-z][a-zA-Z]*[a-zA-Z0-9]*\b/g, (match) => {
    return match.replace(/\$/g, "s").replace(/!/g, "i");
  });
}

/**
 * Normalizes whitespace (collapses multiple spaces, tabs, and excess newlines into clean single spaces/newlines).
 */
function normalizeWhitespaceCleanly(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join("\n")
    .trim();
}

/**
 * Primary text normalization function adhering to Spec 21 requirements.
 * Performs NFKC normalization, strips invisible control characters, reduces repeated punctuation,
 * cleans obfuscation, and standardizes whitespace while preserving Hinglish meaning.
 */
export function normalizeScamText(rawText: string): NormalizationResult {
  const warnings: string[] = [];

  if (!rawText || rawText.trim().length === 0) {
    return {
      normalized: "",
      warnings: ["Input text is empty."],
    };
  }

  // 1. Unicode NFKC Normalization
  let text = rawText.normalize("NFKC");

  // 2. Control and Invisible Character Purging
  const { cleaned, hadInvisible } = purgeControlAndInvisibleChars(text);
  text = cleaned;
  if (hadInvisible) {
    warnings.push("Control characters or invisible zero-width spaces were removed.");
  }

  // 3. Obfuscation Unmasking
  text = unmaskObfuscation(text);

  // 4. Repeated Punctuation Normalization
  text = normalizeRepeatedPunctuation(text);

  // 5. Clean Whitespace Normalization
  text = normalizeWhitespaceCleanly(text);

  return {
    normalized: text,
    warnings,
  };
}
