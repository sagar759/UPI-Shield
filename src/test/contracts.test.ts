import { describe, expect, it } from "vitest";
import {
  DetectorResultSchema,
  ReasonCodeSchema,
  TransactionInputSchema,
  MessageCheckInputSchema,
  DecisionAuditRecordSchema,
  RiskDecisionSchema,
} from "../lib/contracts/schemas";
import { DetectorVersion } from "../lib/contracts/primitives";
import { DetectorName } from "../types/detector";

describe("UPI Shield Domain Contracts and Schemas", () => {
  describe("DetectorResultSchema", () => {
    const baseDetector = {
      name: "transaction" as const,
      version: "detector-version-1.0.0" as unknown as DetectorVersion,
      reasons: [],
      latencyMs: 120,
    };

    it("should parse valid available detector with score and confidence", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "available",
        score: 0.85,
        confidence: 0.9,
      });
      expect(result.success).toBe(true);
    });

    it("should parse valid degraded detector with score, confidence, and degradedReason", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "degraded",
        score: 0.45,
        confidence: 0.3,
        degradedReason: "API timeout, fallback to static baseline",
      });
      expect(result.success).toBe(true);
    });

    it("should parse valid unavailable detector with no score or confidence", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "unavailable",
      });
      expect(result.success).toBe(true);
    });

    it("should reject unavailable detector carrying a fabricated numeric score", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "unavailable",
        score: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject unavailable detector carrying a fabricated numeric confidence", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "unavailable",
        confidence: 0.7,
      });
      expect(result.success).toBe(false);
    });

    it("should reject score or confidence outside 0-1", () => {
      const result = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "available",
        score: 1.2,
        confidence: 0.9,
      });
      expect(result.success).toBe(false);

      const result2 = DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "available",
        score: 0.5,
        confidence: -0.1,
      });
      expect(result2.success).toBe(false);
    });

    it("should reject NaN or Infinity scores/confidences", () => {
      expect(DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "available",
        score: NaN,
        confidence: 0.9,
      }).success).toBe(false);

      expect(DetectorResultSchema.safeParse({
        ...baseDetector,
        availability: "available",
        score: 0.5,
        confidence: Infinity,
      }).success).toBe(false);
    });
  });

  describe("ReasonCodeSchema", () => {
    it("should parse stable reason codes containing only A-Z, 0-9, and _", () => {
      expect(ReasonCodeSchema.safeParse("NEW_PAYEE").success).toBe(true);
      expect(ReasonCodeSchema.safeParse("HIGH_AMOUNT_30M").success).toBe(true);
    });

    it("should reject lowercase, spaces, or special characters in reason codes", () => {
      expect(ReasonCodeSchema.safeParse("new_payee").success).toBe(false);
      expect(ReasonCodeSchema.safeParse("NEW PAYEE").success).toBe(false);
      expect(ReasonCodeSchema.safeParse("NEW-PAYEE!").success).toBe(false);
    });
  });

  describe("TransactionInputSchema amount verification", () => {
    const validRawInput = {
      transactionId: "TXN12345",
      senderId: "SENDER001",
      receiverId: "RECEIVER002",
      amount: 1500.5,
      currency: "INR" as const,
      timestamp: "2026-07-19T01:35:34+05:30",
      paymentType: "pay_contact" as const,
      channel: "UPI_APP",
      device: "Pixel_7a",
      region: "KA-IN",
      note: "Rent payment",
    };

    it("should parse valid non-negative rupee amounts", () => {
      expect(TransactionInputSchema.safeParse(validRawInput).success).toBe(true);

      const zeroAmountInput = { ...validRawInput, amount: 0 };
      expect(TransactionInputSchema.safeParse(zeroAmountInput).success).toBe(true);
    });

    it("should reject negative rupee amounts", () => {
      const negativeAmountInput = { ...validRawInput, amount: -100 };
      expect(TransactionInputSchema.safeParse(negativeAmountInput).success).toBe(false);
    });

    it("should reject NaN or Infinity rupee amounts", () => {
      expect(TransactionInputSchema.safeParse({ ...validRawInput, amount: NaN }).success).toBe(false);
      expect(TransactionInputSchema.safeParse({ ...validRawInput, amount: Infinity }).success).toBe(false);
    });

    it("should reject empty, blank, or malformed identifiers", () => {
      expect(TransactionInputSchema.safeParse({ ...validRawInput, transactionId: "" }).success).toBe(false);
      expect(TransactionInputSchema.safeParse({ ...validRawInput, transactionId: "   " }).success).toBe(false);
      expect(TransactionInputSchema.safeParse({ ...validRawInput, transactionId: "TXN@123" }).success).toBe(false);
    });
  });

  describe("MessageCheckInputSchema", () => {
    const validMessageInput = {
      requestId: "REQ12345",
      messageText: "Hello, this is a scam check message.",
      consentGiven: true,
      timestamp: "2026-07-19T01:35:34+05:30",
    };

    it("should parse messages up to MAX_MESSAGE_LENGTH", () => {
      expect(MessageCheckInputSchema.safeParse(validMessageInput).success).toBe(true);

      const maxLenText = "a".repeat(10_000);
      expect(MessageCheckInputSchema.safeParse({ ...validMessageInput, messageText: maxLenText }).success).toBe(true);
    });

    it("should reject messages exceeding MAX_MESSAGE_LENGTH", () => {
      const tooLongText = "a".repeat(10_001);
      expect(MessageCheckInputSchema.safeParse({ ...validMessageInput, messageText: tooLongText }).success).toBe(false);
    });
  });

  describe("DecisionAuditRecordSchema", () => {
    const sampleDecision = {
      decisionId: "DEC001",
      requestId: "REQ001",
      timestamp: "2026-07-19T01:35:34+05:30",
      finalScore: 0.75,
      riskBand: "high" as const,
      recommendedAction: "interrupt" as const,
      coverage: {
        coverage: 1.0,
        availableDetectors: ["transaction", "message", "receiver"] as DetectorName[],
        unavailableDetectors: [] as DetectorName[],
      },
      detectors: {
        transaction: {
          name: "transaction" as const,
          version: "txn-v1" as unknown as DetectorVersion,
          availability: "available" as const,
          score: 0.7,
          confidence: 0.9,
          reasons: [],
          latencyMs: 50,
        },
        message: {
          name: "message" as const,
          version: "msg-v1" as unknown as DetectorVersion,
          availability: "available" as const,
          score: 0.8,
          confidence: 0.9,
          reasons: [],
          latencyMs: 120,
        },
        receiver: {
          name: "receiver" as const,
          version: "rcv-v1" as unknown as DetectorVersion,
          availability: "available" as const,
          score: 0.75,
          confidence: 0.8,
          reasons: [],
          latencyMs: 30,
        },
      },
      policyVersion: "risk-policy/v1" as const,
    };

    const validAuditRecord = {
      decision: sampleDecision,
      schemaVersion: "decision-audit-record/v1" as const,
      featureVersion: "feature-contract/v1" as const,
      policyVersion: "risk-policy/v1" as const,
      explanationCopyVersion: "explanation-copy/en-IN/v1" as const,
      storageVersion: "decision-storage/v1" as const,
      recordedAt: "2026-07-19T01:36:00+05:30",
      actions: [
        {
          actionId: "ACT001",
          decisionId: "DEC001",
          type: "cancel" as const,
          timestamp: "2026-07-19T01:36:05+05:30",
        },
      ],
    };

    it("should parse a complete valid audit record", () => {
      expect(DecisionAuditRecordSchema.safeParse(validAuditRecord).success).toBe(true);
    });

    it("should reject if any version metadata is missing or incorrect", () => {
      const missingVersion = { ...validAuditRecord } as unknown as Record<string, unknown>;
      delete missingVersion.schemaVersion;
      expect(DecisionAuditRecordSchema.safeParse(missingVersion).success).toBe(false);

      const incorrectVersion = { ...validAuditRecord, schemaVersion: "incorrect/v1" };
      expect(DecisionAuditRecordSchema.safeParse(incorrectVersion).success).toBe(false);
    });
  });

  describe("RiskDecisionSchema refinements", () => {
    const baseDecision = {
      decisionId: "DEC001",
      requestId: "REQ001",
      timestamp: "2026-07-19T01:35:34+05:30",
      finalScore: 0.75,
      riskBand: "high" as const,
      recommendedAction: "interrupt" as const,
      policyVersion: "risk-policy/v1" as const,
    };

    it("rejects if a detector record key does not match its result name", () => {
      const invalidDecision = {
        ...baseDecision,
        coverage: {
          coverage: 0.45,
          availableDetectors: ["transaction"] as DetectorName[],
          unavailableDetectors: [] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "message" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(invalidDecision).success).toBe(false);
    });

    it("rejects if coverage availability lists are inconsistent with detector results", () => {
      const invalidDecision = {
        ...baseDecision,
        coverage: {
          coverage: 0.45,
          availableDetectors: ["transaction", "message"] as DetectorName[],
          unavailableDetectors: [] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "transaction" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(invalidDecision).success).toBe(false);
    });

    it("rejects if available and unavailable lists overlap", () => {
      const invalidDecision = {
        ...baseDecision,
        coverage: {
          coverage: 0.45,
          availableDetectors: ["transaction"] as DetectorName[],
          unavailableDetectors: ["transaction"] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "transaction" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(invalidDecision).success).toBe(false);
    });

    it("rejects if coverage numeric value does not equal derived coverage state", () => {
      const invalidDecision = {
        ...baseDecision,
        coverage: {
          coverage: 0.8,
          availableDetectors: ["transaction"] as DetectorName[],
          unavailableDetectors: [] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "transaction" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(invalidDecision).success).toBe(false);
    });

    it("rejects full coverage (1.0) if any detector is unavailable", () => {
      const invalidDecision = {
        ...baseDecision,
        coverage: {
          coverage: 1.0,
          availableDetectors: ["transaction", "message"] as DetectorName[],
          unavailableDetectors: ["receiver"] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "transaction" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
          message: {
            name: "message" as const,
            version: "msg-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.8,
            confidence: 0.9,
            reasons: [],
            latencyMs: 120,
          },
          receiver: {
            name: "receiver" as const,
            version: "rcv-v1" as unknown as DetectorVersion,
            availability: "unavailable" as const,
            reasons: [],
            latencyMs: 30,
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(invalidDecision).success).toBe(false);
    });

    it("accepts valid degraded detector in coverage and score calculation", () => {
      const validDecision = {
        ...baseDecision,
        coverage: {
          coverage: 0.75,
          availableDetectors: ["transaction", "message"] as DetectorName[],
          unavailableDetectors: [] as DetectorName[],
        },
        detectors: {
          transaction: {
            name: "transaction" as const,
            version: "txn-v1" as unknown as DetectorVersion,
            availability: "available" as const,
            score: 0.7,
            confidence: 0.9,
            reasons: [],
            latencyMs: 50,
          },
          message: {
            name: "message" as const,
            version: "msg-v1" as unknown as DetectorVersion,
            availability: "degraded" as const,
            score: 0.8,
            confidence: 0.9,
            reasons: [],
            latencyMs: 120,
            degradedReason: "Fallback to keyword check",
          },
        },
      };
      expect(RiskDecisionSchema.safeParse(validDecision).success).toBe(true);
    });
  });

  describe("degradedReason whitespace-only rejection", () => {
    const baseDetector = {
      name: "message" as const,
      version: "detector-version-1.0.0" as unknown as DetectorVersion,
      reasons: [],
      latencyMs: 120,
      availability: "degraded" as const,
      score: 0.5,
      confidence: 0.8,
    };

    it("rejects whitespace-only values for degradedReason", () => {
      expect(DetectorResultSchema.safeParse({
        ...baseDetector,
        degradedReason: "   ",
      }).success).toBe(false);
    });

    it("accepts valid trimmed degradedReason", () => {
      const parsed = DetectorResultSchema.safeParse({
        ...baseDetector,
        degradedReason: "  Service timeout  ",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.availability).toBe("degraded");
        if (parsed.data.availability === "degraded") {
          expect(parsed.data.degradedReason).toBe("Service timeout");
        }
      }
    });
  });
});
