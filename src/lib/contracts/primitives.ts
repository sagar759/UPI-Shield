import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 10_000;
export const MAX_SHORT_TEXT_LENGTH = 500;
export const MAX_LONG_TEXT_LENGTH = 10_000;

const identifierBase = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const versionBase = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/);

export const RequestIdSchema = identifierBase.brand<"RequestId">();
export const DecisionIdSchema = identifierBase.brand<"DecisionId">();
export const TransactionIdSchema = identifierBase.brand<"TransactionId">();
export const ScenarioIdSchema = identifierBase.brand<"ScenarioId">();
export const ProfileIdSchema = identifierBase.brand<"ProfileId">();
export const UserActionIdSchema = identifierBase.brand<"UserActionId">();
export const ComplaintDraftIdSchema =
  identifierBase.brand<"ComplaintDraftId">();
export const EvidenceIdSchema = identifierBase.brand<"EvidenceId">();
export const DetectorVersionSchema =
  versionBase.brand<"DetectorVersion">();

export const OpaqueIdentifierSchema = identifierBase;
export const IsoTimestampSchema = z
  .iso
  .datetime({ offset: true })
  .brand<"IsoTimestamp">();
export const NormalizedScoreSchema = z
  .number()
  .finite()
  .min(0)
  .max(1)
  .brand<"NormalizedScore">();
export const RupeeAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .brand<"RupeeAmount">();
export const NonnegativeIntegerSchema = z.number().int().nonnegative();
export const NonnegativeMillisecondsSchema = z.number().finite().nonnegative();
export const NonEmptyShortTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_SHORT_TEXT_LENGTH);
export const NonEmptyLongTextSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Text cannot be blank")
  .refine(
    (value) => value.length <= MAX_LONG_TEXT_LENGTH,
    "Text exceeds maximum length",
  );

export type RequestId = z.infer<typeof RequestIdSchema>;
export type DecisionId = z.infer<typeof DecisionIdSchema>;
export type TransactionId = z.infer<typeof TransactionIdSchema>;
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type UserActionId = z.infer<typeof UserActionIdSchema>;
export type ComplaintDraftId = z.infer<typeof ComplaintDraftIdSchema>;
export type EvidenceId = z.infer<typeof EvidenceIdSchema>;
export type DetectorVersion = z.infer<typeof DetectorVersionSchema>;
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;
export type NormalizedScore = z.infer<typeof NormalizedScoreSchema>;
export type RupeeAmount = z.infer<typeof RupeeAmountSchema>;
