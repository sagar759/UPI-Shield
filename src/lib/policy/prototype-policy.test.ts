import { describe, expect, it } from "vitest";
import { PROTOTYPE_POLICY, validatePolicy, PolicyConfig } from "./prototype-policy";
import { REASON_CODES } from "../reasons/reason-codes";
import {
  REASON_METADATA_CATALOG,
  validateReasonCatalog,
  selectConsumerReasons,
} from "../reasons/reason-metadata";
import { DetectorName } from "../../types/detector";

describe("UPI Shield Policy Configuration & Reason Catalog (Spec 05)", () => {
  describe("Policy Configuration Invariants", () => {
    it("should pass verification for the prototype policy configuration", () => {
      expect(() => validatePolicy(PROTOTYPE_POLICY)).not.toThrow();
    });

    it("should have correct weights summing to 1.0", () => {
      expect(PROTOTYPE_POLICY.weights.transaction).toBe(0.45);
      expect(PROTOTYPE_POLICY.weights.message).toBe(0.30);
      expect(PROTOTYPE_POLICY.weights.receiver).toBe(0.25);
      expect(
        PROTOTYPE_POLICY.weights.transaction +
          PROTOTYPE_POLICY.weights.message +
          PROTOTYPE_POLICY.weights.receiver
      ).toBe(1.0);
    });

    it("should reject weights that do not sum to 1.0", () => {
      const invalidPolicy: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        weights: {
          transaction: 0.5,
          message: 0.3,
          receiver: 0.3, // Sums to 1.1
        },
      };
      expect(() => validatePolicy(invalidPolicy)).toThrow("Total weights must sum to exactly 1.0");
    });

    it("should reject negative weights", () => {
      const invalidPolicy: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        weights: {
          transaction: 0.8,
          message: -0.1,
          receiver: 0.3,
        },
      };
      expect(() => validatePolicy(invalidPolicy)).toThrow(
        'Weight for detector "message" must be a finite, non-negative number'
      );
    });

    it("should reject non-finite weights", () => {
      const invalidPolicy: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        weights: {
          transaction: NaN,
          message: 0.5,
          receiver: 0.5,
        },
      };
      expect(() => validatePolicy(invalidPolicy)).toThrow(
        'Weight for detector "transaction" must be a finite, non-negative number'
      );
    });

    it("should reject invalid thresholds", () => {
      // 1. lowMax >= mediumMax
      const invalidPolicy1: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        thresholds: {
          lowMax: 0.5,
          mediumMax: 0.4,
        },
      };
      expect(() => validatePolicy(invalidPolicy1)).toThrow(
        "Threshold lowMax must be strictly less than mediumMax"
      );

      // 2. Out of range lowMax
      const invalidPolicy2: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        thresholds: {
          lowMax: -0.1,
          mediumMax: 0.7,
        },
      };
      expect(() => validatePolicy(invalidPolicy2)).toThrow(
        "Threshold lowMax must be a finite number between 0 and 1"
      );

      // 3. Out of range mediumMax
      const invalidPolicy3: PolicyConfig = {
        ...PROTOTYPE_POLICY,
        thresholds: {
          lowMax: 0.4,
          mediumMax: 1.2,
        },
      };
      expect(() => validatePolicy(invalidPolicy3)).toThrow(
        "Threshold mediumMax must be a finite number between 0 and 1"
      );
    });
  });

  describe("Score Boundaries Classification (Decision Boundaries)", () => {
    // Helper to evaluate band from thresholds mimicking future fusion mapping
    const getRiskBand = (score: number, thresholds: typeof PROTOTYPE_POLICY.thresholds) => {
      if (score < thresholds.lowMax) return "low";
      if (score >= thresholds.lowMax && score < thresholds.mediumMax) return "medium";
      return "high";
    };

    it("should classify boundary score 0 as low", () => {
      expect(getRiskBand(0, PROTOTYPE_POLICY.thresholds)).toBe("low");
    });

    it("should classify boundary score 0.399... (0.39999) as low", () => {
      expect(getRiskBand(0.39999, PROTOTYPE_POLICY.thresholds)).toBe("low");
    });

    it("should classify boundary score 0.40 as medium", () => {
      expect(getRiskBand(0.40, PROTOTYPE_POLICY.thresholds)).toBe("medium");
    });

    it("should classify boundary score 0.699... (0.69999) as medium", () => {
      expect(getRiskBand(0.69999, PROTOTYPE_POLICY.thresholds)).toBe("medium");
    });

    it("should classify boundary score 0.70 as high", () => {
      expect(getRiskBand(0.70, PROTOTYPE_POLICY.thresholds)).toBe("high");
    });

    it("should classify boundary score 1.0 as high", () => {
      expect(getRiskBand(1.0, PROTOTYPE_POLICY.thresholds)).toBe("high");
    });
  });

  describe("Reason Catalog Invariants", () => {
    it("should pass verification for the default reason catalog", () => {
      expect(() => validateReasonCatalog(REASON_METADATA_CATALOG)).not.toThrow();
    });

    it("should reject catalog with duplicate reason codes", () => {
      const duplicateCatalog = { ...REASON_METADATA_CATALOG };
      
       const originalEntries = Object.entries;
      Object.entries = (obj: unknown) => {
        if (obj === duplicateCatalog) {
          return [
            ...originalEntries(REASON_METADATA_CATALOG),
            [
              REASON_CODES.TXN_AMOUNT_RATIO_HIGH,
              REASON_METADATA_CATALOG[REASON_CODES.TXN_AMOUNT_RATIO_HIGH],
            ],
          ] as unknown as ReturnType<typeof originalEntries>;
        }
        return originalEntries(obj as Parameters<typeof originalEntries>[0]);
      };

      try {
        expect(() => validateReasonCatalog(duplicateCatalog)).toThrow(
          "Duplicate reason code detected in catalog: TXN_AMOUNT_RATIO_HIGH"
        );
      } finally {
        Object.entries = originalEntries;
      }
    });

    it("should reject catalog with unsupported detector ownership", () => {
      const invalidCatalog = {
        ...REASON_METADATA_CATALOG,
        [REASON_CODES.TXN_AMOUNT_RATIO_HIGH]: {
          ...REASON_METADATA_CATALOG[REASON_CODES.TXN_AMOUNT_RATIO_HIGH],
          sourceDetector: "network-detector" as unknown as DetectorName, // Unsupported detector
        },
      };

      expect(() => validateReasonCatalog(invalidCatalog)).toThrow(
        'Unsupported detector ownership: "network-detector"'
      );
    });

    it("should reject catalog with invalid severity range bounds", () => {
      const invalidCatalog = {
        ...REASON_METADATA_CATALOG,
        [REASON_CODES.TXN_AMOUNT_RATIO_HIGH]: {
          ...REASON_METADATA_CATALOG[REASON_CODES.TXN_AMOUNT_RATIO_HIGH],
          severityRange: { min: 0.9, max: 0.5 }, // min > max
        },
      };

      expect(() => validateReasonCatalog(invalidCatalog)).toThrow(
        "Invalid severity range [0.9, 0.5]"
      );
    });
  });

  describe("Reason Selection and Tie-Breaking", () => {
    it("should filter out non-consumer-displayable reasons (e.g. SIG_*)", () => {
      const input = [
        { code: REASON_CODES.TXN_NEW_PAYEE, severity: 0.5 },
        { code: REASON_CODES.SIG_TEXT_UNAVAILABLE }, // non-displayable
        { code: REASON_CODES.SCAM_URGENCY, severity: 0.6 },
      ];

      const selected = selectConsumerReasons(input);
      expect(selected).toContain(REASON_CODES.TXN_NEW_PAYEE);
      expect(selected).toContain(REASON_CODES.SCAM_URGENCY);
      expect(selected).not.toContain(REASON_CODES.SIG_TEXT_UNAVAILABLE);
    });

    it("should sort reasons by severity descending", () => {
      const input = [
        { code: REASON_CODES.TXN_NEW_PAYEE, severity: 0.3 },
        { code: REASON_CODES.SCAM_THREAT, severity: 0.9 },
        { code: REASON_CODES.RCV_NEW_ACCOUNT, severity: 0.6 },
      ];

      const selected = selectConsumerReasons(input);
      expect(selected).toEqual([
        REASON_CODES.SCAM_THREAT,      // 0.9
        REASON_CODES.RCV_NEW_ACCOUNT,  // 0.6
        REASON_CODES.TXN_NEW_PAYEE,    // 0.3
      ]);
    });

    it("should deterministically break ties alphabetically by ReasonCode", () => {
      // SCAM_THREAT and SCAM_URGENCY both have severity 0.8
      // SCAM_THREAT should come before SCAM_URGENCY alphabetically
      const input = [
        { code: REASON_CODES.SCAM_URGENCY, severity: 0.8 },
        { code: REASON_CODES.SCAM_THREAT, severity: 0.8 },
      ];

      const selected = selectConsumerReasons(input);
      expect(selected).toEqual([
        REASON_CODES.SCAM_THREAT,
        REASON_CODES.SCAM_URGENCY,
      ]);
    });

    it("should cap the displayable reasons at 5", () => {
      const input = [
        { code: REASON_CODES.TXN_NEW_PAYEE, severity: 0.8 },
        { code: REASON_CODES.TXN_AMOUNT_RATIO_HIGH, severity: 0.7 },
        { code: REASON_CODES.SCAM_THREAT, severity: 0.6 },
        { code: REASON_CODES.SCAM_URGENCY, severity: 0.5 },
        { code: REASON_CODES.RCV_NEW_ACCOUNT, severity: 0.4 },
        { code: REASON_CODES.RCV_PASS_THROUGH_RATIO_HIGH, severity: 0.3 },
      ];

      const selected = selectConsumerReasons(input);
      expect(selected.length).toBe(5);
      expect(selected).toEqual([
        REASON_CODES.TXN_NEW_PAYEE,
        REASON_CODES.TXN_AMOUNT_RATIO_HIGH,
        REASON_CODES.SCAM_THREAT,
        REASON_CODES.SCAM_URGENCY,
        REASON_CODES.RCV_NEW_ACCOUNT,
      ]);
      expect(selected).not.toContain(REASON_CODES.RCV_PASS_THROUGH_RATIO_HIGH);
    });

    it("should satisfy minimum useful reasons rule for medium/high outcomes when evidence exists", () => {
      // If evidence (displayable reasons) exists, we return up to 5 reasons.
      // If 1 reason exists, it returns 1. If >= 2 exist, it returns at least 2.
      const inputSingle = [{ code: REASON_CODES.SCAM_THREAT, severity: 0.8 }];
      expect(selectConsumerReasons(inputSingle).length).toBe(1);

      const inputDouble = [
        { code: REASON_CODES.SCAM_THREAT, severity: 0.8 },
        { code: REASON_CODES.TXN_NEW_PAYEE, severity: 0.4 },
      ];
      expect(selectConsumerReasons(inputDouble).length).toBe(2);
    });
  });
});
