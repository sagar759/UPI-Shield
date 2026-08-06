/**
 * Entity Extraction and Privacy Masking Module
 * Aligned with Spec 21 (entity-extraction/v1)
 *
 * Deterministically extracts approved entity types (phone, vpa, amount, url, bankApp, txnRef),
 * injects stable type placeholders for detector consumption, and returns separately masked
 * display entities for human UI visualization without network calls or PII leakage.
 */

import { maskPhone, maskVPA, maskTransactionRef } from "@/lib/privacy/mask";
import { formatRupeeFull } from "@/lib/format/currency";

export type EntityType = "phone" | "vpa" | "amount" | "url" | "bankApp" | "txnRef";

export interface ExtractedEntity {
  readonly type: EntityType;
  readonly placeholder: string;
  readonly displayValue: string;
  readonly rawStartIndex: number;
  readonly rawEndIndex: number;
  readonly category?: string;
}

export const DETECTOR_PLACEHOLDERS: Record<EntityType, string> = {
  phone: "[MASKED_PHONE]",
  vpa: "[MASKED_VPA]",
  amount: "[MASKED_AMOUNT]",
  url: "[MASKED_URL]",
  bankApp: "[BANK_APP_MENTION]",
  txnRef: "[MASKED_TXN_REF]",
};

// Known Indian banks and UPI payment applications
const BANK_APP_PATTERNS = [
  "google pay",
  "gpay",
  "phonepe",
  "paytm",
  "yono",
  "bhim",
  "whatsapp pay",
  "sbi",
  "hdfc",
  "icici",
  "axis bank",
  "axis",
  "kotak",
  "indusind",
  "pnb",
  "canara",
  "bank of baroda",
  "npci",
];

/**
 * Safely masks a URL without resolving DNS or making network requests.
 * Preserves scheme and host/domain while redacting paths and query parameters.
 * e.g. "https://cyber-verify.example.invalid/refund?token=123" -> "https://cyber-verify.example.invalid/*** "
 */
export function maskURL(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  try {
    const hasScheme = /^[a-z]+:\/\//i.test(trimmed);
    const urlObj = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    const host = urlObj.hostname;
    const scheme = hasScheme ? `${urlObj.protocol}//` : "";

    if (urlObj.pathname && urlObj.pathname !== "/") {
      return `${scheme}${host}/***`;
    }
    if (urlObj.search) {
      return `${scheme}${host}/***`;
    }
    return hasScheme ? `${scheme}${host}` : host;
  } catch {
    const parts = trimmed.split("/");
    const domain = parts[0] || "link.invalid";
    return `${domain}/***`;
  }
}

interface RawEntityMatch {
  type: EntityType;
  rawText: string;
  displayValue: string;
  placeholder: string;
  rawStartIndex: number;
  rawEndIndex: number;
  category?: string;
}

/**
 * Deterministically scans text for approved entity types and returns extracted matches sorted by position.
 */
