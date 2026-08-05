import { describe, it, expect } from "vitest";
import { evaluateTransactionRisk, TRANSACTION_DETECTOR_VERSION } from "./transaction-detector";
import { scoreTransaction } from "./score-transaction";
import { DEFAULT_TRANSACTION_RULES } from "./rules";
import { DetectorResultSchema } from "@/lib/contracts/schemas";
import { REASON_CODES } from "@/lib/reasons/reason-codes";
import { TransactionCheckInput } from "@/types/transaction";
import { ProfileId, TransactionId, RupeeAmount, IsoTimestamp } from "@/lib/contracts/primitives";
import * as fs from "fs";
import * as path from "path";

// Helper to construct a base valid TransactionCheckInput fixture
function createFixture(
  overrides?: Partial<TransactionCheckInput["features"]>,
  rawOverrides?: Partial<TransactionCheckInput["raw"]>
): TransactionCheckInput {
  return {
    raw: {
      transactionId: "txn_test_001" as TransactionId,
      senderId: "prof_aarav_001" as ProfileId,
      receiverId: "prof_counter_001" as ProfileId,
      amount: 1000 as RupeeAmount,
      currency: "INR",
      timestamp: "2026-08-05T10:00:00.000Z" as IsoTimestamp,
      paymentType: "scan_pay",
      channel: "mobile_app",
      device: "Android_Pixel7_Aarav",
      region: "IN-DL",
      note: "Test payment",
      ...rawOverrides,
    },
    features: {
      amountRatio: 1.0,
      amountZScore: 0.0,
      isNewPayee: false,
      relationshipAgeDays: 60,
      isKnownRecurring: false,
      hourDeviation: 0.0,
      velocityCount5m: 0,
      velocityValue5m: 0,
      velocityCount30m: 0,
      velocityValue30m: 0,
      velocityCount60m: 0,
      velocityValue60m: 0,
      recentFailuresCount: 0,
      inactivityDays: 0.0,
      hasDeviceChange: false,
      hasLocationChange: false,
      isCollectRequest: false,
      hasRefundContext: false,
      nameMismatch: false,
      ...overrides,
    },
  };
}

