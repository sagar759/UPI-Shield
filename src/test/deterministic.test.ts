import { describe, expect, it } from "vitest";

import {
  createSeededRandom,
  DEFAULT_TEST_TIME,
  installDeterministicRuntime,
} from "@/test/deterministic";

describe("deterministic test helpers", () => {
  it("generates the same sequence for the same seed", () => {
    const first = createSeededRandom(7);
    const second = createSeededRandom(7);

    expect([first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
    ]);
  });

  it("controls the clock and Math.random when explicitly installed", () => {
    const expectedRandom = createSeededRandom(7)();
    const restore = installDeterministicRuntime({ seed: 7 });

    expect(new Date().toISOString()).toBe(DEFAULT_TEST_TIME);
    expect(Math.random()).toBe(expectedRandom);

    restore();
  });
});
