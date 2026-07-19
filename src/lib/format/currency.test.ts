import { describe, expect, it } from "vitest";
import { formatRupeeFull, formatRupeeCompact } from "./currency";

describe("Currency Formatting Utilities", () => {
  describe("formatRupeeFull", () => {
    it("should format standard amounts with Indian comma grouping", () => {
      expect(formatRupeeFull(1000)).toBe("₹1,000.00");
      expect(formatRupeeFull(100000)).toBe("₹1,00,000.00");
    });

    it("should support omitting the currency symbol", () => {
      expect(formatRupeeFull(123456.78, { includeSymbol: false })).toContain("1,23,456.78");
    });

    it("should support custom decimal places", () => {
      expect(formatRupeeFull(123.456, { decimals: 1 })).toBe("₹123.5");
      expect(formatRupeeFull(123.456, { decimals: 0 })).toBe("₹123");
    });

    it("should handle zero and negative values", () => {
      expect(formatRupeeFull(0)).toBe("₹0.00");
      expect(formatRupeeFull(-500.5)).toBe("₹-500.50");
    });

    it("should throw an error for non-finite values", () => {
      expect(() => formatRupeeFull(NaN)).toThrow();
      expect(() => formatRupeeFull(Infinity)).toThrow();
      expect(() => formatRupeeFull(-Infinity)).toThrow();
    });
  });

  describe("formatRupeeCompact", () => {
    it("should format amounts compactly using Indian numbering abbreviations", () => {
      // 1 Lakh (100,000) -> should format compactly
      const formattedLakh = formatRupeeCompact(100000, { includeSymbol: false });
      // Depending on the exact Node.js version environment, compact formatting may vary slightly,
      // but under en-IN it should contain 'L' or 'lakh' or 'Lakh'. Typically 'L' in short format.
      expect(formattedLakh.toLowerCase()).toContain("l");

      // 1 Crore (10,000,000) -> should contain 'Cr' or 'cr'
      const formattedCrore = formatRupeeCompact(10000000, { includeSymbol: false });
      expect(formattedCrore.toLowerCase()).toContain("cr");
    });

    it("should support omitting symbol in compact form", () => {
      const formatted = formatRupeeCompact(500000, { includeSymbol: false });
      expect(formatted).not.toContain("₹");
    });

    it("should throw an error for non-finite values in compact form", () => {
      expect(() => formatRupeeCompact(NaN)).toThrow();
      expect(() => formatRupeeCompact(Infinity)).toThrow();
    });
  });
});