describe("Deterministic Transaction Risk Detector (Spec 19)", () => {
  describe("Rule Boundaries and Reason Codes", () => {
    it("emits TXN_AMOUNT_RATIO_HIGH when amount ratio exceeds moderate threshold", () => {
      const fixture = createFixture({ amountRatio: 5.0 });
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThan(0.1);
      }
      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.TXN_AMOUNT_RATIO_HIGH);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_AMOUNT_RATIO_HIGH);
      expect(reason?.value).toBe(5.0);
    });

    it("emits TXN_AMOUNT_ZSCORE_HIGH when z-score exceeds moderate threshold", () => {
      const fixture = createFixture({ amountZScore: 3.8 });
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.TXN_AMOUNT_ZSCORE_HIGH);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_AMOUNT_ZSCORE_HIGH);
      expect(reason?.value).toBe(3.8);
    });

    it("emits TXN_NEW_PAYEE when payee is new or relationship is very short", () => {
      const fixtureNew = createFixture({ isNewPayee: true, relationshipAgeDays: 0 });
      const resultNew = evaluateTransactionRisk(fixtureNew);
      expect(resultNew.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_NEW_PAYEE);

      const fixtureShort = createFixture({ isNewPayee: false, relationshipAgeDays: 3 });
      const resultShort = evaluateTransactionRisk(fixtureShort);
      expect(resultShort.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_NEW_PAYEE);
    });

    it("emits TXN_HOUR_DEVIATION when active hour deviation is high", () => {
      const fixture = createFixture({ hourDeviation: 5.0 });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_HOUR_DEVIATION);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_HOUR_DEVIATION);
      expect(reason?.value).toBe(5.0);
    });

    it("emits deduplicated TXN_VELOCITY_HIGH picking top severity window", () => {
      const fixture = createFixture({
        velocityCount5m: 3,
        velocityValue5m: 15000,
        velocityCount30m: 5,
        velocityValue30m: 25000,
        velocityCount60m: 7,
        velocityValue60m: 35000,
      });
      const result = evaluateTransactionRisk(fixture);

      const velocityReasons = result.reasons.filter((r) => r.code === REASON_CODES.TXN_VELOCITY_HIGH);
      expect(velocityReasons).toHaveLength(1);
      expect(velocityReasons[0].value).toBe(3); // 5m window has highest count relative to threshold
    });

    it("emits TXN_FAILURES_COUNT_HIGH when recent failures count is high", () => {
      const fixture = createFixture({ recentFailuresCount: 3 });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_FAILURES_COUNT_HIGH);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_FAILURES_COUNT_HIGH);
      expect(reason?.value).toBe(3);
    });

    it("emits TXN_INACTIVITY_RESUME when account resumes after long inactivity", () => {
      const fixture = createFixture({ inactivityDays: 45.5 });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_INACTIVITY_RESUME);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_INACTIVITY_RESUME);
      expect(reason?.value).toBe(46);
    });

    it("emits TXN_DEVICE_CHANGE on device change", () => {
      const fixture = createFixture({ hasDeviceChange: true });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_DEVICE_CHANGE);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_DEVICE_CHANGE);
      expect(reason?.value).toBe(true);
    });

    it("emits TXN_LOCATION_CHANGE on location change", () => {
      const fixture = createFixture({ hasLocationChange: true });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_LOCATION_CHANGE);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_LOCATION_CHANGE);
      expect(reason?.value).toBe(true);
    });

    it("emits TXN_COLLECT_REQUEST on collect request", () => {
      const fixture = createFixture({ isCollectRequest: true });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_COLLECT_REQUEST);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_COLLECT_REQUEST);
      expect(reason?.value).toBe(true);
    });

    it("emits TXN_REFUND_CONTEXT on refund context", () => {
      const fixture = createFixture({ hasRefundContext: true });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_REFUND_CONTEXT);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_REFUND_CONTEXT);
      expect(reason?.value).toBe(true);
    });

    it("emits TXN_NAME_MISMATCH on payee display name mismatch", () => {
      const fixture = createFixture({ nameMismatch: true });
      const result = evaluateTransactionRisk(fixture);

      expect(result.reasons.map((r) => r.code)).toContain(REASON_CODES.TXN_NAME_MISMATCH);
      const reason = result.reasons.find((r) => r.code === REASON_CODES.TXN_NAME_MISMATCH);
      expect(reason?.value).toBe(true);
    });
  });

  describe("Specific Risk Scenarios & Legitimate Context", () => {
    it("handles Student Investment Scam fixture raising concrete risk reasons", () => {
      const fixture = createFixture({
        amountRatio: 4.5,
        amountZScore: 3.2,
        isNewPayee: true,
        relationshipAgeDays: 0,
        nameMismatch: true,
      });
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.35);
      }
      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.TXN_NEW_PAYEE);
      expect(reasonCodes).toContain(REASON_CODES.TXN_AMOUNT_RATIO_HIGH);
      expect(reasonCodes).toContain(REASON_CODES.TXN_NAME_MISMATCH);
    });

    it("handles Refund / Collect Request Scam raising concrete risk reasons", () => {
      const fixture = createFixture({
        isCollectRequest: true,
        hasRefundContext: true,
        isNewPayee: true,
      });
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.30);
      }
      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.TXN_COLLECT_REQUEST);
      expect(reasonCodes).toContain(REASON_CODES.TXN_REFUND_CONTEXT);
    });

    it("handles Account Takeover (device change + inactivity + amount ratio) raising concrete risk reasons", () => {
      const fixture = createFixture({
        hasDeviceChange: true,
        inactivityDays: 60,
        amountRatio: 6.0,
        amountZScore: 4.5,
      });
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        expect(result.score).toBeGreaterThanOrEqual(0.45);
      }
      const reasonCodes = result.reasons.map((r) => r.code);
      expect(reasonCodes).toContain(REASON_CODES.TXN_DEVICE_CHANGE);
      expect(reasonCodes).toContain(REASON_CODES.TXN_INACTIVITY_RESUME);
    });

    it("ensures Recurring High-Value Rent is low/medium risk, NEVER automatically high from amount alone", () => {
      const fixture = createFixture(
        {
          amountRatio: 8.0, // 8x median amount (e.g. ₹50,000 rent)
          amountZScore: 4.0,
          isKnownRecurring: true, // Recognized recurring payment pattern
          isNewPayee: false,
          relationshipAgeDays: 180,
          hasDeviceChange: false,
          hasLocationChange: false,
        },
        { amount: 50000 as RupeeAmount }
      );
      const result = evaluateTransactionRisk(fixture);

      expect(result.availability).toBe("available");
      if (result.availability === "available") {
        // Transaction score must stay low or medium (< 0.70 threshold for high risk in Spec 05)
        expect(result.score).toBeLessThan(0.40);
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      }
    });
  });

  describe("Unavailable and Degraded Inputs", () => {
    it("returns availability = unavailable when input is null or undefined", () => {
      const resultNull = evaluateTransactionRisk(null);
      expect(resultNull.availability).toBe("unavailable");
      if (resultNull.availability === "unavailable") {
        expect(resultNull.score).toBeNull();
        expect(resultNull.confidence).toBeNull();
      }
      expect(resultNull.reasons).toEqual([]);

      const resultUndefined = evaluateTransactionRisk(undefined);
      expect(resultUndefined.availability).toBe("unavailable");
      if (resultUndefined.availability === "unavailable") {
        expect(resultUndefined.score).toBeNull();
        expect(resultUndefined.confidence).toBeNull();
      }
    });

    it("returns availability = unavailable when input schema validation fails", () => {
      const invalidFixture = { raw: {}, features: {} } as unknown as TransactionCheckInput;
      const result = evaluateTransactionRisk(invalidFixture);

      expect(result.availability).toBe("unavailable");
      if (result.availability === "unavailable") {
        expect(result.score).toBeNull();
        expect(result.confidence).toBeNull();
      }
    });

    it("returns availability = degraded when raw amount is non-positive", () => {
      const degradedFixture = createFixture({}, { amount: 0 as RupeeAmount });
      const result = evaluateTransactionRisk(degradedFixture);

      expect(result.availability).toBe("degraded");
      if (result.availability === "degraded") {
        expect(result.score).not.toBeNull();
        expect(result.confidence).not.toBeNull();
        expect(result.degradedReason).toBe("Invalid or zero transaction amount in raw input context.");
      }
    });
  });

  describe("Runtime Constraints, Clock Injection, and Determinism", () => {
    it("measures latency using an injected mock clock", () => {
      let tick = 100;
      const mockClock = () => {
        tick += 15;
        return tick;
      };
      const fixture = createFixture();
      const result = evaluateTransactionRisk(fixture, { clock: mockClock });

      expect(result.latencyMs).toBe(15);
    });

    it("produces deterministic output for identical input", () => {
      const fixture = createFixture({ amountRatio: 3.5, hasDeviceChange: true });
      const r1 = evaluateTransactionRisk(fixture, { clock: () => 100 });
      const r2 = evaluateTransactionRisk(fixture, { clock: () => 100 });

      expect(r1).toEqual(r2);
    });

    it("strictly satisfies DetectorResultSchema", () => {
      const fixture = createFixture({ isCollectRequest: true, amountZScore: 3.0 });
      const result = evaluateTransactionRisk(fixture);

      const parsed = DetectorResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
      expect(result.version).toBe(TRANSACTION_DETECTOR_VERSION);
    });

    it("verifies module independence (imports no text/graph detector or fusion module)", () => {
      const sourcePath = path.join(__dirname, "transaction-detector.ts");
      const code = fs.readFileSync(sourcePath, "utf-8");

      expect(code).not.toContain("scam-language");
      expect(code).not.toContain("mule-account");
      expect(code).not.toContain("risk-fusion");
      expect(code).not.toContain("message-detector");
      expect(code).not.toContain("receiver-detector");
    });
  });

  describe("Custom Rule Validation and Direct scoreTransaction Callers", () => {
    it("rejects invalid custom rule weight in scoreTransaction and evaluateTransactionRisk", () => {
      const fixture = createFixture();
      const invalidRules = {
        ...DEFAULT_TRANSACTION_RULES,
        weights: {
          ...DEFAULT_TRANSACTION_RULES.weights,
          amountRatio: 1.5, // Invalid weight > 1.0
        },
      } as unknown as typeof DEFAULT_TRANSACTION_RULES;

      expect(() => scoreTransaction(fixture.features, invalidRules)).toThrow(
        /Weight 'amountRatio' must be a finite number between 0.0 and 1.0/
      );
      expect(() => evaluateTransactionRisk(fixture, { rules: invalidRules })).toThrow(
        /Weight 'amountRatio' must be a finite number between 0.0 and 1.0/
      );
    });

    it("rejects unordered amountRatio cutoffs in custom rules", () => {
      const fixture = createFixture();
      const invalidRules = {
        ...DEFAULT_TRANSACTION_RULES,
        thresholds: {
          ...DEFAULT_TRANSACTION_RULES.thresholds,
          amountRatio: { moderate: 5.0, high: 2.0, extreme: 8.0 }, // Unordered moderate > high
        },
      } as unknown as typeof DEFAULT_TRANSACTION_RULES;

      expect(() => scoreTransaction(fixture.features, invalidRules)).toThrow(
        /amountRatio cutoffs must be finite non-negative numbers ordered moderate <= high <= extreme/
      );
    });

    it("rejects unsupported rule version such as transaction-rules/v2", () => {
      const fixture = createFixture();
      const invalidRules = {
        ...DEFAULT_TRANSACTION_RULES,
        version: "transaction-rules/v2",
      } as unknown as typeof DEFAULT_TRANSACTION_RULES;

      expect(() => evaluateTransactionRisk(fixture, { rules: invalidRules })).toThrow(
        /Unsupported rule version 'transaction-rules\/v2'/
      );
    });

    it("rejects rule configurations with missing weight keys such as weights: {}", () => {
      const fixture = createFixture();
      const invalidRules = {
        ...DEFAULT_TRANSACTION_RULES,
        weights: {},
      } as unknown as typeof DEFAULT_TRANSACTION_RULES;

      expect(() => scoreTransaction(fixture.features, invalidRules)).toThrow(
        /Weight 'amountRatio' must be a finite number between 0.0 and 1.0/
      );
    });

    it("evaluates direct scoreTransaction callers with valid rules", () => {
      const fixture = createFixture({ amountRatio: 3.0 });
      const result = scoreTransaction(fixture.features);

      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
