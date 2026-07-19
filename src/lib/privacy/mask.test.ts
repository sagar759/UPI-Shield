import { describe, expect, it } from "vitest";
import { maskVPA, maskPhone, maskTransactionRef, maskAccountID } from "./mask";

describe("Privacy Masking Utilities", () => {
  describe("maskVPA", () => {
    it("should mask typical VPA usernames while keeping domain", () => {
      expect(maskVPA("samik@okaxis")).toBe("sa***@okaxis");
      expect(maskVPA("sagar759@ybl")).toBe("sa******@ybl");
    });

    it("should handle short usernames correctly", () => {
      expect(maskVPA("a@okaxis")).toBe("*@okaxis");
      expect(maskVPA("ab@okaxis")).toBe("a*@okaxis");
    });

    it("should mask VPA without @ symbol like an account ID", () => {
      expect(maskVPA("someuser")).toBe("so**user"); // length 8, first 2, last 4, masked 2
    });

    it("should return empty string for empty inputs", () => {
      expect(maskVPA("")).toBe("");
      expect(maskVPA("   ")).toBe("");
    });
  });

  describe("maskPhone", () => {
    it("should mask middle 6 digits of a 10-digit number", () => {
      expect(maskPhone("9876543210")).toBe("98******10");
    });

    it("should support country code prefixes (+91)", () => {
      expect(maskPhone("+919876543210")).toBe("+9198******10");
      expect(maskPhone("+91 9876543210")).toBe("+91 98******10");
    });

    it("should handle short numbers gracefully", () => {
      expect(maskPhone("12345")).toBe("1***5");
      expect(maskPhone("12")).toBe("**");
      expect(maskPhone("1")).toBe("*");
    });

    it("should handle empty or whitespace-only values", () => {
      expect(maskPhone("")).toBe("");
    });
  });

  describe("maskTransactionRef", () => {
    it("should mask transaction references keeping first 3 and last 3 chars", () => {
      expect(maskTransactionRef("123456789012")).toBe("123******012");
      expect(maskTransactionRef("TXN987654321")).toBe("TXN******321");
    });

    it("should handle short transaction references gracefully", () => {
      expect(maskTransactionRef("12345")).toBe("1***5");
      expect(maskTransactionRef("12")).toBe("**");
    });
  });

  describe("maskAccountID", () => {
    it("should mask account IDs keeping first 2 and last 4 chars", () => {
      expect(maskAccountID("ACC123456789")).toBe("AC******6789");
    });

    it("should handle short account IDs gracefully", () => {
      expect(maskAccountID("12345")).toBe("1***5");
      expect(maskAccountID("12")).toBe("**");
    });
  });
});
