import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  IDecisionRepository,
  MemoryDecisionRepository,
  BrowserDecisionRepository,
  getDecisionRepository,
  resetDecisionRepositoryInstance,
  StorageQuotaExceededError,
  parseStorageEnvelope,
  sanitizeRecordForStorage,
} from "../lib/storage";
import { DecisionAuditRecord, UserAction } from "../types/risk";
import { DecisionId, RequestId, UserActionId, IsoTimestamp, NormalizedScore, DetectorVersion } from "../lib/contracts/primitives";
import { ReasonCode } from "../lib/contracts/schemas";
import {
  SCHEMA_VERSIONS,
  FEATURE_VERSION,
  POLICY_VERSION,
  EXPLANATION_COPY_VERSION,
  STORAGE_VERSION,
} from "../lib/contracts/versions";

function createMockRecord(decisionIdStr = "dec_test_001"): DecisionAuditRecord {
  return {
    decision: {
      decisionId: decisionIdStr as DecisionId,
      requestId: "req_test_001" as RequestId,
      timestamp: "2026-07-21T10:00:00.000Z" as IsoTimestamp,
      finalScore: 0.85 as NormalizedScore,
      riskBand: "high",
      recommendedAction: "interrupt",
      coverage: {
        coverage: 1.0,
        availableDetectors: ["transaction", "message", "receiver"],
        unavailableDetectors: [],
      },
      detectors: {
        transaction: {
          name: "transaction",
          version: "txn-detector/v1" as DetectorVersion,
          availability: "available",
          score: 0.8 as NormalizedScore,
          confidence: 0.9 as NormalizedScore,
          reasons: [{ code: "TXN_AMOUNT_RATIO_HIGH" as ReasonCode }],
          latencyMs: 12,
        },
        message: {
          name: "message",
          version: "msg-detector/v1" as DetectorVersion,
          availability: "available",
          score: 0.9 as NormalizedScore,
          confidence: 0.95 as NormalizedScore,
          reasons: [{ code: "SCAM_URGENCY" as ReasonCode }],
          latencyMs: 15,
        },
        receiver: {
          name: "receiver",
          version: "rcv-detector/v1" as DetectorVersion,
          availability: "available",
          score: 0.85 as NormalizedScore,
          confidence: 0.88 as NormalizedScore,
          reasons: [{ code: "RCV_UNIQUE_SENDERS_HIGH" as ReasonCode }],
          latencyMs: 8,
        },
      },
      policyVersion: POLICY_VERSION,
    },
    schemaVersion: SCHEMA_VERSIONS.decisionAudit,
    featureVersion: FEATURE_VERSION,
    policyVersion: POLICY_VERSION,
    explanationCopyVersion: EXPLANATION_COPY_VERSION,
    storageVersion: STORAGE_VERSION,
    recordedAt: "2026-07-21T10:00:00.000Z" as IsoTimestamp,
    actions: [],
  };
}

