import { z } from "zod";
import {
  EvidenceTypeSchema,
  ComplaintEvidenceSchema,
  ComplaintIntakeSchema,
  ComplaintDraftSchema,
} from "../lib/contracts/schemas";
import { TransactionId, RupeeAmount, IsoTimestamp, EvidenceId, ComplaintDraftId } from "../lib/contracts/primitives";

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type ComplaintEvidence = z.infer<typeof ComplaintEvidenceSchema>;
export type ComplaintIntake = z.infer<typeof ComplaintIntakeSchema>;
export type ComplaintDraft = z.infer<typeof ComplaintDraftSchema>;
export type { TransactionId, RupeeAmount, IsoTimestamp, EvidenceId, ComplaintDraftId };