export function findEntitiesInText(text: string): RawEntityMatch[] {
  if (!text) return [];

  const matches: RawEntityMatch[] = [];
  const occupiedRanges: Array<[number, number]> = [];

  const isRangeOccupied = (start: number, end: number): boolean => {
    return occupiedRanges.some(([s, e]) => Math.max(s, start) < Math.min(e, end));
  };

  const addMatch = (match: RawEntityMatch) => {
    if (!isRangeOccupied(match.rawStartIndex, match.rawEndIndex)) {
      occupiedRanges.push([match.rawStartIndex, match.rawEndIndex]);
      matches.push(match);
    }
  };

  // 1. Extract URLs (highest priority to prevent sub-part phone/vpa fragmentation)
  const urlRegex = /(?:https?:\/\/|www\.)[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,})(?::\d+)?(?:\/[^\s]*)?|(?<!@)\b[a-zA-Z0-9.\-]+\.(?:com|in|org|net|co\.in|example\.invalid)\b(?:\/[^\s]*)?/gi;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    let rawUrl = match[0];
    const start = match.index;

    // Clean trailing sentence punctuation attached to URL
    const trailingPunctMatch = rawUrl.match(/[.,!?;:]+$/);
    if (trailingPunctMatch) {
      rawUrl = rawUrl.slice(0, -trailingPunctMatch[0].length);
    }
    if (!rawUrl) continue;
    const end = start + rawUrl.length;

    addMatch({
      type: "url",
      rawText: rawUrl,
      displayValue: maskURL(rawUrl),
      placeholder: DETECTOR_PLACEHOLDERS.url,
      rawStartIndex: start,
      rawEndIndex: end,
      category: "link",
    });
  }

  // 2. Extract VPAs / UPI Handles (e.g. user@okaxis, 9876543210@paytm)
  const vpaRegex = /\b[a-zA-Z0-9._\-]{2,64}@[a-zA-Z0-9.\-]{2,32}\b/gi;
  while ((match = vpaRegex.exec(text)) !== null) {
    const rawVpa = match[0];
    const start = match.index;
    const end = start + rawVpa.length;

    if (!isRangeOccupied(start, end)) {
      addMatch({
        type: "vpa",
        rawText: rawVpa,
        displayValue: maskVPA(rawVpa),
        placeholder: DETECTOR_PLACEHOLDERS.vpa,
        rawStartIndex: start,
        rawEndIndex: end,
        category: "upi_handle",
      });
    }
  }

  // 3. Extract Transaction Reference Numbers / UTR / RRN (12-digit transaction codes)
  const txnRefRegex = /\b(?:utr|rrn|ref|txn|reference)?\s*[:=\-]?\s*(\d{12})\b/gi;
  while ((match = txnRefRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const digitsOnly = match[1];
    const start = match.index;
    const end = start + rawMatch.length;

    if (!isRangeOccupied(start, end)) {
      addMatch({
        type: "txnRef",
        rawText: rawMatch,
        displayValue: maskTransactionRef(digitsOnly),
        placeholder: DETECTOR_PLACEHOLDERS.txnRef,
        rawStartIndex: start,
        rawEndIndex: end,
        category: "utr_rrn",
      });
    }
  }

  // 4. Extract Indian Phone Numbers (10-digit mobile numbers with optional +91 / 0 prefix)
  const phoneRegex = /(?<![\d])(?:(?:\+91|0)[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}(?!\d)/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const rawPhone = match[0];
    const start = match.index;
    const end = start + rawPhone.length;

    if (!isRangeOccupied(start, end)) {
      addMatch({
        type: "phone",
        rawText: rawPhone,
        displayValue: maskPhone(rawPhone),
        placeholder: DETECTOR_PLACEHOLDERS.phone,
        rawStartIndex: start,
        rawEndIndex: end,
        category: "mobile_number",
      });
    }
  }

  // 5. Extract Rupee Amounts (₹5,000, Rs. 5000, 5000 INR, INR 25,000)
  const amountRegex = /(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+)|(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+)\s*(?:inr|rs\.?|rupees)/gi;
  while ((match = amountRegex.exec(text)) !== null) {
    const rawAmountStr = match[0];
    const numStr = (match[1] || match[2] || "").replace(/,/g, "");
    const numericVal = Number(numStr);
    const start = match.index;
    const end = start + rawAmountStr.length;

    if (!Number.isNaN(numericVal) && numericVal > 0 && !isRangeOccupied(start, end)) {
      addMatch({
        type: "amount",
        rawText: rawAmountStr,
        displayValue: formatRupeeFull(numericVal),
        placeholder: DETECTOR_PLACEHOLDERS.amount,
        rawStartIndex: start,
        rawEndIndex: end,
        category: "currency_inr",
      });
    }
  }

  // 6. Extract Bank / Payment App Mentions
  const bankAppRegexStr = `\\b(${BANK_APP_PATTERNS.join("|")})\\b`;
  const bankAppRegex = new RegExp(bankAppRegexStr, "gi");
  while ((match = bankAppRegex.exec(text)) !== null) {
    const rawApp = match[0];
    const start = match.index;
    const end = start + rawApp.length;

    if (!isRangeOccupied(start, end)) {
      const canonicalName =
        rawApp.toUpperCase() === rawApp
          ? rawApp
          : rawApp
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

      addMatch({
        type: "bankApp",
        rawText: rawApp,
        displayValue: canonicalName,
        placeholder: DETECTOR_PLACEHOLDERS.bankApp,
        rawStartIndex: start,
        rawEndIndex: end,
        category: "payment_channel",
      });
    }
  }

  // Sort matches chronologically by start index
  return matches.sort((a, b) => a.rawStartIndex - b.rawStartIndex);
}

/**
 * Extracts entities, masks display values, and constructs the detector-input text
 * with stable type placeholders replacing raw identifiers.
 */
export function extractAndMaskEntities(text: string): {
  maskedText: string;
  entities: ExtractedEntity[];
} {
  if (!text) {
    return { maskedText: "", entities: [] };
  }

  const rawMatches = findEntitiesInText(text);

  let maskedText = "";
  let lastIndex = 0;

  const entities: ExtractedEntity[] = rawMatches.map((m) => {
    maskedText += text.substring(lastIndex, m.rawStartIndex);
    maskedText += m.placeholder;
    lastIndex = m.rawEndIndex;

    return {
      type: m.type,
      placeholder: m.placeholder,
      displayValue: m.displayValue,
      rawStartIndex: m.rawStartIndex,
      rawEndIndex: m.rawEndIndex,
      category: m.category,
    };
  });

  maskedText += text.substring(lastIndex);

  return {
    maskedText,
    entities,
  };
}