describe("Decision Repository Contract Tests", () => {
  const implementations: Array<{ name: string; factory: () => IDecisionRepository }> = [
    {
      name: "MemoryDecisionRepository",
      factory: () => new MemoryDecisionRepository(),
    },
    {
      name: "BrowserDecisionRepository",
      factory: () => new BrowserDecisionRepository("test_storage_key"),
    },
  ];

  implementations.forEach(({ name, factory }) => {
    describe(name, () => {
      let repo: IDecisionRepository;

      beforeEach(async () => {
        if (typeof window !== "undefined") {
          window.localStorage.clear();
        }
        repo = factory();
        await repo.clearDecisions();
      });

      afterEach(async () => {
        await repo.clearDecisions();
        if (repo instanceof BrowserDecisionRepository) {
          repo.destroy();
        }
      });

      it("starts with healthy status and empty decisions list", async () => {
        const health = await repo.getHealth();
        expect(health.status).toBe("ok");

        const list = await repo.listDecisions();
        expect(list).toEqual([]);
      });

      it("saves and retrieves a decision audit record", async () => {
        const record = createMockRecord("dec_001");
        await repo.saveDecision(record);

        const list = await repo.listDecisions();
        expect(list.length).toBe(1);
        expect(list[0].decision.decisionId).toBe("dec_001");

        const fetched = await repo.getDecision("dec_001" as DecisionId);
        expect(fetched).not.toBeNull();
        expect(fetched?.decision.finalScore).toBe(0.85);
        expect(fetched?.decision.riskBand).toBe("high");
      });

      it("returns null when getting a non-existent decision", async () => {
        const fetched = await repo.getDecision("non_existent" as DecisionId);
        expect(fetched).toBeNull();
      });

      it("appends user action while leaving decision and policy versions immutable", async () => {
        const record = createMockRecord("dec_002");
        await repo.saveDecision(record);

        const action: UserAction = {
          actionId: "act_001" as UserActionId,
          decisionId: "dec_002" as DecisionId,
          type: "override",
          timestamp: "2026-07-21T10:05:00.000Z" as IsoTimestamp,
          metadata: { reason: "User verified in person" },
        };

        const updated = await repo.appendAction("dec_002" as DecisionId, action);

        // Verify action added
        expect(updated.actions.length).toBe(1);
        expect(updated.actions[0].actionId).toBe("act_001");
        expect(updated.actions[0].type).toBe("override");

        // Verify immutability of decision score, detectors, and versions
        expect(updated.decision.finalScore).toBe(0.85);
        expect(updated.decision.riskBand).toBe("high");
        expect(updated.decision.policyVersion).toBe(POLICY_VERSION);
        expect(updated.storageVersion).toBe(STORAGE_VERSION);
        expect(updated.recordedAt).toBe("2026-07-21T10:00:00.000Z");

        // Fetch again from store and verify persistence
        const fetched = await repo.getDecision("dec_002" as DecisionId);
        expect(fetched?.actions.length).toBe(1);
      });

      it("throws when appending action to non-existent decision", async () => {
        const action: UserAction = {
          actionId: "act_002" as UserActionId,
          decisionId: "missing_id" as DecisionId,
          type: "cancel",
          timestamp: "2026-07-21T10:05:00.000Z" as IsoTimestamp,
        };

        await expect(repo.appendAction("missing_id" as DecisionId, action)).rejects.toThrow();
      });

      it("seeds initial demo decisions when store is empty and marks them isSeeded", async () => {
        const records = [createMockRecord("dec_seed_1"), createMockRecord("dec_seed_2")];
        const seeded = await repo.seedInitialDecisions(records);
        expect(seeded).toBe(true);

        const list = await repo.listDecisions();
        expect(list.length).toBe(2);
        expect(list[0].isSeeded).toBe(true);
        expect(list[1].isSeeded).toBe(true);

        // Calling again when store is non-empty returns false
        const secondSeed = await repo.seedInitialDecisions([createMockRecord("dec_seed_3")]);
        expect(secondSeed).toBe(false);

        const listAfter = await repo.listDecisions();
        expect(listAfter.length).toBe(2);
      });

      it("clears all decisions cleanly", async () => {
        await repo.saveDecision(createMockRecord("dec_clear_1"));
        expect((await repo.listDecisions()).length).toBe(1);

        await repo.clearDecisions();
        expect((await repo.listDecisions()).length).toBe(0);
      });
    });
  });
});

