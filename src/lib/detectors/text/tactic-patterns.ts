/**
 * Multilingual Scam Tactic Patterns & Lexicon Configuration
 * Implements Spec 22 (tactic-patterns/v1)
 *
 * Defines versioned lexicons and regex patterns for 9 social engineering tactics
 * across English, Hindi transliteration (Hinglish), and Devanagari Hindi.
 */

import { ReasonCode } from "@/types/detector";
import { REASON_CODES } from "@/lib/reasons/reason-codes";

export const TACTIC_PATTERNS_VERSION = "tactic-patterns/v1";

export interface TacticDefinition {
  readonly code: ReasonCode;
  readonly tacticName: string;
  readonly baseSeverity: number;
  readonly patterns: readonly RegExp[];
}

export interface TacticMatch {
  readonly code: ReasonCode;
  readonly tacticName: string;
  readonly baseSeverity: number;
  readonly matchedPatternsCount: number;
  readonly matchedKeywords: string[];
}

export const SCAM_TACTIC_DEFINITIONS: readonly TacticDefinition[] = [
  // 1. SCAM_URGENCY: Time pressure, countdowns, immediate action demands
  {
    code: REASON_CODES.SCAM_URGENCY,
    tacticName: "Urgency Demand",
    baseSeverity: 0.65,
    patterns: [
      /\b(urgent|immediately|within\s+\d+\s*(mins?|minutes?|hours?)|limited\s+time|hurry|expire[s]?\s+soon|slots?\s+remaining|last\s+chance|act\s+fast)\b/i,
      /\b(jaldi|turant|abhi\s+karo|time\s+kam\s+h[ai]?|turant\s+kare|jaldi\s+karo)\b/i,
      /(अति\s*शीघ्र|तुरंत|अभी\s*करें|समय\s*सीमित|जल्दी\s*करें|सीमित\s*समय)/u,
    ],
  },

  // 2. SCAM_AUTHORITY: Impersonation of police, TRAI, RBI, Cyber Cell, CBI, Bank Officers
  {
    code: REASON_CODES.SCAM_AUTHORITY,
    tacticName: "Fake Authority Impersonation",
    baseSeverity: 0.8,
    patterns: [
      /\b(trai(\s+notice)?|cyber\s+(crime\s+)?(cell|police|dept|department)|rbi|cbi|customs\s+(officer|dept|department)|bank\s+manager|income\s+tax\s+(dept|department|notice)|department\s+of\s+telecommunications|dot\s+notice)\b/i,
      /\b(this\s+is|calling\s+from|on\s+behalf\s+of|notice\s+from)\s+(the\s+)?(police|customs|income\s+tax)\b/i,
      /\b(cyber\s+police|trai\s+notice|rbi\s+officer|bank\s+officer|police\s+station|customs\s+dept)\b/i,
      /(कस्टम\s*विभाग|साइबर\s*पुलिस|आरबीआई|आयकर\s*पुलिस|आयकर\s*विभाग|पुलिस\s*स्टेशन|दूरसंचार\s*विभाग|सीबीआई)/u,
    ],
  },

  // 3. SCAM_THREAT: Digital arrest, FIR, warrants, SIM suspension, legal prosecution
  {
    code: REASON_CODES.SCAM_THREAT,
    tacticName: "Coercive Threat / Digital Arrest",
    baseSeverity: 0.85,
    patterns: [
      /\b(digital\s+arrest|fir(\s+registered)?|legal\s+action|arrest\s+warrant|account\s+suspended|sim\s+suspension|prosecution|money\s+laundering\s+package|jail|court\s+order)\b/i,
      /\b(fir\s+darj|police\s+case|sim\s+block|jail\s+ho|account\s+freeze|digital\s+arrest)\b/i,
      /(डिजिटल\s*अरेस्ट|एफआईआर|अरेस्ट\s*वारंट|कानूनी\s*कार्रवाई|खाता\s*सीज|जेल|सिम\s*ब्लॉक)/u,
    ],
  },

  // 4. SCAM_SECRECY: Demands to keep call connected, secret clearance, hiding from family
  {
    code: REASON_CODES.SCAM_SECRECY,
    tacticName: "Secrecy / Isolation Mandate",
    baseSeverity: 0.6,
    patterns: [
      /\b(do\s+not\s+disconnect|keep\s+secret|don'?t\s+inform\s+anyone|confidential\s+(procedure|clearance)|do\s+not\s+share\s+with\s+family|stay\s+on\s+call|do\s+not\s+tell\s+friends)\b/i,
      /\b(kisi\s+ko\s+mat\s+batana|call\s+cut\s+mat|gupchup|secret\s+rakho|family\s+ko\s+mat\s+batao)\b/i,
      /(किसी\s*को\s*मत\s*बताना|कॉन्फिडेंशियल|कॉल्स?\s*डिस्कनेक्ट\s*मत|गुप्त\s*रखें|परिवार\s*को\s*न\s*बताएं)/u,
    ],
  },

  // 5. SCAM_INVESTMENT: Guaranteed high returns, double money, crypto/Telegram task schemes
  {
    code: REASON_CODES.SCAM_INVESTMENT,
    tacticName: "Fraudulent Investment / Task Promise",
    baseSeverity: 0.75,
    patterns: [
      /\b(double\s+(your\s+)?money|\d+%\s+return|guaranteed\s+(profit|returns?)|daily\s+earning|task\s+commission|high\s+yield\s+investment|crypto\s+scheme|no\s+risk\s+investment|work\s+from\s+home\s+profit)\b/i,
      /\b(money\s+double|guaranteed\s+return|daily\s+profit|task\s+earn|investment\s+plan|kamaye\s+rozana|paisa\s+double)\b/i,
      /(मुनाफा|गारंटीड\s*रिटर्न|पैसा\s*डबल|रोजाना\s*कमाई|टास्क\s*कमिशन|उच्च\s*रिटर्न)/u,
    ],
  },

  // 6. SCAM_REFUND_QR: Collect requests / QR code scans falsely presented as receiving refunds
  {
    code: REASON_CODES.SCAM_REFUND_QR,
    tacticName: "Refund QR / Collect Request Trap",
    baseSeverity: 0.8,
    patterns: [
      /\b(scan\s+(qr|barcode)(\s+code)?|approve\s+collect(\s+request)?|collect\s+request|scan\s+to\s+(receive|get)|receive\s+money\s+scan|refund\s+ready\s+scan)\b/i,
      /\b(refund\s+lene\s+ke\s+liye\s+scan|paisa\s+lene\s+ke\s+liye\s+pin|qr\s+scan\s+karke\s+paise\s+paye|collect\s+request\s+approve)\b/i,
      /(रिफंड\s*पाने\s*के\s*लिए\s*qr|स्कैन\s*करके\s*पैसे\s*प्राप्त|रिफंड\s*के\s*लिए\s*पिन)/u,
    ],
  },

  // 7. SCAM_CREDENTIALS: Requests for PIN, OTP, password, card CVV
  {
    code: REASON_CODES.SCAM_CREDENTIALS,
    tacticName: "Credential / OTP Harvesting",
    baseSeverity: 0.85,
    patterns: [
      /\b(enter\s+(upi\s+)?pin|share\s+otp|tell\s+\d+[\s-]*digit\s+code|provide\s+cvv|share\s+password|send\s+otp|enter\s+pin\s+to\s+(receive|confirm))\b/i,
      /\b(otp\s+batao|upi\s+pin\s+dalo|\d+\s+digit\s+code\s+share|pin\s+enter\s+kare|otp\s+share\s+kare)\b/i,
      /(ओटीपी\s*शेयर|यूपीआई\s*पिन\s*दबाएं|यूपीआई\s*पिन\s*डालें|६\s*अंकों\s*का\s*कोड|पिन\s*दर्ज\s*करें)/u,
    ],
  },

  // 8. SCAM_REMOTE_ACCESS: Demands to install screen sharing / remote admin tools
  {
    code: REASON_CODES.SCAM_REMOTE_ACCESS,
    tacticName: "Remote Access Software Coercion",
    baseSeverity: 0.85,
    patterns: [
      /\b(install\s+(anydesk|quicksupport|teamviewer|rustdesk)|screen\s+share(\s+app)?|download\s+apk|remote\s+support\s+app)\b/i,
      /\b(anydesk\s+download|quicksupport\s+install|screen\s+share\s+kare|anydesk\s+app)\b/i,
      /(स्क्रीन\s*शेयर|एनीडेस्क\s*डाउनलोड|क्विकसपोर्ट\s*इंस्टॉल)/u,
    ],
  },

  // 9. SCAM_RECOVERY_FEE: Demands for advance processing fees, taxes, or security clearance deposits
  {
    code: REASON_CODES.SCAM_RECOVERY_FEE,
    tacticName: "Advance Recovery / Clearance Fee",
    baseSeverity: 0.75,
    patterns: [
      /\b(security\s+(clearance\s+)?deposit|processing\s+fee\s+first|pay\s+gst\s+to\s+release|advance\s+deposit|tax\s+payment\s+before|release\s+fee|unlock\s+fee)\b/i,
      /\b(processing\s+fee\s+pehle|clearance\s+charge|advance\s+payment\s+release|gst\s+bharo\s+pehle)\b/i,
      /(प्रोसेसिंग\s*फीस|सिक्योरिटी\s*डिपॉजिट|एडवांस\s*शुल्क|टैक्स\s*जमा\s*करें\s*पहले)/u,
    ],
  },
] as const;

/**
  * Evaluates normalized text against all tactic definitions.
  * Returns matched tactics with regex pattern hit counts and extracted keywords.
  */
export function matchScamTactics(normalizedText: string): TacticMatch[] {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return [];
  }

  const matches: TacticMatch[] = [];

  for (const def of SCAM_TACTIC_DEFINITIONS) {
    const matchedKeywords: string[] = [];
    let matchedPatternsCount = 0;

    for (const pattern of def.patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        matchedPatternsCount++;
        if (match[0] && !matchedKeywords.includes(match[0].toLowerCase())) {
          matchedKeywords.push(match[0].toLowerCase());
        }
      }
    }

    if (matchedPatternsCount > 0) {
      matches.push({
        code: def.code,
        tacticName: def.tacticName,
        baseSeverity: def.baseSeverity,
        matchedPatternsCount,
        matchedKeywords,
      });
    }
  }

  return matches;
}
