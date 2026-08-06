/**
 * Multilingual Benign Context & Negation Handling Engine
 * Implements Spec 22 (benign-rules/v1)
 *
 * Identifies legitimate bank advisories, public awareness notices, official refund status updates,
 * ordinary bill/rent discussions, and verified transaction receipts to prevent false positives.
 */

import { ReasonCode } from "@/types/detector";
import { REASON_CODES } from "@/lib/reasons/reason-codes";
import { TacticMatch } from "./tactic-patterns";

export const BENIGN_RULES_VERSION = "benign-rules/v1";

export interface BenignContextResult {
  readonly isBenignBankAdvisory: boolean;
  readonly isBenignRefundNotice: boolean;
  readonly isBenignRentOrBill: boolean;
  readonly isBenignInvestmentNotice: boolean;
  readonly isBenignEmergencyReceipt: boolean;
  readonly scoreDampeningFactor: number;
  readonly confidenceDampeningFactor: number;
  readonly suppressedTacticCodes: readonly ReasonCode[];
}

const BANK_ADVISORY_PATTERNS: readonly RegExp[] = [
  /\b(never\s+share\s+(your\s+)?(\d+[\s-]*digit\s+)?(upi\s+)?(pin|otp|password|cvv)|bank\s+never\s+asks(\s+for)?\s+(pin|otp|password|cvv|credentials)|caution:\s*never\s+share)\b/i,
  /\b(kabhi\s+bhi\s+(otp|pin)\s+share\s+na\s+kare|pin\s+kisi\s+ko\s+mat\s+do|bank\s+kabhi\s+(pin|otp)\s+nahi\s+mangta)\b/i,
  /(कभी\s*भी\s*(ओटीपी|पिन)\s*शेयर\s*न\s*करें|पिन\s*किसी\s*को\s*न\s*बताएं|बैंक\s*कभी\s*(पिन|ओटीपी)\s*नहीं\s*मांगता)/u,
];

const LEGITIMATE_REFUND_PATTERNS: readonly RegExp[] = [
  /\b(refund\s+of\s+rs\.?\s*\d+\s+is\s+approved|credited\s+directly\s+to\s+(your\s+)?(bank\s+)?account|no\s+action\s+(is\s+)?required|refund\s+(process\s+)?completed?|refund\s+status:\s*successful)\b/i,
  /\b(refund\s+account\s+me\s+credit\s+ho\s+gaya|kuch\s+karniki\s+zarurat\s+nahi)\b/i,
  /(खाते\s*में\s*क्रेडिट\s*कर\s*दिया\s*गया|कोई\s*कार्रवाई\s*की\s*आवश्यकता\s*नहीं)/u,
];

const RENT_OR_BILL_PATTERNS: readonly RegExp[] = [
  /\b(july|august|september|october|november|december|january|february|march|april|may|june)?\s*(house\s+rent|apartment\s+rent|electricity\s+bill|maintenance\s+charges|rent\s+invoice)\b/i,
  /\b(makan\s+kiraya|house\s+rent\s+payment|bijli\s+bill)\b/i,
  /(मकान\s*किराया|बिजली\s*बिल|सोसायटी\s*मेंटेनेंस)/u,
];

const LEGITIMATE_INVESTMENT_PATTERNS: readonly RegExp[] = [
  /\b(mutual\s+fund\s+sip\s+confirmation|zerodha\s+order\s+executed|groww\s+sip\s+debit|nse\s+stock\s+purchase|bse\s+trade\s+confirmation)\b/i,
];

const EMERGENCY_RECEIPT_PATTERNS: readonly RegExp[] = [
  /\b(emergency\s+admission\s+deposit\s+receipt|patient\s+admission\s+at|sending\s+my\s+share\s+for\s+the\s+dinner|dinner\s+split\s+share)\b/i,
];

/**
 * Evaluates normalized message text and matched tactic candidates against benign context patterns.
 * Returns dampening multipliers and tactic suppression lists.
 */
