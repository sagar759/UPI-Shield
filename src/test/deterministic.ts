import { vi } from "vitest";

export const DEFAULT_TEST_TIME = "2026-01-15T06:30:00.000Z";
export const DEFAULT_TEST_RANDOM_SEED = 42;

export interface DeterministicRuntimeOptions {
  now?: string | number | Date;
  seed?: number;
}

export function createSeededRandom(
  seed = DEFAULT_TEST_RANDOM_SEED,
): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function installDeterministicRuntime({
  now = DEFAULT_TEST_TIME,
  seed = DEFAULT_TEST_RANDOM_SEED,
}: DeterministicRuntimeOptions = {}): () => void {
  const systemTime = now instanceof Date ? now : new Date(now);

  vi.useFakeTimers();
  vi.setSystemTime(systemTime);
  const randomSpy = vi
    .spyOn(Math, "random")
    .mockImplementation(createSeededRandom(seed));

  return () => {
    randomSpy.mockRestore();
    vi.useRealTimers();
  };
}
