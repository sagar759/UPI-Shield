import { z } from "zod";
import {
  NormalizedScoreSchema,
  DetectorVersionSchema,
  NonnegativeMillisecondsSchema,
  IsoTimestampSchema,
  RequestIdSchema,
  DecisionIdSchema,
  TransactionIdSchema,
  ScenarioIdSchema,
  ProfileIdSchema,
  UserActionIdSchema,
  ComplaintDraftIdSchema,
  EvidenceIdSchema,
  NonnegativeIntegerSchema,
  RupeeAmountSchema,
  MAX_MESSAGE_LENGTH,
} from "./primitives";
import {
  SCHEMA_VERSIONS,
  FEATURE_VERSION,
  POLICY_VERSION,
  EXPLANATION_COPY_VERSION,
  STORAGE_VERSION,
} from "./versions";

// ReasonCode schema - branded string
export const ReasonCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9_]+$/)
  .brand<"ReasonCode">();

export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

// DetectorReason Schema
export const DetectorReasonSchema = z.object({
  code: ReasonCodeSchema,
  severity: NormalizedScoreSchema.optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export type DetectorReason = z.infer<typeof DetectorReasonSchema>;

export const DetectorNameSchema = z.enum(["transaction", "message", "receiver"]);
export type DetectorName = z.infer<typeof DetectorNameSchema>;

export const DetectorAvailabilitySchema = z.enum(["available", "unavailable", "degraded"]);
export type DetectorAvailability = z.infer<typeof DetectorAvailabilitySchema>;

const detectorResultBase = z.object({
  name: DetectorNameSchema,
  version: DetectorVersionSchema,
  reasons: z.array(DetectorReasonSchema),
  latencyMs: NonnegativeMillisecondsSchema,
});

export const DetectorResultSchema = z.discriminatedUnion("availability", [
  detectorResultBase.extend({
    availability: z.literal("available"),
    score: NormalizedScoreSchema,
    confidence: NormalizedScoreSchema,
  }),
  detectorResultBase.extend({
    availability: z.literal("degraded"),
    score: NormalizedScoreSchema,
    confidence: NormalizedScoreSchema,
    degradedReason: z.string().trim().min(1),
  }),
  detectorResultBase.extend({
    availability: z.literal("unavailable"),
    score: z.null().optional(),
    confidence: z.null().optional(),
  }),
]);

export const PaymentTypeSchema = z.enum([
  "scan_pay",
  "pay_contact",
  "bank_transfer",
  "check_upi",
]);
export type PaymentType = z.infer<typeof PaymentTypeSchema>;

export const TransactionInputSchema = z.object({
  transactionId: TransactionIdSchema,
  senderId: ProfileIdSchema,
  receiverId: ProfileIdSchema,
  amount: RupeeAmountSchema,
  currency: z.literal("INR"),
  timestamp: IsoTimestampSchema,
  paymentType: PaymentTypeSchema,
  channel: z.string().trim().min(1).max(128),
  device: z.string().trim().min(1).max(128),
  region: z.string().trim().min(1).max(128),
  note: z.string().max(500).nullable().optional(),
});

export const TransactionFeaturesSchema = z.object({
  amountRatio: z.number().finite().nonnegative(),
  amountZScore: z.number().finite(),
  isNewPayee: z.boolean(),
  relationshipAgeDays: NonnegativeIntegerSchema,
  hourDeviation: z.number().finite().nonnegative(),
  velocityCount5m: NonnegativeIntegerSchema,
  velocityValue5m: z.number().finite().nonnegative(),
  velocityCount30m: NonnegativeIntegerSchema,
  velocityValue30m: z.number().finite().nonnegative(),
  velocityCount60m: NonnegativeIntegerSchema,
  velocityValue60m: z.number().finite().nonnegative(),
  recentFailuresCount: NonnegativeIntegerSchema,
  inactivityDays: z.number().finite().nonnegative(),
  hasDeviceChange: z.boolean(),
  hasLocationChange: z.boolean(),
  isCollectRequest: z.boolean(),
  hasRefundContext: z.boolean(),
  nameMismatch: z.boolean(),
});

export const TransactionCheckInputSchema = z.object({
  raw: TransactionInputSchema,
  features: TransactionFeaturesSchema,
});

export const MessageCheckInputSchema = z.object({
  requestId: RequestIdSchema,
  messageText: z.string().max(MAX_MESSAGE_LENGTH),
  consentGiven: z.boolean(),
  timestamp: IsoTimestampSchema,
});

export const ReceiverFeaturesSchema = z.object({
  uniqueSenders30m: NonnegativeIntegerSchema,
  uniqueReceivers30m: NonnegativeIntegerSchema,
  incomingValue30m: z.number().finite().nonnegative(),
  outgoingValue30m: z.number().finite().nonnegative(),
  passThroughRatio30m: z.number().finite().min(0).max(1),
  passThroughRatio24h: z.number().finite().min(0).max(1),
  medianHoldingTimeSeconds: z.number().finite().nonnegative(),
  burstRatio: z.number().finite().nonnegative(),
  accountAgeDays: NonnegativeIntegerSchema,
});

export const ReceiverCheckInputSchema = z.object({
  receiverId: ProfileIdSchema,
  checkedAt: IsoTimestampSchema,
  features: ReceiverFeaturesSchema,
});

export const RiskBandSchema = z.enum(["low", "medium", "high", "review"]);
export type RiskBand = z.infer<typeof RiskBandSchema>;

export const RecommendedActionSchema = z.enum([
  "allow",
  "verify",
  "interrupt",
  "review",
]);
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

export const CoverageStateSchema = z.object({
  coverage: z.number().finite().min(0).max(1),
  availableDetectors: z.array(DetectorNameSchema),
  unavailableDetectors: z.array(DetectorNameSchema),
});

export const RiskDecisionSchema = z.object({
  decisionId: DecisionIdSchema,
  requestId: RequestIdSchema,
  timestamp: IsoTimestampSchema,
  finalScore: NormalizedScoreSchema.nullable().optional(),
  riskBand: RiskBandSchema,
  recommendedAction: RecommendedActionSchema,
  coverage: CoverageStateSchema,
  detectors: z.partialRecord(DetectorNameSchema, DetectorResultSchema),
  policyVersion: z.literal(POLICY_VERSION),
}).superRefine((data, ctx) => {
  const { detectors, coverage } = data;
  const detectorNames = Object.keys(detectors) as DetectorName[];

  // 1. Validate each detectors record key matches its DetectorResultSchema name
  for (const key of detectorNames) {
    const result = detectors[key];
    if (result && result.name !== key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detectors", key, "name"],
        message: `Detector name '${result.name}' does not match record key '${key}'`,
      });
    }
  }

  // 2. Derive available and unavailable detector lists from results
  const expectedAvailable: DetectorName[] = [];
  const expectedUnavailable: DetectorName[] = [];

  for (const name of detectorNames) {
    const result = detectors[name];
    if (!result) continue;
    if (result.availability === "available" || result.availability === "degraded") {
      expectedAvailable.push(name);
    } else if (result.availability === "unavailable") {
      expectedUnavailable.push(name);
    }
  }

  // Sort lists for comparison
  const sortedExpectedAvailable = [...expectedAvailable].sort();
  const sortedExpectedUnavailable = [...expectedUnavailable].sort();
  const sortedActualAvailable = [...coverage.availableDetectors].sort();
  const sortedActualUnavailable = [...coverage.unavailableDetectors].sort();

  // Validate available detectors match
  if (
    sortedExpectedAvailable.length !== sortedActualAvailable.length ||
    !sortedExpectedAvailable.every((val, idx) => val === sortedActualAvailable[idx])
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coverage", "availableDetectors"],
      message: `availableDetectors list does not match actual detector availabilities. Expected: [${expectedAvailable.join(", ")}], Got: [${coverage.availableDetectors.join(", ")}]`,
    });
  }

  // Validate unavailable detectors match
  if (
    sortedExpectedUnavailable.length !== sortedActualUnavailable.length ||
    !sortedExpectedUnavailable.every((val, idx) => val === sortedActualUnavailable[idx])
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coverage", "unavailableDetectors"],
      message: `unavailableDetectors list does not match actual detector availabilities. Expected: [${expectedUnavailable.join(", ")}], Got: [${coverage.unavailableDetectors.join(", ")}]`,
    });
  }

  // Check overlap between actual available and unavailable lists
  const overlap = coverage.availableDetectors.filter(x => coverage.unavailableDetectors.includes(x));
  if (overlap.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coverage"],
      message: `Overlap detected between available and unavailable detectors: [${overlap.join(", ")}]`,
    });
  }

  // 3. Validate coverage numeric value
  const DETECTOR_WEIGHTS: Record<DetectorName, number> = {
    transaction: 0.45,
    message: 0.30,
    receiver: 0.25,
  };

  let derivedCoverage = 0;
  let hasUnavailable = false;

  for (const name of detectorNames) {
    const result = detectors[name];
    if (!result) continue;
    if (result.availability === "available" || result.availability === "degraded") {
      derivedCoverage += DETECTOR_WEIGHTS[name] || 0;
    } else if (result.availability === "unavailable") {
      hasUnavailable = true;
    }
  }

  // Enforce coverage numeric value (with float epsilon check)
  if (Math.abs(coverage.coverage - derivedCoverage) > 1e-6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coverage", "coverage"],
      message: `Coverage value ${coverage.coverage} does not equal derived coverage ${derivedCoverage} based on weights`,
    });
  }

  // Enforce that full coverage (1.0) is rejected if any detector is unavailable
  if (hasUnavailable && coverage.coverage >= 1.0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coverage", "coverage"],
      message: "Full coverage (1.0) is not allowed when one or more detectors are unavailable",
    });
  }

  // Degraded state behavior: a degraded detector is counted in availableDetectors
  // and contributes to coverage calculation, but its individual availability is "degraded".
  // This is already validated by checking that degraded results are pushed to expectedAvailable.
});

