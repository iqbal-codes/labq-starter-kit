# Research: Playwright + Better Auth (auth.js) E2E Testing

## Summary

Better Auth provides a dedicated `testUtils()` plugin for E2E testing that bypasses the login flow by directly creating users and sessions in the database, then injecting cookies into Playwright's browser context. This is the recommended approach since OAuth providers block automated testing and manual login in CI is unreliable.

## Findings

### 1. Better Auth Test Utils Plugin

Better Auth ships a first-party `testUtils()` plugin designed specifically for integration and E2E testing. It provides helpers to create users, sessions, and cookies without going through the authentication flow.

**Setup:**

```ts
// auth.test.ts (separate from production config)
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

export const auth = betterAuth({
	plugins: [testUtils()],
});
```

**Key helpers available via `ctx.test`:**

- `createUser()` — creates a user object (not persisted)
- `saveUser(user)` — persists user to database
- `deleteUser(userId)` — removes user from database
- `login({ userId })` — creates a session and returns session details, cookies, headers
- `getCookies({ userId, domain })` — returns Playwright-compatible cookie array
- `getAuthHeaders({ userId })` — returns Headers object for API testing
- `createOrganization()` — for organization plugin tests

The plugin does NOT register public HTTP routes—it only exposes server-side helpers on `ctx.test`. Keep it in a separate test-only auth instance to avoid shipping privileged helpers to production. [Better Auth Test Utils Documentation](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/test-utils.mdx)

### 2. Cookie-Based Session Injection Pattern

Better Auth sessions are stored as signed cookies (`better-auth.session_token`). The `testUtils().getCookies()` method returns properly formatted cookie objects that can be injected directly into Playwright's browser context.

**Playwright Integration Pattern:**

```ts
import { test, expect } from "@playwright/test";
import { auth } from "./auth";

test("dashboard shows user name", async ({ context, page }) => {
	const ctx = await auth.$context;
	const testUtils = ctx.test;

	// Create and persist user
	const user = testUtils.createUser({ email: "e2e@example.com", name: "E2E User" });
	await testUtils.saveUser(user);

	// Inject session cookies into browser context
	const cookies = await testUtils.getCookies({ userId: user.id, domain: "localhost" });
	await context.addCookies(cookies);

	// Navigate to protected page
	await page.goto("/dashboard");

	// Assertions...
	await expect(page.getByText("E2E User")).toBeVisible();

	// Cleanup
	await testUtils.deleteUser(user.id);
});
```

[Better Auth Test Utils Documentation](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/test-utils.mdx)

### 3. Global Setup with Storage State (Recommended)

For projects with many tests, use Playwright's storage state mechanism to authenticate once in a setup project and reuse the state across all tests. This is more efficient than creating users per test.

**`playwright.config.ts`:**

```ts
export default defineConfig({
	testDir: "./tests",
	projects: [
		{ name: "setup", testMatch: /global\.setup\.ts/ },
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
			dependencies: ["setup"],
		},
	],
});
```

**`tests/global.setup.ts`:**

```ts
import { test as setup } from "@playwright/test"
import crypto from "crypto"
import fs from "fs/promises"

const TEST_USER = { id: "0", email: "test@example.com", token: "..." }

setup("setup auth", async () => {
  // Insert test user and session into database directly
  await db.prepare("INSERT INTO user (...) VALUES (?)").run(...)

  // Generate signed session token
  const signature = crypto.createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(TEST_USER.token).digest("base64")
  const signedValue = `${TEST_USER.token}.${signature}`

  // Save storage state for reuse in all tests
  await fs.writeFile(".auth/user.json", JSON.stringify({
    cookies: [{
      name: "better-auth.session_token",
      value: encodeURIComponent(signedValue),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.round(Date.now() / 1000 + 7 * 24 * 60 * 60)
    }],
    origins: []
  }, null, 2))
})
```

