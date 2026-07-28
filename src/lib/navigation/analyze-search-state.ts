import {
  validateAnalyzerIntent,
  resolveContactById,
  type AnalyzerIntent,
} from "./analyzer-intent";
import type { DemoContact } from "@/data/demo/contacts";

export type AnalyzerMode = "transaction" | "message" | "receiver";

export const SUPPORTED_ANALYZER_MODES: readonly AnalyzerMode[] = [
  "transaction",
  "message",
  "receiver",
] as const;

export const DEFAULT_ANALYZER_MODE: AnalyzerMode = "transaction";

/**
 * Maps any raw mode string or intent to one of the 3 canonical analyzer workspace modes.
 * Defaults safely to "transaction".
 */
export function normalizeAnalyzerMode(
  rawMode: string | null | undefined
): AnalyzerMode {
  if (!rawMode || typeof rawMode !== "string") {
    return DEFAULT_ANALYZER_MODE;
  }
  const normalized = rawMode.trim().toLowerCase();

  if (normalized === "message" || normalized === "scam-message" || normalized === "text") {
    return "message";
  }
  if (normalized === "receiver" || normalized === "mule-receiver" || normalized === "mule") {
    return "receiver";
  }
  if (
    normalized === "transaction" ||
    normalized === "scan-pay" ||
    normalized === "pay-contact" ||
    normalized === "bank-transfer" ||
    normalized === "check-upi-id" ||
    normalized === "demo-scenarios"
  ) {
    return "transaction";
  }

  return DEFAULT_ANALYZER_MODE;
}

export interface ParsedAnalyzeSearchState {
  mode: AnalyzerMode;
  intent: AnalyzerIntent;
  contactId?: string;
  scenarioId?: string;
  resolvedContact?: DemoContact;
}

export interface BuildAnalyzeSearchUrlOptions {
  mode?: AnalyzerMode | string;
  contactId?: string;
  scenarioId?: string;
}

/**
 * Parses raw search params safely without throwing or causing hydration mismatches.
 * Strictly enforces privacy boundary: rejects unmasked VPAs with "@" in contactId.
 */
export function parseAnalyzeSearchParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams | null
): ParsedAnalyzeSearchState {
  let modeParam: string | null = null;
  let contactIdParam: string | null = null;
  let scenarioParam: string | null = null;

  if (searchParams instanceof URLSearchParams) {
    modeParam = searchParams.get("mode");
    contactIdParam = searchParams.get("contactId");
    scenarioParam = searchParams.get("scenario") || searchParams.get("scenarioId");
  } else if (searchParams && typeof searchParams === "object") {
    const rawMode = searchParams["mode"];
    modeParam = Array.isArray(rawMode) ? rawMode[0] : rawMode ?? null;

    const rawContact = searchParams["contactId"];
    contactIdParam = Array.isArray(rawContact) ? rawContact[0] : rawContact ?? null;

    const rawScenario = searchParams["scenario"] || searchParams["scenarioId"];
    scenarioParam = Array.isArray(rawScenario) ? rawScenario[0] : rawScenario ?? null;
  }

  const mode = normalizeAnalyzerMode(modeParam);
  const intent = validateAnalyzerIntent(modeParam);

  let contactId: string | undefined = undefined;
  if (contactIdParam && typeof contactIdParam === "string") {
    const trimmed = contactIdParam.trim();
    if (trimmed && !trimmed.includes("@")) {
      contactId = trimmed;
    }
  }

  let scenarioId: string | undefined = undefined;
  if (scenarioParam && typeof scenarioParam === "string") {
    const trimmed = scenarioParam.trim();
    if (trimmed && !trimmed.includes("@")) {
      scenarioId = trimmed;
    }
  }

  const resolvedContact = resolveContactById(contactId);

  return {
    mode,
    intent,
    contactId,
    scenarioId,
    resolvedContact,
  };
}

/**
 * Constructs a safe /analyze URL string with validated mode and synthetic IDs.
 */
export function buildAnalyzeSearchUrl(
  options: BuildAnalyzeSearchUrlOptions = {}
): string {
  const mode = normalizeAnalyzerMode(options.mode);
  const params = new URLSearchParams();

  params.set("mode", mode);

  if (options.contactId) {
    const trimmed = options.contactId.trim();
    if (trimmed && !trimmed.includes("@")) {
      params.set("contactId", trimmed);
    }
  }

  if (options.scenarioId) {
    const trimmed = options.scenarioId.trim();
    if (trimmed && !trimmed.includes("@")) {
      params.set("scenario", trimmed);
    }
  }

  return `/analyze?${params.toString()}`;
}
