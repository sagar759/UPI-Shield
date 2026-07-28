import { describe, expect, it } from "vitest";
import {
  validateAnalyzerIntent,
  buildAnalyzerUrl,
  resolveContactById,
  SUPPORTED_ANALYZER_INTENTS,
  DEFAULT_ANALYZER_INTENT,
} from "@/lib/navigation/analyzer-intent";

describe("Analyzer Intent & Navigation Helpers", () => {
  describe("validateAnalyzerIntent", () => {
    it("returns supported intent when valid string is provided", () => {
      SUPPORTED_ANALYZER_INTENTS.forEach((intent) => {
        expect(validateAnalyzerIntent(intent)).toBe(intent);
      });
    });

    it("normalizes uppercase and padded mode strings", () => {
      expect(validateAnalyzerIntent("  SCAN-PAY  ")).toBe("scan-pay");
      expect(validateAnalyzerIntent("BANK-TRANSFER")).toBe("bank-transfer");
    });

    it("falls back safely to default mode when null, undefined, or invalid mode string is provided", () => {
      expect(validateAnalyzerIntent(null)).toBe(DEFAULT_ANALYZER_INTENT);
      expect(validateAnalyzerIntent(undefined)).toBe(DEFAULT_ANALYZER_INTENT);
      expect(validateAnalyzerIntent("")).toBe(DEFAULT_ANALYZER_INTENT);
      expect(validateAnalyzerIntent("invalid-mode-xxx")).toBe(DEFAULT_ANALYZER_INTENT);
      expect(validateAnalyzerIntent("pay_money_now")).toBe(DEFAULT_ANALYZER_INTENT);
    });
  });

  describe("buildAnalyzerUrl", () => {
    it("builds clean analyzer URL with default mode if unspecified", () => {
      expect(buildAnalyzerUrl()).toBe("/analyze?mode=scan-pay");
    });

    it("builds URL with validated mode", () => {
      expect(buildAnalyzerUrl({ mode: "pay-contact" })).toBe("/analyze?mode=pay-contact");
      expect(buildAnalyzerUrl({ mode: "bank-transfer" })).toBe("/analyze?mode=bank-transfer");
    });

    it("includes synthetic contactId when provided", () => {
      expect(
        buildAnalyzerUrl({ mode: "pay-contact", contactId: "contact_landlord_001" })
      ).toBe("/analyze?mode=pay-contact&contactId=contact_landlord_001");
    });

    it("ENFORCES PRIVACY BOUNDARY: rejects unmasked VPA in contactId", () => {
      const urlWithVpa = buildAnalyzerUrl({
        mode: "pay-contact",
        contactId: "ramesh.verma@okaxis",
      });
      expect(urlWithVpa).toBe("/analyze?mode=pay-contact");
      expect(urlWithVpa).not.toContain("ramesh.verma@okaxis");
      expect(urlWithVpa).not.toContain("@");
    });

    it("includes scenarioId when provided", () => {
      expect(
        buildAnalyzerUrl({ mode: "demo-scenarios", scenarioId: "scen_phishing_01" })
      ).toBe("/analyze?mode=demo-scenarios&scenario=scen_phishing_01");
    });
  });

  describe("resolveContactById", () => {
    it("resolves synthetic contact details for valid contactId", () => {
      const contact = resolveContactById("contact_landlord_001");
      expect(contact).toBeDefined();
      expect(contact?.displayName).toBe("Ramesh Verma (Landlord)");
      expect(contact?.contactId).toBe("contact_landlord_001");
    });

    it("returns undefined for unknown or empty contactId", () => {
      expect(resolveContactById(undefined)).toBeUndefined();
      expect(resolveContactById("")).toBeUndefined();
      expect(resolveContactById("non_existent_id")).toBeUndefined();
    });

    it("returns undefined when unmasked VPA is passed instead of contactId", () => {
      expect(resolveContactById("ramesh.verma@okaxis")).toBeUndefined();
    });
  });
});