This pattern was demonstrated in the [Nelson Lai E2E testing example](https://github.com/nelsonlaidev/e2e-testing-with-better-auth), which uses a static test user with a pre-seeded database. [E2E Testing with Better Auth | Nelson Lai](https://nelsonlai.dev/blog/e2e-testing-with-better-auth)

### 4. better-auth-playwright Library

The `better-auth-playwright` library provides a higher-level abstraction built on top of the testUtils plugin, offering automatic cookie injection, user cleanup, and plugin support.

**Features:**

- `auth.createUser()` — creates user and sets session cookies automatically
- `auth.createOAuthUser()` — simulates OAuth flows without real provider
- Auto-cleanup of test users after each test
- Plugin system for extending user creation (organizations, API keys)
- Works with Nuxt, Next.js, and other frameworks

**Setup requires two parts:**

**1. Server plugin:**

```ts
// auth.ts
import { testPlugin } from "better-auth-playwright/server";

export const auth = betterAuth({
	plugins: [testPlugin({ secret: process.env.TEST_DATA_SECRET })],
});
```

**2. Playwright fixtures:**

```ts
// e2e/fixtures.ts
import { createTestFixtures } from "better-auth-playwright";

export const test = createTestFixtures({
	secret: process.env.TEST_DATA_SECRET!,
});

export { expect } from "better-auth-playwright";
```

**Usage in tests:**

```ts
test("user can see dashboard", async ({ page, auth }) => {
	const user = await auth.createUser({ email: "test@example.com" });
	// Cookies are automatically set on the browser context

	await page.goto("/dashboard");
	await expect(page.getByText(user.email)).toBeVisible();
});
```

[gaffer-sh/better-auth-playwright](https://github.com/gaffer-sh/better-auth-playwright)

### 5. Multiple Authenticated Roles

For testing scenarios requiring different user roles (admin vs. regular user), Playwright supports managing multiple storage states and browser contexts.

**Multiple roles in same test:**

```ts
test("admin and user interaction", async ({ browser }) => {
	const adminContext = await browser.newContext({
		storageState: ".auth/admin.json",
	});
	const adminPage = await adminContext.newPage();

	const userContext = await browser.newContext({
		storageState: ".auth/user.json",
	});
	const userPage = await userContext.newPage();

	// Interact with both roles...

	await adminContext.close();
	await userContext.close();
});
```

Or use fixtures for cleaner test structure:

```ts
// playwright/fixtures.ts
export const test = baseTest.extend({
	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext({ storageState: ".auth/admin.json" });
		const adminPage = new AdminPage(await context.newPage());
		await use(adminPage);
		await context.close();
	},
	userPage: async ({ browser }, use) => {
		// ...similar
	},
});
```

[Playwright Authentication Guide](https://playwright.dev/docs/next/auth)

### 6. Worker-Scoped Authentication for Parallel Tests

When tests modify server-side state, each parallel worker needs its own account to prevent interference.

**`playwright/fixtures.ts`:**

```ts
export const test = baseTest.extend<{}, { workerStorageState: string }>({
	storageState: ({ workerStorageState }, use) => use(workerStorageState),
	workerStorageState: [
		async ({ browser }, use) => {
			const id = test.info().parallelIndex;
			const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

			if (fs.existsSync(fileName)) {
				await use(fileName);
				return;
			}

			const page = await browser.newPage({ storageState: undefined });
			// Acquire unique account for this worker
			await page.goto("/login");
			await page.fill('[name="email"]', `user-${id}@test.local`);
			// ... perform login
			await page.context().storageState({ path: fileName });
			await page.close();
			await use(fileName);
		},
		{ scope: "worker" },
	],
});
```

[Playwright Authentication Guide](https://playwright.dev/docs/next/auth)

### 7. OAuth Testing Challenges

OAuth providers (GitHub, Google, etc.) introduce verification steps that block automated testing:

- Geographic location checks
- Datacenter IP detection
- New device/user-agent verification

**Recommended strategies:**

1. **Use credentials provider in development mode** — add a credentials provider that accepts a test password only in development/test environments
2. **Run a local OAuth provider** like Keycloak for testing OAuth flows
3. **Bypass OAuth entirely** using Better Auth's `testUtils().createOAuthUser()` or `better-auth-playwright`'s `auth.createOAuthUser()` which simulates OAuth without the real provider

[Auth.js Testing Guide](https://authjs.dev/guides/testing)

## Sources

- **Kept:** [Better Auth Test Utils Documentation](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/test-utils.mdx) — Official first-party testing plugin with complete API reference
- **Kept:** [Playwright Authentication Guide](https://playwright.dev/docs/next/auth) — Official Playwright docs on storage state, fixtures, and multi-role testing
- **Kept:** [E2E Testing with Better Auth | Nelson Lai](https://nelsonlai.dev/blog/e2e-testing-with-better-auth) — Practical example with global setup and signed token generation
- **Kept:** [gaffer-sh/better-auth-playwright](https://github.com/gaffer-sh/better-auth-playwright) — Third-party library with auto-cleanup and plugin support
- **Kept:** [Auth.js Testing Guide](https://authjs.dev/guides/testing) — Official testing strategies including OAuth handling

- **Dropped:** Generic "Better Auth setup" tutorials — these cover initial setup, not testing
- **Dropped:** Stack Overflow discussions about Next.js cookie conflicts — specific edge cases not relevant to current Better Auth patterns

## Gaps

- **OTP testing** — While `testUtils()` supports OTP capture, comprehensive guidance on testing 2FA flows is sparse
- **Stateless/JWE sessions** — The testUtils plugin may have compatibility issues with fully stateless setups using `session.cookieCache.enabled: true` or JWE strategy
- **Next.js App Router specific patterns** — Most guidance is framework-agnostic; App Router cookie handling in tests not deeply explored

## Next Steps

1. Implement `testUtils()` plugin in a test-only auth configuration
2. Choose between raw `testUtils().getCookies()` approach or `better-auth-playwright` library based on project complexity
3. Set up global setup for storage state management if tests require many authenticated scenarios
4. Consider `better-auth-playwright` if organization/plugin testing is needed

---

_Research completed: 2026-05-28_
