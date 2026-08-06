export const SCHEMA_VERSIONS = {
  detectorResult: "detector-result/v1",
  transactionInput: "transaction-check-input/v1",
  messageInput: "message-check-input/v1",
  receiverInput: "receiver-check-input/v1",
  riskDecision: "risk-decision/v1",
  userAction: "user-action/v1",
  decisionAudit: "decision-audit-record/v1",
  complaintEvidence: "complaint-evidence/v1",
  complaintIntake: "complaint-intake/v1",
  complaintDraft: "complaint-draft/v1",
  demoScenario: "demo-scenario/v1",
  demoScenarioCatalog: "demo-scenario-catalog/v1",
} as const;

export const FEATURE_VERSION = "feature-contract/v1";
export const POLICY_VERSION = "risk-policy/v1";
export const EXPLANATION_COPY_VERSION = "explanation-copy/en-IN/v1";
export const STORAGE_VERSION = "decision-storage/v1";
export const TEXT_PREPROCESSING_VERSION = "text-preprocessing/v1";
export const ENTITY_EXTRACTION_VERSION = "entity-extraction/v1";
export const TEXT_DETECTOR_VERSION = "text-detector/v1";

export const CONTRACT_VERSIONS = {
  schemas: SCHEMA_VERSIONS,
  feature: FEATURE_VERSION,
  policy: POLICY_VERSION,
  explanationCopy: EXPLANATION_COPY_VERSION,
  storage: STORAGE_VERSION,
  textPreprocessing: TEXT_PREPROCESSING_VERSION,
  entityExtraction: ENTITY_EXTRACTION_VERSION,
  textDetector: TEXT_DETECTOR_VERSION,
} as const;

export type SchemaVersion =
  (typeof SCHEMA_VERSIONS)[keyof typeof SCHEMA_VERSIONS];
