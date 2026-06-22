# Scout: Existing Test Setup

## Summary

**No test infrastructure exists in this project.** There are no test frameworks, no test configs, no spec/test files, and no test scripts anywhere in the workspace.

## Details

### 1. Playwright / Cypress / E2E Setup

- **No Playwright config** found anywhere in the repo.
- **No Cypress config** found anywhere in the repo.
- **No `e2e/` directory** exists at root or in apps.
- **No `test/` or `__tests__/` directories** exist anywhere.
- **No `.spec.*` or `.test.*` files** exist anywhere.

### 2. Test Runners (Jest, Vitest, etc.)

- **No Jest config** (`jest.config.*` or `jest` in dependencies).
- **No Vitest config** (`vitest.config.*` or `vitest` in dependencies).
- No `jest`, `vitest`, `playwright`, or `cypress` packages in any `package.json`.
- The only test-related file is `scripts/test-email.ts` — a standalone utility function for testing email sending, not a test runner.

### 3. Package Scripts

No `test` script exists in any `package.json` across all 10 packages:

| Package           | Test Script?                                               |
| ----------------- | ---------------------------------------------------------- |
| `root`            | ❌ (dev, build, check-types, db tasks, docker, check only) |
| `apps/server`     | ❌                                                         |
| `apps/web`        | ❌                                                         |
| `packages/api`    | ❌                                                         |
| `packages/auth`   | ❌                                                         |
| `packages/config` | ❌                                                         |
| `packages/db`     | ❌                                                         |
| `packages/email`  | ❌                                                         |
| `packages/env`    | ❌                                                         |
| `packages/ui`     | ❌                                                         |

### 4. CI / Tooling

- No workspace-level test script contract exists beyond root `vp test` coverage discovery.
- `vite.config.ts` owns active linting/formatting/test config.
- `tsdown.config.ts`, `next.config.ts`, `drizzle.config.ts` — build/db tooling only.

## Conclusion

The project is a greenfield monorepo with **zero test coverage**. Any E2E (Playwright/Cypress) setup, unit test (Vitest/Jest) integration, or test pipeline will need to be added from scratch.

### Recommended Next Steps (for planning)

1. Choose test runner (Vitest is natural fit for a Bun/Vite-ecosystem project).
2. Choose E2E framework (Playwright is the de facto standard; aligns with Chromium testing).
3. Add config files (e.g., `vitest.config.ts`, `playwright.config.ts`).
4. Add test scripts to `package.json` files and wire them into root Vite+/workspace commands.
5. Create test directories (`src/**/__tests__/` or `e2e/`).
6. Set up CI (likely via GitHub Actions, but not present yet).
