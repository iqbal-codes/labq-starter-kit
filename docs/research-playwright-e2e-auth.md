# Research: Playwright E2E Testing with Better Auth

**Date:** 2026-05-28  
**Status:** Greenfield - No test infrastructure exists

---

## 1. Codebase Analysis

### Tech Stack

| Component | Technology               |
| --------- | ------------------------ |
| Frontend  | Next.js 16 (App Router)  |
| Backend   | Hono                     |
| Auth      | Better Auth 1.6.11       |
| Database  | PostgreSQL + Drizzle ORM |
| i18n      | next-intl                |
| API       | ORPC (OpenRPC)           |

### Auth Architecture

```
apps/web (Next.js)
├── proxy.ts           # Middleware: session check, auth redirects, i18n
├── /auth/sign-in      # Login page → SignInForm component
├── /auth/sign-up      # Registration page
└── /api/auth/[...auth] # Delegates to @admin-template/auth

packages/auth
└── createAuth()      # Better Auth config with:
                      #   - Email/password
                      #   - OAuth (GitHub, Google)
                      #   - Organization plugin
                      #   - Next-cookies integration

apps/server (Hono)
└── /api/auth/*       # All better-auth endpoints
```

### Key Auth Files

- `apps/web/src/components/auth/sign-in-form.tsx` - Login UI
- `apps/web/src/lib/auth-client.ts` - Client singleton
- `packages/auth/src/index.ts` - Server auth config
- `apps/web/proxy.ts` - Auth middleware

### No Test Infrastructure

- ❌ No Playwright/Vitest/Jest config
- ❌ No test files anywhere
- ❌ No test dependencies in package.json
- ❌ No test scripts

---

## 2. Research Findings

### A. Better Auth Test Utils Plugin (Recommended)

Better Auth provides a **first-party `testUtils()` plugin** for E2E testing:

```ts
// packages/auth/src/test.ts  (separate test config)
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import { db } from "@admin-template/db";
import { authSchema } from "./schema";

export const testAuth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
	// ... minimal config needed for testUtils
	plugins: [testUtils()],
});
```

**Key helpers via `ctx.test`:**
| Method | Purpose |
|--------|---------|
| `createUser()` | Create user object (not persisted) |
| `saveUser(user)` | Persist user to database |
| `deleteUser(userId)` | Clean up after test |
| `login({ userId })` | Create session, return details |
| `getCookies({ userId, domain })` | Get Playwright-compatible cookies |
| `getAuthHeaders({ userId })` | Get headers for API testing |
| `createOrganization()` | For org plugin tests |

### B. better-auth-playwright Library

A **third-party library** built on testUtils for cleaner integration:

```ts
// e2e/fixtures.ts
import { createTestFixtures } from "better-auth-playwright";

export const test = createTestFixtures({
	secret: process.env.TEST_DATA_SECRET!,
});

// Usage
test("dashboard", async ({ page, auth }) => {
	const user = await auth.createUser({
		email: "test@example.com",
		name: "Test User",
	});
	// Cookies auto-injected!
	await page.goto("/dashboard");
});
```

**Features:**

- Auto cookie injection
- Auto cleanup of test users
- OAuth simulation (`createOAuthUser()`)
- Organization plugin support

### C. API vs UI Authentication

| Approach                | Speed             | Reliability                  | Use Case                  |
| ----------------------- | ----------------- | ---------------------------- | ------------------------- |
| **UI Login**            | 2-5s per test     | Flaky (DOM changes, network) | Only for auth flow tests  |
| **API Login**           | 50-100ms per test | Reliable                     | Default for feature tests |
| **testUtils DB Direct** | Fastest           | Most reliable                | Best for Better Auth      |

**Recommendation:** API-based auth is **50-100x faster** and more reliable.

### D. Playwright Setup Project Pattern

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	projects: [
		// Setup project - runs first, authenticates
		{ name: "setup", testMatch: /.*\.setup\.ts/ },

		// Test projects - use saved auth state
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],
});
```

---

## 3. Recommended Approach for This Project

### Option A: testUtils + Setup Project (Most Reliable)

**Step 1:** Install Playwright

```bash
pnpm add -D @playwright/test
pnpm playwright install chromium --with-deps
```

**Step 2:** Create test auth config

```ts
// packages/auth/src/test.ts
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import { db } from "@admin-template/db";
import * as schema from "@admin-template/db/src/schema";

