import { IDecisionRepository } from "./decision-repository";
import { StorageHealth } from "./storage-errors";
import { DecisionAuditRecord, UserAction } from "../../types/risk";
import { DecisionId } from "../contracts/primitives";
import { DecisionAuditRecordSchema, UserActionSchema } from "../contracts/schemas";
import { sanitizeRecordForStorage } from "./storage-schema";

/**
 * In-memory decision repository implementation.
 * Safe for server components, unit tests, and SSR fallback.
 */
export class MemoryDecisionRepository implements IDecisionRepository {
  private records: Map<string, DecisionAuditRecord> = new Map();

  constructor(initialRecords: DecisionAuditRecord[] = []) {
    for (const record of initialRecords) {
      const parsed = DecisionAuditRecordSchema.parse(record);
      const sanitized = sanitizeRecordForStorage(parsed);
      this.records.set(sanitized.decision.decisionId, sanitized);
    }
  }

  async getHealth(): Promise<StorageHealth> {
    return {
      status: "ok",
      quarantinedCount: 0,
    };
  }

  async listDecisions(): Promise<DecisionAuditRecord[]> {
    return Array.from(this.records.values()).map((rec) =>
      JSON.parse(JSON.stringify(rec))
    );
  }

  async getDecision(decisionId: DecisionId): Promise<DecisionAuditRecord | null> {
    const record = this.records.get(decisionId);
    if (!record) return null;
    return JSON.parse(JSON.stringify(record));
  }

  async saveDecision(record: DecisionAuditRecord): Promise<void> {
    const parsed = DecisionAuditRecordSchema.parse(record);
    const sanitized = sanitizeRecordForStorage(parsed);
    this.records.set(sanitized.decision.decisionId, sanitized);
  }

  async appendAction(
    decisionId: DecisionId,
    action: UserAction
  ): Promise<DecisionAuditRecord> {
    const existing = this.records.get(decisionId);
    if (!existing) {
      throw new Error(`Decision record not found: ${decisionId}`);
    }

    const parsedAction = UserActionSchema.parse(action);

    // Deep clone existing record to guarantee immutability of decision, detector scores, and policy versions
    const updated: DecisionAuditRecord = JSON.parse(JSON.stringify(existing));

    // Append action while leaving existing actions and decision untouched
    updated.actions = [...updated.actions, parsedAction];

    // Re-validate full record
    const validated = DecisionAuditRecordSchema.parse(updated);
    const sanitized = sanitizeRecordForStorage(validated);

    this.records.set(decisionId, sanitized);
    return JSON.parse(JSON.stringify(sanitized));
  }

  async clearDecisions(): Promise<void> {
    this.records.clear();
  }

  async seedInitialDecisions(records: DecisionAuditRecord[]): Promise<boolean> {
    if (this.records.size > 0) {
      return false;
    }

    for (const record of records) {
      const seededRecord: DecisionAuditRecord = {
        ...record,
        isSeeded: true,
      };
      const parsed = DecisionAuditRecordSchema.parse(seededRecord);
      const sanitized = sanitizeRecordForStorage(parsed);
      this.records.set(sanitized.decision.decisionId, sanitized);
    }

    return true;
  }
}
