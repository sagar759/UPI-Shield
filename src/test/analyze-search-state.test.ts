import { describe, expect, it } from "vitest";
import {
  normalizeAnalyzerMode,
  parseAnalyzeSearchParams,
  buildAnalyzeSearchUrl,
  DEFAULT_ANALYZER_MODE,
  SUPPORTED_ANALYZER_MODES,
} from "@/lib/navigation/analyze-search-state";

describe("Analyze Search State Helpers", () => {
  describe("normalizeAnalyzerMode", () => {
    it("returns canonical mode when valid string is provided", () => {
      SUPPORTED_ANALYZER_MODES.forEach((mode) => {
        expect(normalizeAnalyzerMode(mode)).toBe(mode);
      });
    });

    it("normalizes mode aliases and intents from Spec 15", () => {
      expect(normalizeAnalyzerMode("scan-pay")).toBe("transaction");
      expect(normalizeAnalyzerMode("pay-contact")).toBe("transaction");
      expect(normalizeAnalyzerMode("bank-transfer")).toBe("transaction");
      expect(normalizeAnalyzerMode("check-upi-id")).toBe("transaction");
      expect(normalizeAnalyzerMode("demo-scenarios")).toBe("transaction");

      expect(normalizeAnalyzerMode("scam-message")).toBe("message");
      expect(normalizeAnalyzerMode("text")).toBe("message");

      expect(normalizeAnalyzerMode("mule-receiver")).toBe("receiver");
      expect(normalizeAnalyzerMode("mule")).toBe("receiver");
    });

    it("handles case and whitespace normalization", () => {
      expect(normalizeAnalyzerMode("  TRANSACTION  ")).toBe("transaction");
      expect(normalizeAnalyzerMode("  MESSAGE  ")).toBe("message");
      expect(normalizeAnalyzerMode("  RECEIVER  ")).toBe("receiver");
    });

    it("falls back safely to default mode ('transaction') for unknown/invalid mode strings", () => {
      expect(normalizeAnalyzerMode(null)).toBe(DEFAULT_ANALYZER_MODE);
      expect(normalizeAnalyzerMode(undefined)).toBe(DEFAULT_ANALYZER_MODE);
      expect(normalizeAnalyzerMode("")).toBe(DEFAULT_ANALYZER_MODE);
      expect(normalizeAnalyzerMode("invalid-mode-xyz")).toBe(DEFAULT_ANALYZER_MODE);
    });
  });

  describe("parseAnalyzeSearchParams", () => {
    it("parses URLSearchParams object correctly", () => {
      const params = new URLSearchParams("mode=message&contactId=contact_landlord_001");
      const parsed = parseAnalyzeSearchParams(params);

      expect(parsed.mode).toBe("message");
      expect(parsed.contactId).toBe("contact_landlord_001");
      expect(parsed.resolvedContact).toBeDefined();
      expect(parsed.resolvedContact?.displayName).toBe("Ramesh Verma (Landlord)");
    });

    it("parses plain object searchParams safely", () => {
      const parsed = parseAnalyzeSearchParams({
        mode: "receiver",
        scenario: "scen_mule_01",
      });

      expect(parsed.mode).toBe("receiver");
      expect(parsed.scenarioId).toBe("scen_mule_01");
    });

    it("falls back safely on empty or invalid search params", () => {
      const parsed = parseAnalyzeSearchParams(null);
      expect(parsed.mode).toBe("transaction");
      expect(parsed.contactId).toBeUndefined();
      expect(parsed.scenarioId).toBeUndefined();
      expect(parsed.resolvedContact).toBeUndefined();
    });

    it("ENFORCES PRIVACY BOUNDARY: rejects unmasked VPA in search params", () => {
      const parsed = parseAnalyzeSearchParams({
        mode: "pay-contact",
        contactId: "ramesh.verma@okaxis",
      });

      expect(parsed.mode).toBe("transaction");
      expect(parsed.contactId).toBeUndefined();
      expect(parsed.resolvedContact).toBeUndefined();
    });
  });

  describe("buildAnalyzeSearchUrl", () => {
    it("builds clean URL with default mode when empty", () => {
      expect(buildAnalyzeSearchUrl()).toBe("/analyze?mode=transaction");
    });

    it("builds URL with mode and synthetic parameters", () => {
      expect(
        buildAnalyzeSearchUrl({
          mode: "message",
          scenarioId: "scen_phishing_01",
        })
      ).toBe("/analyze?mode=message&scenario=scen_phishing_01");
    });

    it("strips unmasked VPAs from constructed URLs", () => {
      const url = buildAnalyzeSearchUrl({
        mode: "transaction",
        contactId: "user@upi",
      });
      expect(url).toBe("/analyze?mode=transaction");
      expect(url).not.toContain("user@upi");
    });
  });
});