describe("Browser Storage Edge Cases & Degraded Handling", () => {
  const TEST_KEY = "upi_shield_edge_case_key";

  beforeEach(() => {
    window.localStorage.clear();
    resetDecisionRepositoryInstance();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetDecisionRepositoryInstance();
    vi.restoreAllMocks();
  });

  it("handles corrupted JSON payload gracefully and transitions to degraded_corrupt", async () => {
    // Inject corrupt non-JSON string into localStorage
    window.localStorage.setItem(TEST_KEY, "INVALID_NON_JSON_STRING{{{");

    const repo = new BrowserDecisionRepository(TEST_KEY);
    const health = await repo.getHealth();

    expect(health.status).toBe("degraded_corrupt");
    expect(health.quarantinedCount).toBe(1);

    // List decisions should return empty list without crashing
    const list = await repo.listDecisions();
    expect(list).toEqual([]);

    repo.destroy();
  });

  it("quarantines individual corrupted records while preserving valid records", async () => {
    const validRecord = createMockRecord("dec_valid_01");
    const corruptedPayload = JSON.stringify({
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      records: [
        validRecord,
        { invalidField: "corrupted_record_payload" },
      ],
      quarantinedCount: 0,
    });

    window.localStorage.setItem(TEST_KEY, corruptedPayload);

    const repo = new BrowserDecisionRepository(TEST_KEY);
    const list = await repo.listDecisions();

    expect(list.length).toBe(1);
    expect(list[0].decision.decisionId).toBe("dec_valid_01");

    const health = await repo.getHealth();
    expect(health.status).toBe("degraded_corrupt");
    expect(health.quarantinedCount).toBe(1);

    repo.destroy();
  });

  it("handles QuotaExceededError and sets health to degraded_quota", async () => {
    const repo = new BrowserDecisionRepository(TEST_KEY);

    // Mock localStorage.setItem to simulate QuotaExceededError
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const quotaError = new DOMException("QuotaExceededError", "QuotaExceededError");
      throw quotaError;
    });

    const record = createMockRecord("dec_quota_01");
    await expect(repo.saveDecision(record)).rejects.toThrow(StorageQuotaExceededError);

    const health = await repo.getHealth();
    expect(health.status).toBe("degraded_quota");

    repo.destroy();
  });

  it("handles cross-tab storage event updates", async () => {
    const repo = new BrowserDecisionRepository(TEST_KEY);
    await repo.saveDecision(createMockRecord("dec_tab_1"));

    // Simulate external tab update in localStorage
    const newRecord = createMockRecord("dec_tab_2");
    const externalPayload = JSON.stringify({
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      records: [createMockRecord("dec_tab_1"), newRecord],
      quarantinedCount: 0,
    });
    window.localStorage.setItem(TEST_KEY, externalPayload);

    // Dispatch window storage event
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TEST_KEY,
        newValue: externalPayload,
      })
    );

    const updatedList = await repo.listDecisions();
    expect(updatedList.length).toBe(2);

    repo.destroy();
  });

  it("defensive parseStorageEnvelope returns clean envelope for null or empty string", () => {
    const nullResult = parseStorageEnvelope(null);
    expect(nullResult.corrupted).toBe(false);
    expect(nullResult.envelope.records).toEqual([]);

    const emptyResult = parseStorageEnvelope("   ");
    expect(emptyResult.corrupted).toBe(false);
    expect(emptyResult.envelope.records).toEqual([]);
  });

  it("parseStorageEnvelope returns corrupted: false when direct-parse succeeds even with historical quarantinedCount", () => {
    const validPayloadWithHistory = JSON.stringify({
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      records: [createMockRecord("dec_hist_01")],
      quarantinedCount: 2,
    });

    const parseResult = parseStorageEnvelope(validPayloadWithHistory);
    expect(parseResult.corrupted).toBe(false);
    expect(parseResult.quarantinedCount).toBe(2);
    expect(parseResult.envelope.records.length).toBe(1);
  });

  it("sanitizeRecordForStorage strips unconsented text recursively from action metadata while preserving consented text", () => {
    const record = createMockRecord("dec_sanitize_01");
    record.actions = [
      {
        actionId: "act_unconsented" as UserActionId,
        decisionId: "dec_sanitize_01" as DecisionId,
        type: "report",
        timestamp: "2026-07-21T10:00:00.000Z" as IsoTimestamp,
        metadata: {
          messageText: "Secret unconsented text",
          reason: "User report",
          consentGiven: false,
          nestedObj: {
            rawText: "Nested secret text",
            safeValue: 42,
            deepArray: [
              { chatText: "Array secret text", label: "item1" },
            ],
          },
        },
      },
      {
        actionId: "act_consented" as UserActionId,
        decisionId: "dec_sanitize_01" as DecisionId,
        type: "report",
        timestamp: "2026-07-21T10:05:00.000Z" as IsoTimestamp,
        metadata: {
          messageText: "Consented chat text",
          reason: "Consented report",
          consentGiven: true,
          nestedObj: {
            rawText: "Consented nested text",
            safeValue: 99,
          },
        },
      },
    ];

    const sanitized = sanitizeRecordForStorage(record);
    expect(sanitized.actions[0].metadata?.messageText).toBeUndefined();
    expect(sanitized.actions[0].metadata?.reason).toBe("User report");
    const nestedObj0 = sanitized.actions[0].metadata?.nestedObj as Record<string, unknown>;
    expect(nestedObj0.rawText).toBeUndefined();
    expect(nestedObj0.safeValue).toBe(42);
    const deepArray0 = nestedObj0.deepArray as Array<Record<string, unknown>>;
    expect(deepArray0[0].chatText).toBeUndefined();
    expect(deepArray0[0].label).toBe("item1");

    expect(sanitized.actions[1].metadata?.messageText).toBe("Consented chat text");
    const nestedObj1 = sanitized.actions[1].metadata?.nestedObj as Record<string, unknown>;
    expect(nestedObj1.rawText).toBe("Consented nested text");
    expect(nestedObj1.safeValue).toBe(99);
  });

  it("factory function getDecisionRepository caches instances by storageKey and isolates keys", () => {
    const repoA1 = getDecisionRepository({ storageKey: "key_A" });
    const repoA2 = getDecisionRepository({ storageKey: "key_A" });
    const repoB = getDecisionRepository({ storageKey: "key_B" });

    expect(repoA1).toBe(repoA2);
    expect(repoA1).not.toBe(repoB);

    resetDecisionRepositoryInstance();
    const repoA3 = getDecisionRepository({ storageKey: "key_A" });
    expect(repoA3).not.toBe(repoA1);
  });

  it("getHealth is read-only and does not mutate memoryFallbackMap or rewrite storage", async () => {
    const repo = new BrowserDecisionRepository(TEST_KEY);
    await repo.saveDecision(createMockRecord("dec_health_1"));

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockClear();

    try {
      const health1 = await repo.getHealth();
      expect(health1.status).toBe("ok");

      const health2 = await repo.getHealth();
      expect(health2.status).toBe("ok");

      expect(setItemSpy).not.toHaveBeenCalled();

      const list = await repo.listDecisions();
      expect(list.length).toBe(1);
    } finally {
      setItemSpy.mockRestore();
      repo.destroy();
    }
  });
});
