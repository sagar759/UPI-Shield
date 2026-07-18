import { z } from "zod";
import {
  RiskBandSchema,
  RecommendedActionSchema,
  CoverageStateSchema,
  RiskDecisionSchema,
  UserActionTypeSchema,
  UserActionSchema,
  DecisionAuditRecordSchema,
} from "../lib/contracts/schemas";
import { DecisionId, RequestId, IsoTimestamp, NormalizedScore } from "../lib/contracts/primitives";

export type RiskBand = z.infer<typeof RiskBandSchema>;
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;
export type CoverageState = z.infer<typeof CoverageStateSchema>;
export type RiskDecision = z.infer<typeof RiskDecisionSchema>;
export type UserActionType = z.infer<typeof UserActionTypeSchema>;
export type UserAction = z.infer<typeof UserActionSchema>;
export type DecisionAuditRecord = z.infer<typeof DecisionAuditRecordSchema>;
export type { DecisionId, RequestId, IsoTimestamp, NormalizedScore };
