/**
 * Scam Language Detector Unit Tests & Fixture Evaluation
 * Implements Spec 22 (text-detector.test.ts)
 */

import { describe, it, expect } from "vitest";
import { evaluateMessageScamRisk, TEXT_DETECTOR_VERSION } from "./text-detector";
import { MessageCheckInput } from "@/types/message";
import { RequestId, IsoTimestamp } from "@/lib/contracts/primitives";
import { REASON_CODES } from "@/lib/reasons/reason-codes";
import { DEMO_SCENARIOS } from "@/data/demo/scenarios";
import { DemoScenario } from "@/types/scenario";

const now = "2026-07-21T10:00:00.000Z" as IsoTimestamp;

function buildInput(text: string, consentGiven = true): MessageCheckInput {
  return {
    requestId: "req_test_001" as RequestId,
    messageText: text,
    consentGiven,
    timestamp: now,
  };
}

describe("Deterministic Scam Language Detector (Spec 22)", () => {
  describe("Consent & Input Validation Boundaries", () => {
    it("returns unavailable state when input is null or undefined", () => {
      const resultNull = evaluateMessageScamRisk(null);
      expect(resultNull.availability).toBe("unavailable");
      expect(resultNull.score).toBeNull();
      expect(resultNull.confidence).toBeNull();
      expect(resultNull.reasons).toEqual([]);

      const resultUndef = evaluateMessageScamRisk(undefined);
      expect(resultUndef.availability).toBe("unavailable");
      expect(resultUndef.score).toBeNull();
    });

    it("returns unavailable state when consentGiven is false", () => {
      const input = buildInput("Urgent! Double your money in 24 hours!", false);
      const result = evaluateMessageScamRisk(input);
      expect(result.availability).toBe("unavailable");
      expect(result.score).toBeNull();
      expect(result.confidence).toBeNull();
      expect(result.reasons).toEqual([]);
    });

    it("returns unavailable state when message text is empty or blank whitespace", () => {
      const inputEmpty = buildInput("   ");
      const result = evaluateMessageScamRisk(inputEmpty);
      expect(result.availability).toBe("unavailable");
      expect(result.score).toBeNull();
    });
  });

  describe("Required Scam Scenarios & Tactics", () => {
    it("detects Student Investment Scam (Urgency + Investment)", () => {
      const text =
        "Urgent! Exclusive student investment opportunity: Double your money in 24 hours guaranteed! Transfer ₹5,000 to TEST_VPA_INVEST_001@example.invalid immediately. Limited slots remaining! Contact Telegram @scam_test for details.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      expect(result.version).toBe(TEXT_DETECTOR_VERSION);
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.7);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }

      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_INVESTMENT);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_URGENCY);
    });

    it("detects Refund QR Scam (Refund QR + Credentials)", () => {
      const text =
        "Dear customer, your refund of Rs 2500 for order #9821 is approved. Scan QR code or approve collect request to receive money in bank account instantly. Enter UPI PIN to confirm receipt.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.7);
      }

      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_REFUND_QR);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_CREDENTIALS);
    });

    it("detects Digital Arrest Scam (Authority + Threat + Urgency)", () => {
      const text =
        "TRAI & Cyber Crime Cell NOTICE: Your mobile number +919800000000 is suspended due to illegal money laundering package. Transfer ₹25,000 security clearance deposit to TEST_VPA_POLICE_001@example.invalid immediately within 30 minutes to avoid digital arrest.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.75);
      }

      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_AUTHORITY);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_THREAT);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_URGENCY);
    });

    it("detects Remote Access Software scam demand", () => {
      const text =
        "Bank technical support: Install AnyDesk app and start screen share to unblock your pending UPI transaction immediately.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.7);
      }

      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.SCAM_REMOTE_ACCESS);
    });

    it("detects Hinglish & Devanagari scam demands", () => {
      const hinglishText =
        "Jaldi karo! Money double offer 24 gante me guaranteed return! Transfer 5000 turant.";
      const resHinglish = evaluateMessageScamRisk(buildInput(hinglishText));
      if (resHinglish.availability === "available") {
        expect(resHinglish.score).toBeGreaterThanOrEqual(0.65);
      }
      expect(resHinglish.reasons.map((r) => r.code)).toContain(REASON_CODES.SCAM_INVESTMENT);

      const devanagariText =
        "डिजिटल अरेस्ट वारंट जारी! तुरंत 25000 सिक्योरिटी डिपॉजिट जमा करें। साइबर पुलिस विभाग।";
      const resDev = evaluateMessageScamRisk(buildInput(devanagariText));
      if (resDev.availability === "available") {
        expect(resDev.score).toBeGreaterThanOrEqual(0.7);
      }
      expect(resDev.reasons.map((r) => r.code)).toContain(REASON_CODES.SCAM_THREAT);
    });
  });

  describe("Hard Benign Contexts & False-Positive Control", () => {
    it("remains low score on Benign Bank Advisory despite OTP/PIN mentions", () => {
      const text =
        "HDFC Bank Security Advisory: Your daily UPI limit is ₹100,000. Never share your 6-digit UPI PIN or OTP with anyone. Stay safe.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeLessThan(0.4); // Low risk band
      }
    });

    it("remains low score on Legitimate Automatic Refund status notice", () => {
      const text =
        "Dear customer, refund of Rs 2500 for order #9821 is approved. It will be credited directly to your bank account within 3 business days. No action required.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeLessThan(0.4);
      }
    });

    it("remains low score on Routine Rent Payment note", () => {
      const text = "Hi Aarav, please transfer July rent ₹18000 to my UPI ID. Thanks, Ramesh.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeLessThan(0.4);
      }
    });

    it("remains low score on Emergency Hospital admission receipt", () => {
      const text = "Emergency admission deposit receipt for patient admission at City Life Care Hospital.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeLessThan(0.4);
      }
    });
  });

  describe("Single Keyword Safety Invariant", () => {
    it("ensures a single isolated keyword cannot trigger a high score (>=0.70)", () => {
      const text = "Hi friend, please handle this urgent request when you are free.";
      const result = evaluateMessageScamRisk(buildInput(text));

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeLessThan(0.7); // Single isolated urgency keyword capped below high score
      }
    });
  });

  describe("Audit Safety & Privacy Boundaries", () => {
    it("guarantees raw message text and PII are absent from DetectorResult", () => {
      const text =
        "Urgent! Transfer ₹5,000 to user@okaxis or call +919876543210 immediately. Password is secret.";
      const result = evaluateMessageScamRisk(buildInput(text));

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user@okaxis");
      expect(serialized).not.toContain("+919876543210");
      expect(serialized).not.toContain("Password is secret");
    });
  });

  describe("Evaluation over Demo Scenario Catalog", () => {
    it("evaluates precision, recall, and false positive metrics over scenario fixtures", () => {
      const scenariosWithMessage = DEMO_SCENARIOS.filter((s: DemoScenario) => s.messageInput !== null);
      expect(scenariosWithMessage.length).toBeGreaterThan(0);

      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;

      for (const scenario of scenariosWithMessage) {
        const msg = scenario.messageInput!;
        const result = evaluateMessageScamRisk(msg);
        const isHighScamScenario = scenario.expectedRiskBand === "high";

        if (result.availability === "available" || result.availability === "degraded") {
          const score = result.score;
          if (score === null) {
            continue;
          }
          if (isHighScamScenario) {
            if (score >= 0.4) {
              truePositives++;
            } else {
              falseNegatives++;
            }
          } else {
            if (score >= 0.7) {
              falsePositives++;
            } else {
              trueNegatives++;
            }
          }
        }
      }

      const precision = truePositives / (truePositives + falsePositives || 1);
      const recall = truePositives / (truePositives + falseNegatives || 1);
      const fpr = falsePositives / (falsePositives + trueNegatives || 1);

      expect(precision).toBeGreaterThanOrEqual(0.9);
      expect(recall).toBeGreaterThanOrEqual(0.9);
      expect(fpr).toBeLessThanOrEqual(0.1);
    });
  });
});
