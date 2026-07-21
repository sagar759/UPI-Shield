import { IDecisionRepository } from "./decision-repository";
import {
  StorageHealth,
  StorageError,
  StorageQuotaExceededError,
  StorageUnavailableError,
} from "./storage-errors";
import { DecisionAuditRecord, UserAction } from "../../types/risk";
import { DecisionId, IsoTimestamp } from "../contracts/primitives";
import { DecisionAuditRecordSchema, UserActionSchema } from "../contracts/schemas";
import { STORAGE_VERSION } from "../contracts/versions";
import {
  DEFAULT_STORAGE_KEY,
  parseStorageEnvelope,
  serializeStorageEnvelope,
  StorageEnvelope,
  sanitizeRecordForStorage,
} from "./storage-schema";

export class BrowserDecisionRepository implements IDecisionRepository {
  private storageKey: string;
  private health: StorageHealth = { status: "ok", quarantinedCount: 0 };
  private memoryFallbackMap: Map<string, DecisionAuditRecord> = new Map();
  private isBrowser: boolean;
  private storageListener?: (event: StorageEvent) => void;

  constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

    if (this.isBrowser) {
      this.initCrossTabListener();
    } else {
      this.health = {
        status: "degraded_unavailable",
        message: "Server environment: browser localStorage is unavailable",
      };
    }
  }

  private initCrossTabListener(): void {
    if (!this.isBrowser) return;

    try {
      this.storageListener = (event: StorageEvent) => {
        if (event.key === this.storageKey) {
          // Cross-tab update detected; re-sync state
          this.readEnvelopeDefensive();
        }
      };
      window.addEventListener("storage", this.storageListener);
    } catch {
      // Ignore listener attachment failures
    }
  }

  public destroy(): void {
    if (this.isBrowser && this.storageListener) {
      try {
        window.removeEventListener("storage", this.storageListener);
      } catch {
        // Ignore
      }
    }
  }

  private isLocalStorageAvailable(): boolean {
    if (!this.isBrowser) return false;
    try {
      const len = window.localStorage.length;
      return typeof len === "number";
    } catch {
      return false;
    }
  }

  private readEnvelopeDefensive(): { envelope: StorageEnvelope; corrupted: boolean } {
    if (!this.isLocalStorageAvailable()) {
      this.health = {
        status: "degraded_unavailable",
        message: "localStorage is restricted or unavailable",
      };
      // Return memory fallback envelope
      return {
        envelope: {
          version: STORAGE_VERSION,
          updatedAt: new Date().toISOString() as IsoTimestamp,
          records: Array.from(this.memoryFallbackMap.values()),
          quarantinedCount: this.health.quarantinedCount || 0,
        },
        corrupted: false,
      };
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      const parseResult = parseStorageEnvelope(raw);

      if (parseResult.corrupted) {
        this.health = {
          status: "degraded_corrupt",
          message: "Corrupted or invalid records detected and quarantined",
          quarantinedCount: parseResult.quarantinedCount,
        };
        // Persist clean quarantined envelope back defensively
        this.writeEnvelopeDefensive(parseResult.envelope);
      } else if (this.health.status !== "degraded_quota") {
        this.health = {
          status: "ok",
          quarantinedCount: parseResult.quarantinedCount,
        };
      }

      // Sync memory map with parsed records
      this.memoryFallbackMap.clear();
      for (const rec of parseResult.envelope.records) {
        this.memoryFallbackMap.set(rec.decision.decisionId, rec);
      }

      return parseResult;
    } catch (err) {
      const status = err instanceof StorageError ? err.status : "degraded_corrupt";
      this.health = {
        status,
        message: err instanceof Error ? err.message : "Failed to read localStorage",
      };
      return {
        envelope: {
          version: STORAGE_VERSION,
          updatedAt: new Date().toISOString() as IsoTimestamp,
          records: Array.from(this.memoryFallbackMap.values()),
          quarantinedCount: 1,
        },
        corrupted: true,
      };
    }
  }

  private writeEnvelopeDefensive(envelope: StorageEnvelope): void {
    if (!this.isLocalStorageAvailable()) {
      this.health = {
        status: "degraded_unavailable",
        message: "localStorage is unavailable for write",
      };
      // Keep in memory map
      this.memoryFallbackMap.clear();
      for (const rec of envelope.records) {
        this.memoryFallbackMap.set(rec.decision.decisionId, rec);
      }
      return;
    }

    try {
      const serialized = serializeStorageEnvelope(envelope);
      window.localStorage.setItem(this.storageKey, serialized);
      
      // Sync memory map
      this.memoryFallbackMap.clear();
      for (const rec of envelope.records) {
        this.memoryFallbackMap.set(rec.decision.decisionId, rec);
      }

      const qCount = envelope.quarantinedCount || 0;
      if (qCount > 0) {
        this.health = {
          status: "degraded_corrupt",
          message: "Corrupted or invalid records detected and quarantined",
          quarantinedCount: qCount,
        };
      } else {
        this.health = {
          status: "ok",
          quarantinedCount: 0,
        };
      }
    } catch (err: unknown) {
      const errObj = err as { name?: string; code?: number; message?: string } | null;
      const errName = errObj?.name || "";
      const errMsg = errObj?.message || "";
      const errCode = errObj?.code;

      const isQuotaError =
        errName === "QuotaExceededError" ||
        errName === "NS_ERROR_DOM_QUOTA_REACHED" ||
        errCode === 22 ||
        errCode === 1014 ||
        errMsg.includes("QuotaExceededError") ||
        errMsg.toLowerCase().includes("quota exceeded");

      if (isQuotaError) {
        this.health = {
          status: "degraded_quota",
          message: "Storage quota exceeded",
          quarantinedCount: envelope.quarantinedCount || 0,
        };
        throw new StorageQuotaExceededError();
      }

      this.health = {
        status: "degraded_unavailable",
        message: err instanceof Error ? err.message : "Storage write failure",
      };
      throw new StorageUnavailableError(
        err instanceof Error ? err.message : "Storage write failed"
      );
    }
  }

  async getHealth(): Promise<StorageHealth> {
    if (!this.isBrowser || !this.isLocalStorageAvailable()) {
      return {
        status: "degraded_unavailable",
        message: "localStorage is restricted or unavailable",
      };
    }

    if (this.health.status !== "ok") {
      return { ...this.health };
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      const parseResult = parseStorageEnvelope(raw);
      if (parseResult.corrupted) {
        return {
          status: "degraded_corrupt",
          message: "Corrupted or invalid records detected and quarantined",
          quarantinedCount: parseResult.quarantinedCount,
        };
      }
    } catch {
      // Ignore read errors during health check
    }

    return { ...this.health };
  }

  async listDecisions(): Promise<DecisionAuditRecord[]> {
    const { envelope } = this.readEnvelopeDefensive();
    return envelope.records.map((rec) => JSON.parse(JSON.stringify(rec)));
  }

  async getDecision(decisionId: DecisionId): Promise<DecisionAuditRecord | null> {
    const decisions = await this.listDecisions();
    const found = decisions.find((d) => d.decision.decisionId === decisionId);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  async saveDecision(record: DecisionAuditRecord): Promise<void> {
    const parsed = DecisionAuditRecordSchema.parse(record);
    const sanitized = sanitizeRecordForStorage(parsed);

    const { envelope } = this.readEnvelopeDefensive();
    const existingIndex = envelope.records.findIndex(
      (r) => r.decision.decisionId === sanitized.decision.decisionId
    );

    const updatedRecords = [...envelope.records];
    if (existingIndex >= 0) {
      updatedRecords[existingIndex] = sanitized;
    } else {
      updatedRecords.push(sanitized);
    }

    const newEnvelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString() as IsoTimestamp,
      records: updatedRecords,
      quarantinedCount: envelope.quarantinedCount || 0,
    };

    this.writeEnvelopeDefensive(newEnvelope);
  }

  async appendAction(
    decisionId: DecisionId,
    action: UserAction
  ): Promise<DecisionAuditRecord> {
    const parsedAction = UserActionSchema.parse(action);
    const { envelope } = this.readEnvelopeDefensive();

    const existingIndex = envelope.records.findIndex(
      (r) => r.decision.decisionId === decisionId
    );

    if (existingIndex < 0) {
      throw new Error(`Decision record not found: ${decisionId}`);
    }

    const targetRecord = envelope.records[existingIndex];

    // Deep clone target record to ensure immutability of decision, detector scores, and policy versions
    const updatedRecord: DecisionAuditRecord = JSON.parse(
      JSON.stringify(targetRecord)
    );

    // Append action to actions list
    updatedRecord.actions = [...updatedRecord.actions, parsedAction];

    // Validate updated record
    const validated = DecisionAuditRecordSchema.parse(updatedRecord);
    const sanitized = sanitizeRecordForStorage(validated);

    const updatedRecords = [...envelope.records];
    updatedRecords[existingIndex] = sanitized;

    const newEnvelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString() as IsoTimestamp,
      records: updatedRecords,
      quarantinedCount: envelope.quarantinedCount || 0,
    };

    this.writeEnvelopeDefensive(newEnvelope);

    return JSON.parse(JSON.stringify(sanitized));
  }

  async clearDecisions(): Promise<void> {
    const emptyEnvelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString() as IsoTimestamp,
      records: [],
      quarantinedCount: 0,
    };
    this.memoryFallbackMap.clear();
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(this.storageKey);
        this.health = { status: "ok", quarantinedCount: 0 };
      } catch {
        this.writeEnvelopeDefensive(emptyEnvelope);
      }
    }
  }

  async seedInitialDecisions(records: DecisionAuditRecord[]): Promise<boolean> {
    const existing = await this.listDecisions();
    if (existing.length > 0) {
      return false;
    }

    const seededRecords: DecisionAuditRecord[] = records.map((rec) => {
      const seeded: DecisionAuditRecord = {
        ...rec,
        isSeeded: true,
      };
      const parsed = DecisionAuditRecordSchema.parse(seeded);
      return sanitizeRecordForStorage(parsed);
    });

    const newEnvelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString() as IsoTimestamp,
      records: seededRecords,
      quarantinedCount: 0,
    };

    this.writeEnvelopeDefensive(newEnvelope);
    return true;
  }
}
