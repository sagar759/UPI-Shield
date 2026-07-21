import { DecisionAuditRecord, UserAction } from "../../types/risk";
import { DecisionId } from "../contracts/primitives";
import { StorageHealth } from "./storage-errors";

/**
 * Framework-independent repository contract interface for decision audit records and user actions.
 */
export interface IDecisionRepository {
  /**
   * Returns current health and degradation status of the storage repository.
   */
  getHealth(): Promise<StorageHealth>;

  /**
   * Lists all stored decision audit records.
   */
  listDecisions(): Promise<DecisionAuditRecord[]>;

  /**
   * Retrieves a single decision audit record by decision ID, or null if not found.
   */
  getDecision(decisionId: DecisionId): Promise<DecisionAuditRecord | null>;

  /**
   * Saves a new decision audit record to storage.
   * Validates runtime schema and privacy invariants.
   */
  saveDecision(record: DecisionAuditRecord): Promise<void>;

  /**
   * Appends a user action (e.g. cancel, verify, override, report, copy, export) to an existing decision.
   * Invariant: Modifies ONLY the actions array. Detector scores, timestamps, and policy versions remain immutable.
   */
  appendAction(decisionId: DecisionId, action: UserAction): Promise<DecisionAuditRecord>;

  /**
   * Clears all stored decisions (resets repository state).
   */
  clearDecisions(): Promise<void>;

  /**
   * Seeds demo decision history if storage is empty.
   * Records are clearly marked with `isSeeded: true`.
   * Returns true if seeding occurred, false if store was already populated.
   */
  seedInitialDecisions(records: DecisionAuditRecord[]): Promise<boolean>;
}
