import { describe, expect, it } from "vitest";
import {
  normalizeWhitespace,
  hasControlCharacters,
  hasInvalidEncoding,
  detectForbiddenSecrets,
  redactConcreteCredentials,
  validateStringInput,
  validateRupeeAmount,
  validateTimestamp,
} from "./input";

describe("Input Validation & Normalization Utilities", () => {
  describe("normalizeWhitespace", () => {
    it("should trim and collapse consecutive whitespace", () => {
      expect(normalizeWhitespace("  hello   world  ")).toBe("hello world");
      expect(normalizeWhitespace("hello\n\tworld")).toBe("hello world");
    });
  });

  describe("hasControlCharacters", () => {
    it("should detect non-whitespace control characters", () => {
      expect(hasControlCharacters("normal text")).toBe(false);
      expect(hasControlCharacters("text\x00with null")).toBe(true);
      expect(hasControlCharacters("text\x1Fcontrol")).toBe(true);
      expect(hasControlCharacters("text\x7Fdelete")).toBe(true);
    });

    it("should allow whitespace-like control characters (tab, newline)", () => {
      expect(hasControlCharacters("text\nnewline")).toBe(false);
      expect(hasControlCharacters("text\ttab")).toBe(false);
      expect(hasControlCharacters("text\rcarriage")).toBe(false);
    });
  });

  describe("hasInvalidEncoding", () => {
    it("should pass on valid UTF-8 and unicode text", () => {
      expect(hasInvalidEncoding("Hello World")).toBe(false);
      expect(hasInvalidEncoding("नमस्ते भारत")).toBe(false); // Hindi text
      expect(hasInvalidEncoding("😊")).toBe(false); // Emoji
    });

    it("should detect unpaired UTF-16 surrogates", () => {
      // Unpaired high surrogate
      expect(hasInvalidEncoding("\uD800")).toBe(true);
      // Unpaired low surrogate
      expect(hasInvalidEncoding("\uDC00")).toBe(true);
    });
  });

  describe("detectForbiddenSecrets", () => {
    it("should flag concrete credential values and allow ordinary mentions", () => {
      expect(detectForbiddenSecrets("my pin is 1234")).toBe(true);
      expect(detectForbiddenSecrets("OTP: 482910")).toBe(true);
      expect(detectForbiddenSecrets("CVV is 123")).toBe(true);
      expect(detectForbiddenSecrets("password: Secret123")).toBe(true);
      
      expect(detectForbiddenSecrets("Need the OTP to continue")).toBe(false);
      expect(detectForbiddenSecrets("CVV is on the back")).toBe(false);
      expect(detectForbiddenSecrets("Enter your password")).toBe(false);
      expect(detectForbiddenSecrets("Set a secure Passcode")).toBe(false);
    });

    it("should not flag words that just contain the substring", () => {
      expect(detectForbiddenSecrets("pinpoint direction")).toBe(false);
      expect(detectForbiddenSecrets("hotplate")).toBe(false);
    });
  });

  describe("redactConcreteCredentials", () => {
    it("redacts raw card numbers with spaces or hyphens", () => {
      expect(redactConcreteCredentials("Card number is 4532 0123 4567 8901")).toBe(
        "Card number is [REDACTED]"
      );
      expect(redactConcreteCredentials("Card number is 4532-0123-4567-8901")).toBe(
        "Card number is [REDACTED]"
      );
      expect(redactConcreteCredentials("Card number is 4532012345678901")).toBe(
        "Card number is [REDACTED]"
      );
    });

    it("redacts password and passcode assignments using 'is'", () => {
      expect(redactConcreteCredentials("My password is Secret123")).toBe("My password: [REDACTED]");
      expect(redactConcreteCredentials("passcode is SecretPasscode123")).toBe("passcode: [REDACTED]");
    });
  });

  describe("validateStringInput", () => {
    it("should return success when input is valid", () => {
      const res = validateStringInput("Hello standard input", {
        fieldName: "note",
        maxLength: 50,
      });
      expect(res.errors.length).toBe(0);
      expect(res.normalized).toBe("Hello standard input");
    });

    it("should validate required fields", () => {
      const res = validateStringInput(null, {
        fieldName: "note",
        maxLength: 50,
      });
      expect(res.errors[0]).toEqual({
        field: "note",
        code: "REQUIRED",
        message: "note is required",
      });
    });

    it("should reject too long text", () => {
      const res = validateStringInput("a".repeat(15), {
        fieldName: "short",
        maxLength: 10,
      });
      expect(res.errors[0].code).toBe("TOO_LONG");
    });

    it("should reject forbidden secret terms", () => {
      const res = validateStringInput("my PIN is 9999", {
        fieldName: "description",
        maxLength: 100,
      });
      expect(res.errors[0].code).toBe("FORBIDDEN_SECRET");
    });

    it("should reject control characters (like vertical tab or form feed) even when allowEmpty is true", () => {
      const res1 = validateStringInput("\v", {
        fieldName: "note",
        maxLength: 100,
        allowEmpty: true,
      });
      expect(res1.errors.some(e => e.code === "CONTROL_CHARACTERS")).toBe(true);

      const res2 = validateStringInput("\f", {
        fieldName: "note",
        maxLength: 100,
        allowEmpty: true,
      });
      expect(res2.errors.some(e => e.code === "CONTROL_CHARACTERS")).toBe(true);
    });

    it("should preserve EMPTY/success behavior for genuinely empty input", () => {
      const resEmptyAllowed = validateStringInput("   ", {
        fieldName: "note",
        maxLength: 100,
        allowEmpty: true,
      });
      expect(resEmptyAllowed.errors.length).toBe(0);

      const resEmptyDisallowed = validateStringInput("   ", {
        fieldName: "note",
        maxLength: 100,
        allowEmpty: false,
      });
      expect(resEmptyDisallowed.errors[0].code).toBe("EMPTY");
    });
  });

  describe("validateRupeeAmount", () => {
    it("should accept valid positive amounts", () => {
      expect(validateRupeeAmount(10.5).errors.length).toBe(0);
      expect(validateRupeeAmount(10.5).amount).toBe(10.5);
    });

    it("should reject negative or zero values", () => {
      expect(validateRupeeAmount(0).errors[0].code).toBe("INVALID_AMOUNT");
      expect(validateRupeeAmount(-10).errors[0].code).toBe("INVALID_AMOUNT");
    });

    it("should reject non-numeric values", () => {
      expect(validateRupeeAmount("100").errors[0].code).toBe("INVALID_TYPE");
      expect(validateRupeeAmount(NaN).errors[0].code).toBe("INVALID_TYPE");
      expect(validateRupeeAmount(Infinity).errors[0].code).toBe("INVALID_TYPE");
    });
  });

  describe("validateTimestamp", () => {
    it("should accept valid ISO 8601 timestamps", () => {
      const res = validateTimestamp(new Date().toISOString());
      expect(res.errors.length).toBe(0);
    });

    it("should reject timestamps before UPI launch date", () => {
      const res = validateTimestamp("2016-04-10T23:59:59Z");
      expect(res.errors[0].code).toBe("IMPOSSIBLE_TIMESTAMP");
    });

    it("should reject future timestamps beyond clock drift", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins future
      const res = validateTimestamp(futureTime);
      expect(res.errors[0].code).toBe("FUTURE_TIMESTAMP");
    });

    it("should reject invalid date string structures", () => {
      const res = validateTimestamp("not-a-date");
      expect(res.errors[0].code).toBe("INVALID_FORMAT");
    });

    it("should reject calendar date/time components that overflow", () => {
      // February 30 does not exist
      expect(validateTimestamp("2026-02-30T10:00:00Z").errors[0].code).toBe("INVALID_FORMAT");
      // June 31 does not exist
      expect(validateTimestamp("2026-06-31T10:00:00Z").errors[0].code).toBe("INVALID_FORMAT");
      // Hour 25 does not exist
      expect(validateTimestamp("2026-06-20T25:00:00Z").errors[0].code).toBe("INVALID_FORMAT");
      // Minute 60 does not exist (0-59 allowed)
      expect(validateTimestamp("2026-06-20T10:60:00Z").errors[0].code).toBe("INVALID_FORMAT");
    });

    it("should accept valid timestamps with custom offsets and fractional seconds", () => {
      const res1 = validateTimestamp("2026-06-20T10:15:30.123+05:30");
      expect(res1.errors.length).toBe(0);

      const res2 = validateTimestamp("2026-06-20T10:15:30.999Z");
      expect(res2.errors.length).toBe(0);
    });
  });
});
