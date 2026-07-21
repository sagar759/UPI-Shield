import { describe, expect, it } from "vitest";
import {
  DemoScenarioSchema,
  TransactionCheckInputSchema,
  MessageCheckInputSchema,
  ReceiverCheckInputSchema,
} from "../../lib/contracts/schemas";
import {
  ALL_DEMO_PROFILES,
  DEMO_CONTACTS,
  DEMO_RECENT_ACTIVITY,
  DEMO_SCENARIOS,
  PRESENTATION_SCENARIO_IDS,
  getDemoScenarioById,
  getRawScenarioInputs,
  REGRESSION_EXPECTATIONS,
} from "./index";

describe("Demo Data and Scenario Catalog Fixture Validation", () => {
  describe("Zod Runtime Schema Parsing", () => {
    it("should successfully parse all 11 catalog scenarios with DemoScenarioSchema", () => {
      expect(DEMO_SCENARIOS.length).toBe(11);
      for (const scenario of DEMO_SCENARIOS) {
        const parseResult = DemoScenarioSchema.safeParse(scenario);
        expect(
          parseResult.success,
          `Failed to parse scenario ${scenario.scenarioId}: ${JSON.stringify(parseResult.error)}`
        ).toBe(true);
      }
    });

    it("should successfully parse all 5 required presentation scenarios", () => {
      for (const scenarioId of PRESENTATION_SCENARIO_IDS) {
        const scenario = getDemoScenarioById(scenarioId);
        expect(scenario).toBeDefined();

        // Transaction input schema
        const txnResult = TransactionCheckInputSchema.safeParse(scenario?.transactionInput);
        expect(txnResult.success, `Transaction input parse error for ${scenarioId}`).toBe(true);

        // Optional Message input schema
        if (scenario?.messageInput) {
          const msgResult = MessageCheckInputSchema.safeParse(scenario.messageInput);
          expect(msgResult.success, `Message input parse error for ${scenarioId}`).toBe(true);
        }

        // Optional Receiver input schema
        if (scenario?.receiverInput) {
          const rcvResult = ReceiverCheckInputSchema.safeParse(scenario.receiverInput);
          expect(rcvResult.success, `Receiver input parse error for ${scenarioId}`).toBe(true);
        }
      }
    });
  });

  describe("Separation of Expected Labels from Production Raw Inputs", () => {
    it("should return raw input objects without expectedRiskBand or expectedReasons via getRawScenarioInputs", () => {
      for (const scenario of DEMO_SCENARIOS) {
        const rawInputs = getRawScenarioInputs(scenario.scenarioId);
        expect(rawInputs).toBeDefined();

        expect(rawInputs).not.toHaveProperty("expectedRiskBand");
        expect(rawInputs).not.toHaveProperty("expectedReasons");
        expect((rawInputs?.transactionInput as Record<string, unknown>)).not.toHaveProperty("expectedRiskBand");
      }
    });

    it("should maintain all regression expectations separately in REGRESSION_EXPECTATIONS manifest", () => {
      for (const scenario of DEMO_SCENARIOS) {
        const expectation = REGRESSION_EXPECTATIONS[scenario.scenarioId];
        expect(expectation, `Missing regression expectation for ${scenario.scenarioId}`).toBeDefined();
        expect(expectation.expectedRiskBand).toBe(scenario.expectedRiskBand);
        expect(expectation.expectedReasons).toEqual(scenario.expectedReasons);
      }
    });
  });

  describe("Uniqueness and ID Integrity", () => {
    it("should have unique scenario IDs", () => {
      const ids = DEMO_SCENARIOS.map((s) => s.scenarioId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique transaction IDs", () => {
      const ids = DEMO_SCENARIOS.map((s) => s.transactionInput.raw.transactionId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique user profile IDs", () => {
      const ids = ALL_DEMO_PROFILES.map((p) => p.profileId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique contact IDs", () => {
      const ids = DEMO_CONTACTS.map((c) => c.contactId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Referential Integrity", () => {
    const profileIdSet = new Set(ALL_DEMO_PROFILES.map((p) => p.profileId));

    it("should ensure every transaction sender and receiver exists in known demo profiles", () => {
      for (const scenario of DEMO_SCENARIOS) {
        expect(profileIdSet.has(scenario.transactionInput.raw.senderId)).toBe(true);
        expect(profileIdSet.has(scenario.transactionInput.raw.receiverId)).toBe(true);
      }
    });

    it("should ensure all contact profileIds reference existing user profiles", () => {
      for (const contact of DEMO_CONTACTS) {
        expect(profileIdSet.has(contact.profileId)).toBe(true);
      }
    });

    it("should ensure recent activity records reference valid senders and receivers", () => {
      for (const activity of DEMO_RECENT_ACTIVITY) {
        expect(profileIdSet.has(activity.senderId)).toBe(true);
        expect(profileIdSet.has(activity.receiverId)).toBe(true);
      }
    });
  });

  describe("Synthetic Provenance and Secret-like Identifier Checks", () => {
    it("should contain zero secret-like credentials (PIN, OTP, CVV, passwords) in message texts", () => {
      const secretRegex = /\b(otp|cvv|pin|password|passcode)\b\s*[:=]?\s*\d{4,6}/i;

      for (const scenario of DEMO_SCENARIOS) {
        if (scenario.messageInput) {
          const text = scenario.messageInput.messageText;
          // Ensure messages don't contain real active OTP/PIN values like "OTP: 123456"
          expect(secretRegex.test(text)).toBe(false);
        }
      }
    });

    it("should use obvious test placeholders for VPA domains and phone numbers", () => {
      for (const profile of ALL_DEMO_PROFILES) {
        if (!profile.isVerified) {
          expect(profile.maskedVpa).toMatch(/TEST_VPA_|example\.invalid|@upi/);
        }
      }
    });
  });

  describe("Hard Legitimate Cases Challenge Each Detector Family", () => {
    it("should challenge transaction detector family with hard legitimate cases", () => {
      // First verified merchant -> TXN_NEW_PAYEE
      const firstMerchant = getDemoScenarioById("scenario-first-verified-merchant");
      expect(firstMerchant?.expectedReasons).toContain("TXN_NEW_PAYEE");
      expect(firstMerchant?.expectedRiskBand).toBe("low");

      // Emergency hospital payment -> TXN_AMOUNT_RATIO_HIGH & TXN_HOUR_DEVIATION
      const hospital = getDemoScenarioById("scenario-emergency-hospital-payment");
      expect(hospital?.expectedReasons).toContain("TXN_AMOUNT_RATIO_HIGH");
      expect(hospital?.expectedReasons).toContain("TXN_HOUR_DEVIATION");
      expect(hospital?.expectedRiskBand).toBe("medium");

      // Travel device change -> TXN_DEVICE_CHANGE & TXN_LOCATION_CHANGE
      const travel = getDemoScenarioById("scenario-travel-device-change");
      expect(travel?.expectedReasons).toContain("TXN_DEVICE_CHANGE");
      expect(travel?.expectedReasons).toContain("TXN_LOCATION_CHANGE");
      expect(travel?.expectedRiskBand).toBe("medium");

      // Recurring high value rent -> TXN_AMOUNT_ZSCORE_HIGH
      const highRent = getDemoScenarioById("scenario-recurring-high-value-rent");
      expect(highRent?.expectedReasons).toContain("TXN_AMOUNT_ZSCORE_HIGH");
      expect(highRent?.expectedRiskBand).toBe("medium");
    });

    it("should challenge text detector family with benign advisory wording", () => {
      // Benign bank warning -> advisory text with OTP/limit advice, but overall low risk outcome
      const bankAdv = getDemoScenarioById("scenario-benign-bank-warning");
      expect(bankAdv?.messageInput?.messageText).toContain("Security Advisory");
      expect(bankAdv?.expectedRiskBand).toBe("low");
      expect(bankAdv?.expectedReasons).toContain("OUT_LOW_RISK");
    });

    it("should challenge receiver graph detector family with high fan-in merchant", () => {
      // High fan-in merchant -> RCV_UNIQUE_SENDERS_HIGH but low pass-through ratio
      const ticketMerchant = getDemoScenarioById("scenario-high-fan-in-merchant");
      expect(ticketMerchant?.expectedReasons).toContain("RCV_UNIQUE_SENDERS_HIGH");
      expect(ticketMerchant?.receiverInput?.features.passThroughRatio30m).toBeLessThan(0.1);
      expect(ticketMerchant?.expectedRiskBand).toBe("medium");
    });
  });

  describe("Fixture Determinism", () => {
    it("should produce identical raw fixture objects for a fixed scenario ID across multiple invocations", () => {
      const firstCall = getRawScenarioInputs("scenario-student-investment");
      const secondCall = getRawScenarioInputs("scenario-student-investment");

      expect(firstCall).toEqual(secondCall);
      expect(JSON.stringify(firstCall)).toBe(JSON.stringify(secondCall));
    });
  });
});