export const testAuth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: { enabled: true },
	plugins: [testUtils()],
	secret: process.env.BETTER_AUTH_SECRET!,
});
```

**Step 3:** Create auth setup

```ts
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";
import { testAuth } from "@/packages/auth/src/test";

setup("authenticate", async ({ page }) => {
	const ctx = await testAuth.$context;
	const testUtils = ctx.test;

	// Create test user
	const user = testUtils.createUser({
		email: "e2e@test.com",
		password: "password123",
		name: "E2E Test User",
		emailVerified: true,
	});
	await testUtils.saveUser(user);

	// Inject cookies into browser
	const cookies = await testUtils.getCookies({
		userId: user.id,
		domain: "localhost",
	});
	await page.context().addCookies(cookies);

	// Save storage state for reuse
	await page.context().storageState({
		path: "playwright/.auth/user.json",
	});

	// Cleanup
	await testUtils.deleteUser(user.id);
});
```

**Step 4:** Write tests

```ts
// e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test("dashboard loads with user data", async ({ page }) => {
	await page.goto("/dashboard");
	await expect(page.getByText("E2E Test User")).toBeVisible();
});
```

### Option B: better-auth-playwright (Easiest)

```bash
pnpm add -D @better-auth-playwright
```

```ts
// e2e/fixtures.ts
import { createTestFixtures } from "better-auth-playwright";

export const test = createTestFixtures({
	secret: process.env.BETTER_AUTH_SECRET!,
});

export { expect } from "@playwright/test";
```

```ts
// e2e/dashboard.spec.ts
import { test, expect } from "../e2e/fixtures";

test("dashboard shows user", async ({ page, auth }) => {
	const user = await auth.createUser({
		email: "e2e@test.com",
		name: "Test User",
	});

	await page.goto("/dashboard");
	await expect(page.getByText(user.name!)).toBeVisible();
});
```

---

## 4. Project Structure

```
karir-fit/
├── e2e/                          # E2E tests
│   ├── auth.setup.ts              # Setup project
│   ├── fixtures.ts                # Custom fixtures
│   ├── dashboard.spec.ts          # Dashboard tests
│   ├── auth-flow.spec.ts          # Auth UI tests
│   └── .auth/                     # Auth state (gitignore)
│       └── user.json
├── playwright.config.ts           # Playwright config
├── packages/auth/src/
│   ├── index.ts                   # Production auth
│   └── test.ts                    # Test auth config
└── apps/web/
    └── src/app/
        └── [locale]/dashboard/     # Protected routes
```

---

## 5. Key Considerations

### OAuth Testing

Better Auth OAuth providers block automated testing (CAPTCHA, IP checks). Use:

- `testUtils().createOAuthUser()` for simulated OAuth
- Email/password for most tests
- `better-auth-playwright`'s `createOAuthUser()`

### Session Storage

- `storageState` does NOT save `sessionStorage`
- Check DevTools Application tab after login
- If needed, use `addInitScript` to restore

### Parallel Tests

For tests modifying server state:

- Use per-worker accounts
- Use `testInfo.parallelIndex` for unique identifiers

### Cookie Security

- Store auth files in `playwright/.auth/`
- Add to `.gitignore`
- Use `secure: false` for localhost testing

---

## 6. Implementation Checklist

- [ ] Install `@playwright/test`
- [ ] Install `chromium` with dependencies
- [ ] Create `playwright.config.ts`
- [ ] Create `packages/auth/src/test.ts` with testUtils
- [ ] Create `e2e/auth.setup.ts`
- [ ] Create `e2e/.auth/` directory
- [ ] Add to `.gitignore`
- [ ] Add test scripts to `package.json`
- [ ] Write first dashboard test
- [ ] Add to CI pipeline

---

## 7. Resources

- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
- [Better Auth Test Utils](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/test-utils.mdx)
- [better-auth-playwright](https://github.com/gaffer-sh/better-auth-playwright)
- [E2E Testing with Better Auth (Blog)](https://nelsonlai.dev/blog/e2e-testing-with-better-auth)
- [API vs UI Auth Comparison](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)
