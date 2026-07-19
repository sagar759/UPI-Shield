import { describe, expect, it } from "vitest";
import { formatDateTime, formatDateOnly, formatTimeOnly, toDateObject } from "./date-time";

describe("Date/Time Formatting Utilities", () => {
  describe("toDateObject", () => {
    it("should return the same Date object if passed a Date", () => {
      const date = new Date();
      expect(toDateObject(date)).toBe(date);
    });

    it("should parse numerical timestamps", () => {
      const timestamp = 1718873722000; // 2024-06-20
      const date = toDateObject(timestamp);
      expect(date.getTime()).toBe(timestamp);
    });

    it("should parse ISO date strings", () => {
      const iso = "2026-07-20T00:00:00.000Z";
      const date = toDateObject(iso);
      expect(date.toISOString()).toBe(iso);
    });

    it("should throw on invalid Date objects", () => {
      const date = new Date("invalid");
      expect(() => toDateObject(date)).toThrow("Invalid Date object provided");
    });

    it("should throw on invalid timestamps", () => {
      expect(() => toDateObject(NaN)).toThrow("Invalid numerical timestamp provided");
    });

    it("should throw on invalid date strings", () => {
      expect(() => toDateObject("not-a-date")).toThrow("Invalid date string provided");
    });
  });

  describe("timezone translation (Asia/Kolkata)", () => {
    it("should format dates/times correctly shifted to IST (UTC +5:30)", () => {
      // 2026-07-20T00:00:00.000Z in UTC is 2026-07-20T05:30:00.000 in IST
      const date = "2026-07-20T00:00:00.000Z";
      expect(formatDateOnly(date)).toBe("20/07/2026");

      const timeStr = formatTimeOnly(date).toLowerCase();
      // Expect time to contain 05:30:00
      expect(timeStr).toContain("05:30:00");
      expect(timeStr).toContain("am");
    });

    it("should format evening dates shifted to IST next day", () => {
      // 2026-07-20T22:00:00.000Z in UTC is 2026-07-21T03:30:00.000 in IST
      const date = "2026-07-20T22:00:00.000Z";
      expect(formatDateOnly(date)).toBe("21/07/2026");

      const timeStr = formatTimeOnly(date).toLowerCase();
      expect(timeStr).toContain("03:30:00");
      expect(timeStr).toContain("am");
    });
  });

  describe("formatDateTime", () => {
    it("should render date and time together", () => {
      const date = "2026-07-20T10:15:30.000Z"; // IST: 15:45:30
      const formatted = formatDateTime(date).toLowerCase();
      expect(formatted).toContain("20/07/2026");
      expect(formatted).toContain("03:45:30");
      expect(formatted).toContain("pm");
    });

    it("should support dateStyle/timeStyle options without throwing an error", () => {
      const date = "2026-07-20T10:15:30.000Z";
      expect(() => formatDateTime(date, { dateStyle: "short" })).not.toThrow();
      expect(() => formatDateTime(date, { timeStyle: "medium" })).not.toThrow();
      expect(() => formatDateTime(date, { dateStyle: "full", timeStyle: "full" })).not.toThrow();
    });
  });
});
