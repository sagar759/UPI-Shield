import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { describe, expect, it, beforeEach } from "vitest";

import { HomeDashboard } from "@/components/home/home-dashboard";
import { ProtectionSummary } from "@/components/home/protection-summary";
import { RecentActivityPreview } from "@/components/home/recent-activity-preview";
import { SafetyTip, SAFETY_TIPS } from "@/components/home/safety-tip";
import { resetDecisionRepositoryInstance } from "@/lib/storage";
import { DecisionAuditRecord } from "@/types/risk";
import { DecisionId, RequestId, ProfileId, RupeeAmount, IsoTimestamp, NormalizedScore, DetectorVersion } from "@/lib/contracts/primitives";
import { ReasonCode } from "@/lib/contracts/schemas";
import { SCHEMA_VERSIONS, FEATURE_VERSION, POLICY_VERSION, EXPLANATION_COPY_VERSION, STORAGE_VERSION } from "@/lib/contracts/versions";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false }, // Covered by Playwright Chromium E2E
  },
});

const mockRecord: DecisionAuditRecord = {
  decision: {
    decisionId: "dec_home_test_001" as DecisionId,
    requestId: "req_test_001" as RequestId,
    timestamp: "2026-07-21T10:00:00.000Z" as IsoTimestamp,
    riskBand: "high",
    finalScore: 0.85 as NormalizedScore,
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
        reasons: [{ code: "TXN_NEW_PAYEE" as ReasonCode }],
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
        reasons: [],
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

// Custom record with summary for rendering test
const mockRecordWithInput: DecisionAuditRecord = {
  ...mockRecord,
  summary: {
    receiverId: "TEST_VPA_INVEST@example.invalid" as ProfileId,
    amount: 5000 as RupeeAmount,
  },
};

describe("Home Dashboard Components", () => {
  beforeEach(() => {
    resetDecisionRepositoryInstance();
  });

  describe("ProtectionSummary", () => {
    it("renders 3 active signal detectors and prototype notice", () => {
      render(<ProtectionSummary />);

      expect(screen.getByRole("heading", { name: "Protection Status" })).toBeVisible();
      expect(screen.getByText("Transaction Behavior")).toBeVisible();
      expect(screen.getByText("Scam Message Text")).toBeVisible();
      expect(screen.getByText("Receiver Graph")).toBeVisible();
      expect(screen.getByText(/No live bank connection/i)).toBeVisible();
    });

    it("passes axe accessibility checks", async () => {
      const { container } = render(<ProtectionSummary />);
      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });

  describe("SafetyTip", () => {
    it("renders deterministic safety tip and allows cycling tips", () => {
      render(<SafetyTip initialIndex={0} />);

      expect(screen.getByRole("heading", { name: "Safety Reminder" })).toBeVisible();
      expect(screen.getByText(SAFETY_TIPS[0].title)).toBeVisible();
      expect(screen.getByText(SAFETY_TIPS[0].content)).toBeVisible();

      const nextButton = screen.getByRole("button", { name: "Next safety tip" });
      fireEvent.click(nextButton);

      expect(screen.getByText(SAFETY_TIPS[1].title)).toBeVisible();
      expect(screen.getByText(SAFETY_TIPS[1].content)).toBeVisible();
    });

    it("passes axe accessibility checks", async () => {
      const { container } = render(<SafetyTip initialIndex={0} />);
      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });

  describe("RecentActivityPreview", () => {
    it("renders empty state when no decisions exist", async () => {
      render(<RecentActivityPreview initialRecords={[]} initialHealth={{ status: "ok" }} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "No recent decisions recorded" })).toBeVisible();
      });

      const analyzeCta = screen.getByRole("link", { name: "Analyze a Payment" });
      expect(analyzeCta).toHaveAttribute("href", "/analyze");
    });

    it("renders populated decision records with masked receiver and formatted rupee amount", async () => {
      render(
        <RecentActivityPreview
          initialRecords={[mockRecordWithInput]}
          initialHealth={{ status: "ok" }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/TE\*+@example\.invalid/i)).toBeVisible();
        expect(screen.getByText("₹5,000.00")).toBeVisible();
        expect(screen.getByText("High Risk")).toBeVisible();
      });

      const detailLink = screen.getByRole("link", { name: /Details/i });
      expect(detailLink).toHaveAttribute("href", "/activity/dec_home_test_001");
    });

    it("renders degraded storage notice when health is degraded", async () => {
      render(
        <RecentActivityPreview
          initialRecords={[]}
          initialHealth={{
            status: "degraded_quota",
            message: "Storage quota exceeded.",
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Storage Notice")).toBeVisible();
        expect(screen.getByText("Storage quota exceeded.")).toBeVisible();
      });
    });

    it("passes axe accessibility checks in populated state", async () => {
      const { container } = render(
        <RecentActivityPreview
          initialRecords={[mockRecordWithInput]}
          initialHealth={{ status: "ok" }}
        />
      );
      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });

  describe("HomeDashboard", () => {
    it("renders complete Home dashboard layout with single H1 heading", async () => {
      const { container } = render(<HomeDashboard />);

      // Single H1 heading check
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent("UPI Shield Home");

      // Greeting profile check
      expect(screen.getByText(/Aarav Sharma/i)).toBeVisible();

      // Payment Actions & People sections check
      expect(screen.getByRole("heading", { name: "Quick Payment Actions" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "People & Recent Contacts" })).toBeVisible();
      expect(screen.getByRole("link", { name: /Scan & pay/i })).toBeVisible();
      expect(screen.getByRole("link", { name: /Ramesh Verma/i })).toBeVisible();

      // Protection Summary & Safety Tip check
      expect(screen.getByRole("heading", { name: "Protection Status" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Safety Reminder" })).toBeVisible();

      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });
});
