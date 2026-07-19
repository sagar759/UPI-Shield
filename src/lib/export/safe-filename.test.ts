import { describe, expect, it } from "vitest";
import { generateSafeFilename } from "./safe-filename";

describe("Safe Filename Generation Utility", () => {
  it("should format valid base names and extensions correctly", () => {
    expect(generateSafeFilename("report_2026", "csv")).toBe("report_2026.csv");
    expect(generateSafeFilename("complaint-evidence.v1", ".txt")).toBe("complaint-evidence.v1.txt");
  });

  it("should normalize extension format (add missing leading dot)", () => {
    expect(generateSafeFilename("my-export", "json")).toBe("my-export.json");
    expect(generateSafeFilename("my-export", ".json")).toBe("my-export.json");
  });

  it("should replace invalid characters with dashes", () => {
    expect(generateSafeFilename("report/2026\\data?*|", "csv")).toBe("report-2026-data.csv");
    expect(generateSafeFilename("user@upi:shield", "txt")).toBe("user-upi-shield.txt");
  });

  it("should collapse multiple consecutive separators", () => {
    expect(generateSafeFilename("data---final....v2", "json")).toBe("data-final.v2.json");
  });

  it("should strip leading and trailing separators", () => {
    expect(generateSafeFilename("-data-", "json")).toBe("data.json");
    expect(generateSafeFilename(".data.", "json")).toBe("data.json");
  });

  it("should fallback to defaultName when basename is empty or becomes empty", () => {
    expect(generateSafeFilename("   ", "csv", "fallback")).toBe("fallback.csv");
    expect(generateSafeFilename("?*|", "json", "fallback")).toBe("fallback.json");
    expect(generateSafeFilename("?*|", "json", "fallback...dot")).toBe("fallback.dot.json");
  });

  it("should fallback to defaultName 'export' if no defaultName is provided", () => {
    expect(generateSafeFilename("?*|", "json")).toBe("export.json");
  });

  it("should fallback to default .json if extension is not in the allowlist", () => {
    // xlsx is not allowlisted
    expect(generateSafeFilename("report", "xlsx")).toBe("report.json");
    // exe is not allowlisted
    expect(generateSafeFilename("report", ".exe")).toBe("report.json");
  });

  it("should truncate names that exceed the 255 character limit", () => {
    const longBase = "a".repeat(300);
    const result = generateSafeFilename(longBase, "json");
    expect(result.length).toBe(255);
    expect(result.endsWith(".json")).toBe(true);
  });
});
