import { z } from "zod";
import { DecisionAuditRecordSchema } from "../contracts/schemas";
import { STORAGE_VERSION } from "../contracts/versions";
import { IsoTimestampSchema, IsoTimestamp } from "../contracts/primitives";
import { DecisionAuditRecord } from "../../types/risk";

export const DEFAULT_STORAGE_KEY = "upi_shield_audit_store_v1";

export const StorageEnvelopeSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  updatedAt: IsoTimestampSchema,
  records: z.array(DecisionAuditRecordSchema),
  quarantinedCount: z.number().int().nonnegative().optional(),
});

export type StorageEnvelope = z.infer<typeof StorageEnvelopeSchema>;

export interface StorageParseResult {
  envelope: StorageEnvelope;
  corrupted: boolean;
  quarantinedCount: number;
}

const SENSITIVE_METADATA_KEYS = new Set([
  "messageText",
  "rawText",
  "chatText",
  "transcript",
  "unconsentedText",
  "complaintText",
  "rawMessage",
]);

function sanitizeMetadataValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeMetadataValue);
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_METADATA_KEYS.has(key)) {
      continue;
    }
    result[key] = sanitizeMetadataValue(val);
  }
  return result;
}

/**
 * Deep clones a DecisionAuditRecord and ensures privacy sanitization rules are enforced.
 * Raw message text without explicit user consent is never retained.
 */
export function sanitizeRecordForStorage(
  record: DecisionAuditRecord
): DecisionAuditRecord {
  // Deep clone to avoid mutating input object
  const clone: DecisionAuditRecord = JSON.parse(JSON.stringify(record));

  // Sanitize actions metadata: remove sensitive raw message fields unless explicit consent was given
  if (Array.isArray(clone.actions)) {
    clone.actions = clone.actions.map((action) => {
      if (!action.metadata || typeof action.metadata !== "object") {
        return action;
      }
      const hasConsent = action.metadata.consentGiven === true;
      if (!hasConsent) {
        return {
          ...action,
          metadata: sanitizeMetadataValue(action.metadata) as Record<string, unknown>,
        };
      }
      return action;
    });
  }

  return clone;
}

/**
 * Defensively parses raw storage JSON, validating with Zod schemas.
 * Invalid or corrupted items are quarantined rather than throwing uncaught errors.
 */
export function parseStorageEnvelope(rawJson: string | null): StorageParseResult {
  const nowIso = new Date().toISOString() as IsoTimestamp;

  if (rawJson === null || rawJson.trim() === "") {
    return {
      envelope: {
        version: STORAGE_VERSION,
        updatedAt: nowIso,
        records: [],
        quarantinedCount: 0,
      },
      corrupted: false,
      quarantinedCount: 0,
    };
  }

  let parsedObject: unknown;
  try {
    parsedObject = JSON.parse(rawJson);
  } catch {
    // Corrupt JSON string
    return {
      envelope: {
        version: STORAGE_VERSION,
        updatedAt: nowIso,
        records: [],
        quarantinedCount: 1,
      },
      corrupted: true,
      quarantinedCount: 1,
    };
  }

  if (typeof parsedObject !== "object" || parsedObject === null) {
    return {
      envelope: {
        version: STORAGE_VERSION,
        updatedAt: nowIso,
        records: [],
        quarantinedCount: 1,
      },
      corrupted: true,
      quarantinedCount: 1,
    };
  }

  // Try direct schema parse
  const directParse = StorageEnvelopeSchema.safeParse(parsedObject);
  if (directParse.success) {
    const sanitizedRecords = directParse.data.records.map(sanitizeRecordForStorage);
    const qCount = directParse.data.quarantinedCount || 0;
    return {
      envelope: {
        ...directParse.data,
        records: sanitizedRecords,
        quarantinedCount: qCount,
      },
      corrupted: false,
      quarantinedCount: qCount,
    };
  }

  // Graceful fallback / partial quarantine parsing:
  // If object has a records array, attempt individual record validation
  const obj = parsedObject as Record<string, unknown>;
  let quarantinedCount = 0;
  const validRecords: DecisionAuditRecord[] = [];

  if (Array.isArray(obj.records)) {
    for (const item of obj.records) {
      const recordParse = DecisionAuditRecordSchema.safeParse(item);
      if (recordParse.success) {
        validRecords.push(sanitizeRecordForStorage(recordParse.data));
      } else {
        quarantinedCount += 1;
      }
    }
  } else {
    // Unrecognized payload structure
    quarantinedCount = 1;
  }

  const existingQuarantineCount =
    typeof obj.quarantinedCount === "number" && obj.quarantinedCount >= 0
      ? obj.quarantinedCount
      : 0;
  const totalQuarantined = existingQuarantineCount + quarantinedCount;

  return {
    envelope: {
      version: STORAGE_VERSION,
      updatedAt: nowIso,
      records: validRecords,
      quarantinedCount: totalQuarantined,
    },
    corrupted: true,
    quarantinedCount: totalQuarantined,
  };
}

/**
 * Serializes a storage envelope to string.
 */
export function serializeStorageEnvelope(envelope: StorageEnvelope): string {
  return JSON.stringify(envelope);
}
