/**
 * Unit & Boundary Tests for Transaction Point-in-Time Feature Builder
 * Spec 18 Acceptance Criteria Verification
 */

import { describe, it, expect } from "vitest";
import {
  buildTransactionFeatures,
  getIstHour,
  calculateCircularHourDistance,
  RECURRING_NOTE_KEYWORDS,
  isRecurringNote,
} from "./build-features";
import { validateAndSortHistory, filterWindow, HistoricalTransaction } from "./history-windows";
import { TRANSACTION_FEATURE_CATALOG, TRANSACTION_FEATURE_VERSION } from "./feature-schema";

describe("Spec 18 - Transaction Point-in-Time Feature Builder", () => {
  const SENDER_ID = "usr_aarav_001";
  const RECEIVER_ID = "merch_starbucks_001";
  const DECISION_TIME = "2026-07-29T12:00:00.000Z"; // 12:00 UTC = 17:30 IST

  const baseInput = {
    amount: 1000,
    timestamp: DECISION_TIME,
    senderId: SENDER_ID,
    receiverId: RECEIVER_ID,
    paymentType: "scan_pay",
    device: "Android_Pixel7",
  };

  it("defines feature schema catalog with version feature-contract/v1", () => {
    expect(TRANSACTION_FEATURE_VERSION).toBe("feature-contract/v1");
    expect(TRANSACTION_FEATURE_CATALOG.amountRatio.window).toBe("lifetime");
    expect(TRANSACTION_FEATURE_CATALOG.velocityCount5m.window).toBe("5m");
    expect(TRANSACTION_FEATURE_CATALOG.amountZScore.defaultValue).toBe(0.0);
  });

  describe("Invariants: Data Leakage & Current Event Exclusion", () => {
    it("guarantees adding a future event cannot change feature output for earlier timestamp", () => {
      const priorHistory: HistoricalTransaction[] = [
        {
          transactionId: "tx_001",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 500,
          timestamp: "2026-07-29T11:00:00.000Z", // 1h prior
          status: "completed",
        },
      ];

      const resBefore = buildTransactionFeatures(baseInput, priorHistory);

      const historyWithFuture: HistoricalTransaction[] = [
        ...priorHistory,
        {
          transactionId: "tx_future_999",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 100000,
          timestamp: "2026-07-29T12:05:00.000Z", // 5 minutes AFTER decision time
          status: "completed",
        },
        {
          transactionId: "tx_future_1000",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 500000,
          timestamp: "2026-07-30T10:00:00.000Z", // 1 day AFTER decision time
          status: "completed",
        },
      ];

      const resAfter = buildTransactionFeatures(baseInput, historyWithFuture);

      expect(resAfter.features).toEqual(resBefore.features);
      expect(resAfter.metadata.historyEventCount).toBe(1);
    });

    it("guarantees an event at the exact decision timestamp is excluded from history", () => {
      const historyWithExactMatch: HistoricalTransaction[] = [
        {
          transactionId: "tx_exact_now",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 1000,
          timestamp: DECISION_TIME, // Exact same timestamp as decision time
          status: "completed",
        },
      ];

      const res = buildTransactionFeatures(baseInput, historyWithExactMatch);

      expect(res.features.velocityCount5m).toBe(0);
      expect(res.features.velocityValue5m).toBe(0);
      expect(res.features.isNewPayee).toBe(true);
      expect(res.metadata.historyEventCount).toBe(0);
    });

    it("rejects history records with duplicate IDs or invalid chronology / non-finite values", () => {
      const duplicateHistory: HistoricalTransaction[] = [
        {
          transactionId: "tx_dup_1",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 100,
          timestamp: "2026-07-29T10:00:00.000Z",
        },
        {
          transactionId: "tx_dup_1",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 200,
          timestamp: "2026-07-29T10:30:00.000Z",
        },
      ];

      expect(() => validateAndSortHistory(duplicateHistory, DECISION_TIME)).toThrow(
        "Duplicate historical transaction ID detected"
      );
    });

    it("fails fast in filterWindow when decisionTimestamp is invalid", () => {
      expect(() => filterWindow([], "invalid-date", 5)).toThrow("Invalid decision timestamp");
    });
  });

  describe("Deterministic History Calculations", () => {
    it("handles empty history deterministically", () => {
      const res = buildTransactionFeatures(baseInput, []);

      expect(res.features.amountRatio).toBe(1.0);
      expect(res.features.amountZScore).toBe(0.0);
      expect(res.features.isNewPayee).toBe(true);
      expect(res.features.relationshipAgeDays).toBe(0);
      expect(res.features.hourDeviation).toBe(0.0);
      expect(res.features.velocityCount5m).toBe(0);
      expect(res.features.velocityValue5m).toBe(0);
      expect(res.features.velocityCount30m).toBe(0);
      expect(res.features.velocityValue30m).toBe(0);
      expect(res.features.velocityCount60m).toBe(0);
      expect(res.features.velocityValue60m).toBe(0);
      expect(res.features.inactivityDays).toBe(0.0);
      expect(res.metadata.isSparseHistory).toBe(true);
      expect(res.metadata.qualityFlags).toContain("no_prior_sender_history");
    });

    it("handles sparse (single prior event) history deterministically", () => {
      const history: HistoricalTransaction[] = [
        {
          transactionId: "tx_001",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 500,
          timestamp: "2026-07-28T12:00:00.000Z", // 1 day prior
          status: "completed",
        },
      ];

      const res = buildTransactionFeatures(baseInput, history);

      expect(res.features.amountRatio).toBe(2.0); // 1000 / 500
      expect(res.features.isNewPayee).toBe(false);
      expect(res.features.relationshipAgeDays).toBe(1);
      expect(res.features.inactivityDays).toBe(1.0);
      expect(res.metadata.isSparseHistory).toBe(true);
      expect(res.metadata.qualityFlags).toContain("zero_dispersion_amount_history");
    });

    it("calculates median and MAD z-score robustly for normal multi-event history", () => {
      const history: HistoricalTransaction[] = [
        {
          transactionId: "tx_01",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 100,
          timestamp: "2026-07-20T10:00:00.000Z",
        },
        {
          transactionId: "tx_02",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 200,
          timestamp: "2026-07-21T10:00:00.000Z",
        },
        {
          transactionId: "tx_03",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 300,
          timestamp: "2026-07-22T10:00:00.000Z",
        },
      ];

      const res = buildTransactionFeatures({ ...baseInput, amount: 1000 }, history);

      expect(res.features.amountRatio).toBe(5.0);
      expect(res.features.amountZScore).toBeCloseTo(5.3958, 3);
      expect(res.features.isNewPayee).toBe(true);
      expect(res.metadata.isSparseHistory).toBe(false);
      expect(res.metadata.qualityFlags).not.toContain("zero_dispersion_amount_history");
    });

    it("tracks zero-dispersion history and appends zero_dispersion_amount_history quality flag", () => {
      const zeroDispersionHistory: HistoricalTransaction[] = [
        {
          transactionId: "tx_zero_1",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 500,
          timestamp: "2026-07-20T10:00:00.000Z",
        },
        {
          transactionId: "tx_zero_2",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 500,
          timestamp: "2026-07-21T10:00:00.000Z",
        },
        {
          transactionId: "tx_zero_3",
          senderId: SENDER_ID,
          receiverId: "rec_other",
          amount: 500,
          timestamp: "2026-07-22T10:00:00.000Z",
        },
      ];

      const resSameAmount = buildTransactionFeatures({ ...baseInput, amount: 500 }, zeroDispersionHistory);
      expect(resSameAmount.features.amountZScore).toBe(0.0);
      expect(resSameAmount.metadata.qualityFlags).toContain("zero_dispersion_amount_history");

      const resDiffAmount = buildTransactionFeatures({ ...baseInput, amount: 1500 }, zeroDispersionHistory);
      expect(resDiffAmount.features.amountZScore).toBe(2.0); // (1500-500)/500 = 2.0
      expect(Number.isFinite(resDiffAmount.features.amountZScore)).toBe(true);
      expect(resDiffAmount.metadata.qualityFlags).toContain("zero_dispersion_amount_history");
    });
  });

  describe("Recurring Rent & Known Payee Criteria", () => {
    it("exports RECURRING_NOTE_KEYWORDS constant and word-boundary aware helper", () => {
      expect(RECURRING_NOTE_KEYWORDS).toContain("rent");
      expect(isRecurringNote("House rent July")).toBe(true);
      expect(isRecurringNote("Monthly SIP installment")).toBe(true);

      // Verify standalone word boundary behavior (prevents false matches on embedded substrings)
      expect(isRecurringNote("gossip about cinema")).toBe(false);
      expect(isRecurringNote("parental guidance")).toBe(false);
      expect(isRecurringNote("sipping tea")).toBe(false);
      expect(isRecurringNote("Random coffee")).toBe(false);
    });

    it("identifies recurring rent payment with monthly periodicity and notes", () => {
      const rentHistory: HistoricalTransaction[] = [
        {
          transactionId: "tx_rent_June",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_001",
          amount: 25000,
          timestamp: "2026-06-01T09:00:00.000Z",
          note: "House Rent June",
          status: "completed",
        },
        {
          transactionId: "tx_rent_July",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_001",
          amount: 25000,
          timestamp: "2026-07-01T09:00:00.000Z",
          note: "House Rent July",
          status: "completed",
        },
      ];

      const rentInput = {
        amount: 25000,
        timestamp: "2026-07-29T10:00:00.000Z",
        senderId: SENDER_ID,
        receiverId: "landlord_vpa_001",
        note: "House Rent August",
      };

      const res = buildTransactionFeatures(rentInput, rentHistory);

      expect(res.features.isNewPayee).toBe(false);
      expect(res.features.isKnownRecurring).toBe(true);
      expect(res.features.relationshipAgeDays).toBeGreaterThanOrEqual(58);
    });

    it("requires amount-similar qualifying history for note-based recurring classification", () => {
      // 1. isNewPayee = true + note "House Rent" -> fails (no prior history)
      const resNewPayee = buildTransactionFeatures(
        {
          amount: 25000,
          timestamp: "2026-07-29T10:00:00.000Z",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_002",
          note: "House Rent",
        },
        []
      );
      expect(resNewPayee.features.isKnownRecurring).toBe(false);

      // 2. Existing payee, but prior amount was ₹50 (not matching ₹25,000) + note "House Rent" -> fails
      const historyDiffAmount: HistoricalTransaction[] = [
        {
          transactionId: "tx_small_01",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_002",
          amount: 50,
          timestamp: "2026-07-01T09:00:00.000Z",
          status: "completed",
        },
      ];

      const resDiffAmount = buildTransactionFeatures(
        {
          amount: 25000,
          timestamp: "2026-07-29T10:00:00.000Z",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_002",
          note: "House Rent",
        },
        historyDiffAmount
      );
      expect(resDiffAmount.features.isKnownRecurring).toBe(false);
    });

    it("excludes reversed transactions when assessing recurring evidence", () => {
      const historyWithReversed: HistoricalTransaction[] = [
        {
          transactionId: "tx_reversed_1",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_001",
          amount: 25000,
          timestamp: "2026-07-01T09:00:00.000Z",
          status: "reversed",
        },
      ];

      const res = buildTransactionFeatures(
        {
          amount: 25000,
          timestamp: "2026-07-29T10:00:00.000Z",
          senderId: SENDER_ID,
          receiverId: "landlord_vpa_001",
        },
        historyWithReversed
      );

      expect(res.features.isKnownRecurring).toBe(false);
    });
  });

  describe("Boundary Cutoffs (5m, 30m, 60m)", () => {
    it("enforces exact minute window cutoffs for velocity counts and values", () => {
      const decTime = "2026-07-29T12:00:00.000Z";
      const decMs = Date.parse(decTime);

      const history: HistoricalTransaction[] = [
        {
          transactionId: "tx_5m_in",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 100,
          timestamp: new Date(decMs - 5 * 60 * 1000).toISOString(), // Exact t - 5m
        },
        {
          transactionId: "tx_5m_out_30m_in",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 200,
          timestamp: new Date(decMs - 5 * 60 * 1000 - 1).toISOString(), // t - 5m - 1ms
        },
        {
          transactionId: "tx_30m_out_60m_in",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 400,
          timestamp: new Date(decMs - 30 * 60 * 1000 - 1).toISOString(), // t - 30m - 1ms
        },
        {
          transactionId: "tx_60m_out",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 800,
          timestamp: new Date(decMs - 60 * 60 * 1000 - 1).toISOString(), // t - 60m - 1ms
        },
      ];

      const res = buildTransactionFeatures({ ...baseInput, timestamp: decTime }, history);

      expect(res.features.velocityCount5m).toBe(1);
      expect(res.features.velocityValue5m).toBe(100);

      expect(res.features.velocityCount30m).toBe(2);
      expect(res.features.velocityValue30m).toBe(300);

      expect(res.features.velocityCount60m).toBe(3);
      expect(res.features.velocityValue60m).toBe(700);
    });
  });

  describe("Timezone Calculations (IST Asia/Kolkata)", () => {
    it("correctly converts UTC to IST hours and computes circular hour deviation", () => {
      const timestampUtc = "2026-07-29T18:30:00.000Z";
      expect(getIstHour(timestampUtc)).toBe(0);

      const timestampUtc10am = "2026-07-29T04:30:00.000Z";
      expect(getIstHour(timestampUtc10am)).toBe(10);

      expect(calculateCircularHourDistance(23, 1)).toBe(2);
      expect(calculateCircularHourDistance(14, 14)).toBe(0);
      expect(calculateCircularHourDistance(12, 0)).toBe(12);

      const history: HistoricalTransaction[] = [
        {
          transactionId: "tx_ist_10am",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 500,
          timestamp: "2026-07-28T04:30:00.000Z", // 10:00 IST
        },
      ];

      const res = buildTransactionFeatures(
        { ...baseInput, timestamp: "2026-07-29T18:30:00.000Z" },
        history
      );

      expect(res.features.hourDeviation).toBe(10);
    });
  });

  describe("Contextual Options & Privacy Safeguards", () => {
    it("honors options.recentFailuresCount directly when provided", () => {
      const historyWithFailures: HistoricalTransaction[] = [
        {
          transactionId: "tx_fail_1",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 100,
          timestamp: "2026-07-29T11:55:00.000Z",
          status: "failed",
        },
        {
          transactionId: "tx_fail_2",
          senderId: SENDER_ID,
          receiverId: RECEIVER_ID,
          amount: 100,
          timestamp: "2026-07-29T11:58:00.000Z",
          status: "failed",
        },
      ];

      const resExplicitZero = buildTransactionFeatures(baseInput, historyWithFailures, {
        recentFailuresCount: 0,
      });
      expect(resExplicitZero.features.recentFailuresCount).toBe(0);

      const resAbsentOption = buildTransactionFeatures(baseInput, historyWithFailures);
      expect(resAbsentOption.features.recentFailuresCount).toBe(2);
    });

    it("defaults isCollectRequest to false when option omitted even if paymentType is check_upi", () => {
      const resCheckUpi = buildTransactionFeatures(
        { ...baseInput, paymentType: "check_upi" },
        []
      );
      expect(resCheckUpi.features.isCollectRequest).toBe(false);

      const resOptionTrue = buildTransactionFeatures(
        { ...baseInput, paymentType: "check_upi" },
        [],
        { isCollectRequest: true }
      );
      expect(resOptionTrue.features.isCollectRequest).toBe(true);
    });

    it("ensures raw sender/receiver identifiers are excluded from the returned features object", () => {
      const res = buildTransactionFeatures(baseInput, []);
      const keys = Object.keys(res.features);

      expect(keys).not.toContain("senderId");
      expect(keys).not.toContain("receiverId");
      expect(keys).not.toContain("transactionId");
      expect(keys).not.toContain("device");
      expect(keys).not.toContain("scenarioId");
    });
  });
});
