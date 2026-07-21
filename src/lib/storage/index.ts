import { IDecisionRepository } from "./decision-repository";
import { MemoryDecisionRepository } from "./memory-decision-repository";
import { BrowserDecisionRepository } from "./browser-decision-repository";
import { DEFAULT_STORAGE_KEY } from "./storage-schema";

export * from "./storage-errors";
export * from "./storage-schema";
export * from "./decision-repository";
export * from "./memory-decision-repository";
export * from "./browser-decision-repository";

/**
 * Map holding cached BrowserDecisionRepository instances keyed by storageKey.
 */
const repositoryInstances = new Map<string, BrowserDecisionRepository>();

/**
 * Factory function to retrieve the appropriate IDecisionRepository.
 * Safe for server component rendering, SSR, client browser, and unit tests.
 */
export function getDecisionRepository(options?: {
  storageKey?: string;
  forceMemory?: boolean;
}): IDecisionRepository {
  if (options?.forceMemory) {
    return new MemoryDecisionRepository();
  }

  const isBrowser = (() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage !== undefined;
    } catch {
      return false;
    }
  })();

  if (!isBrowser) {
    return new MemoryDecisionRepository();
  }

  const key = options?.storageKey || DEFAULT_STORAGE_KEY;
  let instance = repositoryInstances.get(key);
  if (!instance) {
    instance = new BrowserDecisionRepository(key);
    repositoryInstances.set(key, instance);
  }

  return instance;
}

/**
 * Resets cached instances (useful for testing).
 * Destroys and clears all cached browser decision repositories.
 */
export function resetDecisionRepositoryInstance(): void {
  for (const instance of repositoryInstances.values()) {
    instance.destroy();
  }
  repositoryInstances.clear();
}
