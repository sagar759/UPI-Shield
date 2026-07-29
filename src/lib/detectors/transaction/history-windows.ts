/**
 * Pure Domain Windowing & History Filtering Functions
 * Aligned with Spec 18
 */

export interface HistoricalTransaction {
  readonly transactionId: string;
  readonly senderId: string;
  readonly receiverId: string;
  readonly amount: number;
  readonly timestamp: string; // ISO 8601 string
  readonly status?: "completed" | "failed" | "reversed";
  readonly paymentType?: string;
  readonly device?: string;
  readonly region?: string;
  readonly note?: string;
}

/**
 * Validates, deduplicates, and sorts historical transactions chronologically.
 * Strictly excludes any event at or after the decision timestamp to eliminate data leakage.
 */
export function validateAndSortHistory(
  history: readonly HistoricalTransaction[],
  decisionTimestamp: string
): HistoricalTransaction[] {
  const decisionMs = Date.parse(decisionTimestamp);
  if (isNaN(decisionMs)) {
    throw new Error(`Invalid decision timestamp: ${decisionTimestamp}`);
  }

  const seenIds = new Set<string>();
  const validHistory: HistoricalTransaction[] = [];

  for (const tx of history) {
    if (!tx || typeof tx !== "object") continue;

    // Validate identifiers
    if (!tx.transactionId || typeof tx.transactionId !== "string" || tx.transactionId.trim() === "") {
      throw new Error("Historical transaction missing valid transactionId.");
    }
    if (!tx.senderId || typeof tx.senderId !== "string" || tx.senderId.trim() === "") {
      throw new Error(`Historical transaction ${tx.transactionId} missing valid senderId.`);
    }
    if (!tx.receiverId || typeof tx.receiverId !== "string" || tx.receiverId.trim() === "") {
      throw new Error(`Historical transaction ${tx.transactionId} missing valid receiverId.`);
    }

    // Check duplicate ID
    if (seenIds.has(tx.transactionId)) {
      throw new Error(`Duplicate historical transaction ID detected: ${tx.transactionId}`);
    }

    // Validate amount
    if (typeof tx.amount !== "number" || !Number.isFinite(tx.amount) || tx.amount <= 0) {
      throw new Error(`Invalid transaction amount for ID ${tx.transactionId}: ${tx.amount}`);
    }

    // Validate timestamp
    const txMs = Date.parse(tx.timestamp);
    if (isNaN(txMs)) {
      throw new Error(`Invalid transaction timestamp for ID ${tx.transactionId}: ${tx.timestamp}`);
    }

    // STRICT POINT-IN-TIME LEAKAGE INVARIANT:
    // Any event at or after the decision timestamp is excluded.
    if (txMs >= decisionMs) {
      continue;
    }

    seenIds.add(tx.transactionId);
    validHistory.push(tx);
  }

  // Sort ascending chronologically
  return validHistory.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

/**
 * Filters history to events strictly occurring within [decisionTimestamp - windowMinutes, decisionTimestamp)
 */
export function filterWindow(
  history: readonly HistoricalTransaction[],
  decisionTimestamp: string,
  windowMinutes: number
): HistoricalTransaction[] {
  const decisionMs = Date.parse(decisionTimestamp);
  if (isNaN(decisionMs)) {
    throw new Error(`Invalid decision timestamp: ${decisionTimestamp}`);
  }
  const windowMs = windowMinutes * 60 * 1000;
  const startMs = decisionMs - windowMs;

  return history.filter((tx) => {
    const txMs = Date.parse(tx.timestamp);
    return txMs >= startMs && txMs < decisionMs;
  });
}

/**
 * Returns transactions belonging to the given sender ID
 */
export function getSenderHistory(
  history: readonly HistoricalTransaction[],
  senderId: string
): HistoricalTransaction[] {
  return history.filter((tx) => tx.senderId === senderId);
}

/**
 * Returns transactions between a specific sender ID and receiver ID
 */
export function getSenderReceiverHistory(
  history: readonly HistoricalTransaction[],
  senderId: string,
  receiverId: string
): HistoricalTransaction[] {
  return history.filter((tx) => tx.senderId === senderId && tx.receiverId === receiverId);
}