export function evaluateBenignContext(
  normalizedText: string,
  matchedTactics: readonly TacticMatch[]
): BenignContextResult {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return {
      isBenignBankAdvisory: false,
      isBenignRefundNotice: false,
      isBenignRentOrBill: false,
      isBenignInvestmentNotice: false,
      isBenignEmergencyReceipt: false,
      scoreDampeningFactor: 1.0,
      confidenceDampeningFactor: 1.0,
      suppressedTacticCodes: [],
    };
  }

  const isBenignBankAdvisory = BANK_ADVISORY_PATTERNS.some((p) => p.test(normalizedText));
  const isBenignRefundNotice = LEGITIMATE_REFUND_PATTERNS.some((p) => p.test(normalizedText));
  const isBenignRentOrBill = RENT_OR_BILL_PATTERNS.some((p) => p.test(normalizedText));
  const isBenignInvestmentNotice = LEGITIMATE_INVESTMENT_PATTERNS.some((p) => p.test(normalizedText));
  const isBenignEmergencyReceipt = EMERGENCY_RECEIPT_PATTERNS.some((p) => p.test(normalizedText));

  const suppressedTacticCodes: ReasonCode[] = [];
  let scoreDampeningFactor = 1.0;
  let confidenceDampeningFactor = 1.0;

  // 1. Bank Advisory Negation: If message explicitly warns "Never share OTP/PIN", suppress demand tactics unless coercive threat/authority is present
  if (isBenignBankAdvisory) {
    const hasCoerciveThreat = matchedTactics.some((t) => t.code === REASON_CODES.SCAM_THREAT || t.code === REASON_CODES.SCAM_AUTHORITY);
    if (!hasCoerciveThreat) {
      suppressedTacticCodes.push(REASON_CODES.SCAM_CREDENTIALS);
      suppressedTacticCodes.push(REASON_CODES.SCAM_URGENCY);
      suppressedTacticCodes.push(REASON_CODES.SCAM_REFUND_QR);
      suppressedTacticCodes.push(REASON_CODES.SCAM_REMOTE_ACCESS);
      suppressedTacticCodes.push(REASON_CODES.SCAM_RECOVERY_FEE);
      scoreDampeningFactor *= 0.1;
      confidenceDampeningFactor *= 0.95; // High confidence it is a benign bank warning
    }
  }

  // 2. Legitimate Refund Confirmation: Money credited automatically without requesting PIN or QR scan
  if (isBenignRefundNotice) {
    const hasScanOrPinDemand = matchedTactics.some(
      (t) => t.code === REASON_CODES.SCAM_CREDENTIALS || t.code === REASON_CODES.SCAM_REFUND_QR
    );
    if (!hasScanOrPinDemand) {
      suppressedTacticCodes.push(REASON_CODES.SCAM_REFUND_QR);
      scoreDampeningFactor *= 0.15;
    }
  }

  // 3. Ordinary Rent or Bill payment notes
  if (isBenignRentOrBill) {
    const hasCoerciveThreat = matchedTactics.some((t) => t.code === REASON_CODES.SCAM_THREAT);
    if (!hasCoerciveThreat) {
      scoreDampeningFactor *= 0.2;
    }
  }

  // 4. Regulated Investment SIP / Trade notifications
  if (isBenignInvestmentNotice) {
    const hasGuaranteedReturn = matchedTactics.some((t) => t.code === REASON_CODES.SCAM_INVESTMENT && t.matchedKeywords.some((k) => k.includes("double") || k.includes("guaranteed")));
    if (!hasGuaranteedReturn) {
      suppressedTacticCodes.push(REASON_CODES.SCAM_INVESTMENT);
      scoreDampeningFactor *= 0.2;
    }
  }

  // 5. Emergency Hospital / Routine Dinner Share
  if (isBenignEmergencyReceipt) {
    const hasCoerciveThreat = matchedTactics.some((t) => t.code === REASON_CODES.SCAM_THREAT || t.code === REASON_CODES.SCAM_AUTHORITY);
    if (!hasCoerciveThreat) {
      scoreDampeningFactor *= 0.2;
    }
  }

  return {
    isBenignBankAdvisory,
    isBenignRefundNotice,
    isBenignRentOrBill,
    isBenignInvestmentNotice,
    isBenignEmergencyReceipt,
    scoreDampeningFactor,
    confidenceDampeningFactor,
    suppressedTacticCodes,
  };
}
