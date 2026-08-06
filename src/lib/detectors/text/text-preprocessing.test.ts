import { describe, it, expect } from "vitest";
import {
  preprocessMessageText,
  TEXT_PREPROCESSING_VERSION,
  ENTITY_EXTRACTION_VERSION,
} from "./text-preprocessing";
import { normalizeScamText } from "./normalize-text";
import { maskURL } from "./extract-entities";

describe("Text Preprocessing & Entity Masking Engine (Spec 21)", () => {
  describe("Multilingual Text Normalization", () => {
    it("normalizes English scam text while preserving decisive scam tactics", () => {
      const input = "URGENT!!! Your bank account has been BLOCKED. Verify KYC immediately at https://cyber-verify.example.invalid/refund or pay ₹5,000!";
      const result = preprocessMessageText(input);

      expect(result.version).toBe(TEXT_PREPROCESSING_VERSION);
      expect(result.entityVersion).toBe(ENTITY_EXTRACTION_VERSION);
      expect(result.normalizedText).toContain("URGENT!");
      expect(result.normalizedText).toContain("[MASKED_URL]");
      expect(result.normalizedText).toContain("[MASKED_AMOUNT]");
      expect(result.tokens).toContain("kyc");
      expect(result.tokens).toContain("blocked");
      expect(result.tokens).toContain("immediately");
    });

    it("normalizes Hindi transliteration (Hinglish) text correctly", () => {
      const input = "Bhai aapka SBI account block ho gaya hai, turant KYC verify karein link par click karke";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toContain("[BANK_APP_MENTION]");
      expect(result.tokens).toContain("turant");
      expect(result.tokens).toContain("kyc");
      expect(result.tokens).toContain("karein");

      const bankEntity = result.entities.find((e) => e.type === "bankApp");
      expect(bankEntity?.displayValue).toBe("SBI");
    });

    it("handles Devanagari script text safely without corrupting characters", () => {
      const input = "आपका बैंक खाता ब्लॉक कर दिया गया है, तुरंत केवाईसी अपडेट करें";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toContain("आपका बैंक खाता ब्लॉक");
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.tokens).toContain("आपका");
    });

    it("normalizes repeated punctuation (!!! -> !, ??? -> ?)", () => {
      const res = normalizeScamText("Claim now!!!!!! Is this real????");
      expect(res.normalized).toBe("Claim now! Is this real?");
    });
  });

  describe("Privacy Boundaries & Entity Extraction", () => {
    it("extracts and masks Indian mobile phone numbers safely", () => {
      const input = "Call police officer at +91 9876543210 or 9876543210 immediately";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).not.toContain("9876543210");
      expect(result.normalizedText).toContain("[MASKED_PHONE]");

      const phoneEntities = result.entities.filter((e) => e.type === "phone");
      expect(phoneEntities.length).toBe(2);
      expect(phoneEntities[0].displayValue).toBe("+91 98******10");
      expect(phoneEntities[1].displayValue).toBe("98******10");

      // Verify no raw phone numbers in returned entities
      phoneEntities.forEach((e) => {
        expect(e.displayValue).not.toContain("9876543210");
      });
    });

    it("extracts and masks VPAs / UPI handles safely", () => {
      const input = "Send ₹1,500 to merchant_refund@okaxis or emergency@upi or dotted.user@domain.com";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).not.toContain("merchant_refund@okaxis");
      expect(result.normalizedText).not.toContain("dotted.user@domain.com");
      expect(result.normalizedText).toContain("[MASKED_VPA]");

      const vpaEntities = result.entities.filter((e) => e.type === "vpa");
      expect(vpaEntities.length).toBe(3);
      expect(vpaEntities[0].displayValue).toBe("me*************@okaxis");
      expect(vpaEntities[1].displayValue).toBe("em*******@upi");
      expect(vpaEntities[2].displayValue).toBe("do*********@domain.com");

      // Verify domain.com was not stolen as a bare URL
      const urlEntities = result.entities.filter((e) => e.type === "url");
      expect(urlEntities.length).toBe(0);
    });

    it("extracts and masks URLs without making network requests or resolving DNS", () => {
      const input = "Click http://scam-domain.example.invalid/claim?secretToken=xyz123";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).not.toContain("xyz123");
      expect(result.normalizedText).toContain("[MASKED_URL]");

      const urlEntity = result.entities.find((e) => e.type === "url");
      expect(urlEntity?.displayValue).toBe("http://scam-domain.example.invalid/***");
      expect(urlEntity?.displayValue).not.toContain("xyz123");
    });

    it("extracts 12-digit transaction reference numbers (UTR / RRN)", () => {
      const input = "Transaction ref UTR: 123456789012 pending confirmation";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toContain("[MASKED_TXN_REF]");
      const refEntity = result.entities.find((e) => e.type === "txnRef");
      expect(refEntity?.displayValue).toBe("123******012");
      expect(refEntity?.displayValue).not.toContain("123456789012");
    });

    it("masks URLs safely using maskURL helper", () => {
      expect(maskURL("https://phishing.example.invalid/path?a=1")).toBe("https://phishing.example.invalid/***");
      expect(maskURL("phishing.example.invalid")).toBe("phishing.example.invalid");
    });
  });

  describe("Benign Negation & Determinism", () => {
    it("preserves benign negation context ('never share OTP')", () => {
      const input = "Bank advisory: Never share your OTP or PIN with anyone.";
      const result = preprocessMessageText(input);

      expect(result.tokens).toContain("never");
      expect(result.tokens).toContain("share");
      expect(result.tokens).toContain("otp");
    });

    it("produces identical output and entity order for identical input", () => {
      const input = "Pay ₹500 to user@upi or call +91 9876543210 at https://pay.example.invalid";
      const r1 = preprocessMessageText(input);
      const r2 = preprocessMessageText(input);

      expect(r1.normalizedText).toBe(r2.normalizedText);
      expect(r1.tokens).toEqual(r2.tokens);
      expect(r1.entities).toEqual(r2.entities);
    });
  });

  describe("Boundary & Edge Cases", () => {
    it("handles empty or whitespace-only text gracefully", () => {
      const result = preprocessMessageText("   \n\t ");
      expect(result.rawLength).toBe(6);
      expect(result.normalizedText).toBe("");
      expect(result.tokens).toEqual([]);
      expect(result.entities).toEqual([]);
      expect(result.warnings).toContain("Input text is empty.");
    });

    it("purges zero-width and control characters and emits warning", () => {
      const input = "Secret\u200B Message\u0007 Test";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toBe("Secret Message Test");
      expect(result.warnings).toContain("Control characters or invisible zero-width spaces were removed.");
    });

    it("truncates inputs exceeding maximum length (10,000 chars) with warning", () => {
      const longInput = "a".repeat(10050);
      const result = preprocessMessageText(longInput);

      expect(result.rawLength).toBe(10050);
      expect(result.normalizedText.length).toBe(10000);
      expect(result.warnings.some((w) => w.includes("exceeds maximum allowed length"))).toBe(true);
    });

    it("strips trailing sentence punctuation from URL matches without altering punctuation in text", () => {
      const input = "Visit https://cyber-verify.example.invalid/refund! Pay ₹5,000 instantly.";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toContain("[MASKED_URL]!");
      const urlEntity = result.entities.find((e) => e.type === "url");
      expect(urlEntity?.displayValue).toBe("https://cyber-verify.example.invalid/***");
    });

    it("unmasks common symbol obfuscation in words ($ecure -> secure, cl!ck -> click)", () => {
      const input = "Please $ecure your account and cl!ck here";
      const result = preprocessMessageText(input);

      expect(result.tokens).toContain("secure");
      expect(result.tokens).toContain("click");
    });

    it("handles code-switching across English, Hinglish, and Devanagari script seamlessly", () => {
      const input = "Dear user, आपका Paytm wallet block ho gaya hai. Update at https://paytm-kyc.example.invalid or call 9876543210!";
      const result = preprocessMessageText(input);

      expect(result.normalizedText).toContain("[BANK_APP_MENTION]");
      expect(result.normalizedText).toContain("[MASKED_URL]");
      expect(result.normalizedText).toContain("[MASKED_PHONE]");
      expect(result.tokens).toContain("आपका");
      expect(result.tokens).toContain("gaya");
    });
  });
});
