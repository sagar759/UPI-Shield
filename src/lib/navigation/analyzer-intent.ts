import { DEMO_CONTACTS, type DemoContact } from "@/data/demo/contacts";

export type AnalyzerIntent =
  | "scan-pay"
  | "pay-contact"
  | "bank-transfer"
  | "check-upi-id"
  | "demo-scenarios";

export const SUPPORTED_ANALYZER_INTENTS: readonly AnalyzerIntent[] = [
  "scan-pay",
  "pay-contact",
  "bank-transfer",
  "check-upi-id",
  "demo-scenarios",
] as const;

export const DEFAULT_ANALYZER_INTENT: AnalyzerIntent = "scan-pay";

/**
 * Validates and sanitizes analyzer mode/intent parameters from URL or user input.
 * Falls back safely to DEFAULT_ANALYZER_INTENT ("scan-pay") if invalid.
 */
export function validateAnalyzerIntent(
  mode: string | null | undefined
): AnalyzerIntent {
  if (!mode || typeof mode !== "string") {
    return DEFAULT_ANALYZER_INTENT;
  }
  const normalized = mode.trim().toLowerCase();
  if (SUPPORTED_ANALYZER_INTENTS.includes(normalized as AnalyzerIntent)) {
    return normalized as AnalyzerIntent;
  }
  return DEFAULT_ANALYZER_INTENT;
}

export interface BuildAnalyzerUrlOptions {
  mode?: AnalyzerIntent | string;
  contactId?: string;
  scenarioId?: string;
}

/**
 * Constructs a safe /analyze URL string with validated mode and synthetic contactId.
 * Enforces privacy boundary: NEVER accepts or includes unmasked VPAs in search params.
 */
export function buildAnalyzerUrl(options: BuildAnalyzerUrlOptions = {}): string {
  const mode = validateAnalyzerIntent(options.mode);
  const params = new URLSearchParams();

  params.set("mode", mode);

  if (options.contactId) {
    const trimmedContactId = options.contactId.trim();
    // Safety invariant: Ensure contactId is a synthetic ID and never an unmasked VPA with @
    if (trimmedContactId && !trimmedContactId.includes("@")) {
      params.set("contactId", trimmedContactId);
    }
  }

  if (options.scenarioId) {
    const trimmedScenarioId = options.scenarioId.trim();
    if (trimmedScenarioId && !trimmedScenarioId.includes("@")) {
      params.set("scenario", trimmedScenarioId);
    }
  }

  return `/analyze?${params.toString()}`;
}

/**
 * Resolves a synthetic contact from the fixture catalog using a synthetic contactId.
 */
export function resolveContactById(
  contactId: string | null | undefined
): DemoContact | undefined {
  if (!contactId || typeof contactId !== "string") {
    return undefined;
  }
  const trimmed = contactId.trim();
  if (!trimmed || trimmed.includes("@")) {
    return undefined;
  }
  return DEMO_CONTACTS.find((c) => c.contactId === trimmed);
}
