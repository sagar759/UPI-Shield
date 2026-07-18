# UPI Shield

UPI Shield is a Next.js prototype for explainable pre-payment fraud warnings.
It does not move real money or connect to banks, police, or government systems.

## Development

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Commands

Install the Chromium runtime once before the first end-to-end run:

```powershell
npx playwright install chromium
```

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run ESLint and Next.js rules. |
| `npm run typecheck` | Run strict TypeScript checking without emitting files. |
| `npm run test` | Run Vitest unit/component tests once in jsdom. |
| `npm run test:watch` | Run Vitest in watch mode during development. |
| `npm run test:coverage` | Run Vitest with V8 coverage output. |
| `npm run build` | Create the optimized Next.js production build. |
| `npm run test:e2e` | Run Playwright Chromium desktop and 360 px mobile checks. |
| `npm run check` | Run lint, typecheck, unit tests, and build in sequence. |

Vitest does not require a running Next.js server. Playwright starts or reuses
an isolated test server at `http://127.0.0.1:3100`; it does not reuse the
normal development server on port 3000 and writes its Next.js output to
`.next-playwright`.

Automated accessibility checks use axe in both the root component smoke test
and the Playwright page smoke test. The jsdom component check excludes only the
canvas-dependent color-contrast rule; the real Chromium page check evaluates
contrast. Keyboard-only operation and 200 percent browser zoom remain manual
acceptance checks.

## Test Conventions

- Shared setup lives in `src/test/setup.ts`.
- Deterministic time and pseudo-random helpers live in
  `src/test/deterministic.ts`; tests opt in rather than changing runtime
  behavior globally.
- Reusable fixtures use
  `src/test/fixtures/<domain>/<scenario>.fixture.ts` and export a readonly
  `<scenario><Domain>Fixture` value.
- Test data must be synthetic and must not contain real payment, identity, chat,
  or complaint information.
- Coverage thresholds are intentionally deferred until domain logic modules
  exist. Static route wrappers are not a line-coverage target.