export const UserActionTypeSchema = z.enum([
  "cancel",
  "verify",
  "continue",
  "override",
  "report",
  "copy_draft",
  "export_draft",
]);
export type UserActionType = z.infer<typeof UserActionTypeSchema>;

export const UserActionSchema = z.object({
  actionId: UserActionIdSchema,
  decisionId: DecisionIdSchema,
  type: UserActionTypeSchema,
  timestamp: IsoTimestampSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AuditSummarySchema = z.object({
  receiverId: ProfileIdSchema.optional(),
  amount: RupeeAmountSchema.optional(),
  payeeName: z.string().trim().max(256).optional(),
});
export type AuditSummary = z.infer<typeof AuditSummarySchema>;

export const DecisionAuditRecordSchema = z.object({
  decision: RiskDecisionSchema,
  summary: AuditSummarySchema.optional(),
  schemaVersion: z.literal(SCHEMA_VERSIONS.decisionAudit),
  featureVersion: z.literal(FEATURE_VERSION),
  policyVersion: z.literal(POLICY_VERSION),
  explanationCopyVersion: z.literal(EXPLANATION_COPY_VERSION),
  storageVersion: z.literal(STORAGE_VERSION),
  recordedAt: IsoTimestampSchema,
  actions: z.array(UserActionSchema),
  isSeeded: z.boolean().optional(),
});

export const EvidenceTypeSchema = z.enum([
  "screenshot",
  "chat_log",
  "bank_statement",
  "other",
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const ComplaintEvidenceSchema = z.object({
  evidenceId: EvidenceIdSchema,
  evidenceType: EvidenceTypeSchema,
  fileSize: NonnegativeIntegerSchema,
  mimeType: z.string().trim().min(1).max(128),
  uploadedAt: IsoTimestampSchema,
  sha256: z.string().trim().min(64).max(64).regex(/^[a-fA-F0-9]{64}$/),
});

export const ComplaintIntakeSchema = z.object({
  transactionId: TransactionIdSchema,
  amount: RupeeAmountSchema,
  timestamp: IsoTimestampSchema,
  bankOrApp: z.string().trim().min(1).max(128),
  receiverDetails: z.string().trim().min(1).max(256),
  contactMethod: z.string().trim().min(1).max(128),
  scamTactic: z.string().trim().min(1).max(128),
  requestedAction: z.string().trim().min(1).max(128),
  fraudRealization: z.string().trim().min(1).max(10000),
  evidenceList: z.array(ComplaintEvidenceSchema),
});

export const ComplaintDraftSchema = z.object({
  draftId: ComplaintDraftIdSchema,
  intake: ComplaintIntakeSchema,
  generatedText: z.string().trim().min(1),
  safetyActions: z.array(z.string().trim().min(1)),
  version: z.literal(SCHEMA_VERSIONS.complaintDraft),
  createdAt: IsoTimestampSchema,
});

export const DemoScenarioSchema = z.object({
  scenarioId: ScenarioIdSchema,
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().min(1).max(1000),
  transactionInput: TransactionCheckInputSchema,
  messageInput: MessageCheckInputSchema.nullable().optional(),
  receiverInput: ReceiverCheckInputSchema.nullable().optional(),
  expectedRiskBand: RiskBandSchema,
  expectedReasons: z.array(ReasonCodeSchema),
  version: z.literal(SCHEMA_VERSIONS.demoScenario),
});

export const DemoScenarioCatalogSchema = z.object({
  scenarios: z.array(DemoScenarioSchema),
  version: z.literal(SCHEMA_VERSIONS.demoScenarioCatalog),
});
