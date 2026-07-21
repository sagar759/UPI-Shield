import { ScenarioId } from "../../lib/contracts/primitives";
import { ReasonCode, RiskBand, RecommendedAction, DetectorName, DetectorAvailability } from "../../lib/contracts/schemas";
import { DEMO_SCENARIOS } from "./scenarios";

export interface RegressionExpectation {
  scenarioId: ScenarioId;
  expectedRiskBand: RiskBand;
  expectedReasons: ReasonCode[];
  expectedRecommendedAction: RecommendedAction;
  expectedDetectorAvailability: Record<DetectorName, DetectorAvailability>;
  expectedDegradedReason?: string;
  notes: string;
}

interface ExpectationMetaData {
  expectedRecommendedAction: RecommendedAction;
  expectedDetectorAvailability: Record<DetectorName, DetectorAvailability>;
  expectedDegradedReason?: string;
  notes: string;
}

const REGRESSION_MANIFEST_METADATA: Record<string, ExpectationMetaData> = {
  "scenario-student-investment": {
    expectedRecommendedAction: "interrupt",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "High risk due to urgency, investment keywords, new payee, and new receiver mule account.",
  },

  "scenario-refund-qr": {
    expectedRecommendedAction: "interrupt",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "High risk due to collect request posing as refund with credential harvesting text.",
  },

  "scenario-digital-arrest": {
    expectedRecommendedAction: "interrupt",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "High risk due to police threat scam text, high amount z-score, and pass-through mule account.",
  },

  "scenario-mule-receiver": {
    expectedRecommendedAction: "interrupt",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "unavailable",
      receiver: "available",
    },
    notes: "High risk due to rapid pass-through money mule graph anomalies; message detector is unavailable (no text/consent).",
  },

  "scenario-recurring-rent": {
    expectedRecommendedAction: "allow",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "Low risk baseline; routine rent transfer to established landlord contact.",
  },

  "scenario-first-verified-merchant": {
    expectedRecommendedAction: "allow",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "unavailable",
      receiver: "available",
    },
    notes: "Hard legitimate case: new payee flag raised by transaction detector, but verified merchant status keeps risk low.",
  },

  "scenario-emergency-hospital-payment": {
    expectedRecommendedAction: "verify",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "Hard legitimate case: late-night high-amount payment triggers transaction warnings, but verified hospital payee context prevents high risk block.",
  },

  "scenario-travel-device-change": {
    expectedRecommendedAction: "verify",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "Hard legitimate case: device/location change flags, but trusted counterparty contact keeps risk medium.",
  },

  "scenario-high-fan-in-merchant": {
    expectedRecommendedAction: "verify",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "unavailable",
      receiver: "available",
    },
    notes: "Hard legitimate case: high fan-in senders triggers receiver warning, but low pass-through ratio prevents mule classification.",
  },

  "scenario-benign-bank-warning": {
    expectedRecommendedAction: "allow",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "Hard legitimate case: bank SMS advisory contains security terminology (OTP, limit) but in a non-phishing advisory context.",
  },

  "scenario-recurring-high-value-rent": {
    expectedRecommendedAction: "verify",
    expectedDetectorAvailability: {
      transaction: "available",
      message: "available",
      receiver: "available",
    },
    notes: "Hard legitimate case: high amount z-score triggers transaction alert, but long-standing landlord relationship suppresses high risk outcome.",
  },
};

export const REGRESSION_EXPECTATIONS: Record<string, RegressionExpectation> = Object.fromEntries(
  DEMO_SCENARIOS.map((scenario) => {
    const meta = REGRESSION_MANIFEST_METADATA[scenario.scenarioId];
    if (!meta) {
      throw new Error(`Missing metadata for scenario ${scenario.scenarioId}`);
    }
    return [
      scenario.scenarioId,
      {
        scenarioId: scenario.scenarioId,
        expectedRiskBand: scenario.expectedRiskBand,
        expectedReasons: scenario.expectedReasons,
        expectedRecommendedAction: meta.expectedRecommendedAction,
        expectedDetectorAvailability: meta.expectedDetectorAvailability,
        ...(meta.expectedDegradedReason ? { expectedDegradedReason: meta.expectedDegradedReason } : {}),
        notes: meta.notes,
      },
    ];
  })
);

export function getRegressionExpectation(scenarioId: string): RegressionExpectation | undefined {
  return REGRESSION_EXPECTATIONS[scenarioId];
}
