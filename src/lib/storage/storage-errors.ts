export type StorageHealthStatus =
  | "ok"
  | "degraded_unavailable"
  | "degraded_quota"
  | "degraded_corrupt";

export interface StorageHealth {
  status: StorageHealthStatus;
  message?: string;
  quarantinedCount?: number;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly status: StorageHealthStatus = "degraded_unavailable"
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class StorageQuotaExceededError extends StorageError {
  constructor(message = "Storage quota exceeded") {
    super(message, "degraded_quota");
    this.name = "StorageQuotaExceededError";
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message = "Browser storage is unavailable") {
    super(message, "degraded_unavailable");
    this.name = "StorageUnavailableError";
  }
}

export class StorageCorruptedError extends StorageError {
  constructor(message = "Storage payload is corrupted or invalid") {
    super(message, "degraded_corrupt");
    this.name = "StorageCorruptedError";
  }
}
