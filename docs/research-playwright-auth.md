# Research: Playwright E2E Testing Authentication Patterns (2024-2025)

## Summary

Playwright's authentication testing relies on `storageState` to cache cookies and localStorage after login, eliminating repeated authentication overhead. The recommended approach uses **setup projects** with project dependencies to run authentication once before all tests. For Next.js + cookie-based auth, the key is correctly handling session cookies and understanding when to use UI-based vs API-based authentication.

## Findings

### 1. Core storageState Pattern

Playwright's `storageState` serializes browser context state (cookies, localStorage, IndexedDB) to a JSON file that subsequent tests can load to start already authenticated.

```typescript
// auth.setup.ts
import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
	await page.goto("/login");
	await page.fill('[name="email"]', "test@example.com");
	await page.fill('[name="password"]', "password");
	await page.click('[type="submit"]');
	await page.waitForURL("/dashboard");
	await page.context().storageState({ path: "playwright/.auth/user.json" });
});
```

`storageState` captures cookies and localStorage by default. **Note:** It does not capture sessionStorage. [Playwright Docs](https://playwright.dev/docs/auth)

### 2. Setup Project Dependencies (Recommended Approach)

Project dependencies are preferred over `globalSetup` because they support fixtures, trace recording, and appear in HTML reports.

```typescript
// playwright.config.ts
export default defineConfig({
	projects: [
		{ name: "setup", testMatch: /.*\.setup\.ts/ },
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
			dependencies: ["setup"],
		},
	],
});
```

Project dependencies offer: full trace support, fixture support, better HTML reporting, and automatic config option application. [Playwright Docs](https://playwright.dev/docs/test-global-setup-teardown)

### 3. Per-Worker Authentication for Parallel Tests

For tests that modify server-side state, one account per parallel worker prevents conflicts:

```typescript
// playwright/fixtures.ts
export const test = baseTest.extend<{}, { workerStorageState: string }>({
	storageState: ({ workerStorageState }, use) => use(workerStorageState),
	workerStorageState: [
		async ({ browser }, use) => {
			const id = test.info().parallelIndex;
			const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

			// Create unique account per worker using acquireAccount(id)
			const page = await browser.newPage({ storageState: undefined });
			await authenticateUser(page, id);
			await page.context().storageState({ path: fileName });
			await page.close();
			await use(fileName);
		},
		{ scope: "worker" },
	],
});
```

[Playwright Docs](https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker)

### 4. Next.js + NextAuth Cookie-Based Auth

For Next.js apps using NextAuth, authentication involves setting a `next-auth.session-token` cookie. Direct cookie injection can bypass UI login:

```typescript
// Direct cookie approach
const context = await browser.newContext();
await context.addCookies([
	{
		name: "next-auth.session-token",
		value: sessionToken,
		domain: "localhost",
		path: "/",
		httpOnly: true,
		sameSite: "Lax",
		secure: process.env.NODE_ENV === "production",
	},
]);
```

Alternative: Create session directly in database via Prisma:

```typescript
// Database-level auth setup
const sessionToken = await encode({
  token: { userId: testUser.id, email: user.email },
  secret: process.env.NEXTAUTH_SECRET,
});

await prisma.session.upsert({
  where: { sessionToken },
  update: { ... },
  create: { sessionToken, userId: testUser.id, expires: futureDate },
});
```

[EddieHub HealthCheck](https://dev.to/amandamartindev/authenticated-tests-with-playwright-prisma-postgres-and-nextauth-12pc)

### 5. Multiple Authenticated Roles

Tests requiring different user roles can use separate storage state files:

```typescript
// playwright.config.ts
projects: [
	{ name: "setup", testMatch: /.*\.setup\.ts/ },
	{ name: "admin", use: { storageState: "playwright/.auth/admin.json" }, dependencies: ["setup"] },
	{ name: "user", use: { storageState: "playwright/.auth/user.json" }, dependencies: ["setup"] },
];
```

Or per-test using `test.use()`:

```typescript
test.use({ storageState: 'playwright/.auth/admin.json' });
test('admin only feature', async ({ page }) => { ... });
```

[Playwright Docs](https://playwright.dev/docs/auth#multiple-signed-in-roles)

### 6. API-Based Authentication (Faster Alternative)

For setup speed, authenticate via API instead of UI:

```typescript
setup("authenticate via API", async ({ request }) => {
	await request.post("/api/auth/login", {
		data: { email: "test@example.com", password: "password" },
	});
	await request.storageState({ path: "playwright/.auth/user.json" });
});
```

[Currents.dev](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)

### 7. Session Storage Gotcha

`storageState` does **not** save sessionStorage. If your app stores tokens there, tests will silently fail. Check the Application tab in DevTools after login to verify where tokens are stored. Workaround:

```typescript
// Capture session storage
const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));

// Restore in new context
await context.addInitScript((storage) => {
	for (const [key, value] of Object.entries(storage)) window.sessionStorage.setItem(key, value);
}, sessionStorage);
```

[Currents.dev](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)

### 8. Cookie Security Best Practices

- Store auth files in `playwright/.auth/` and add to `.gitignore`
- Use `project.outputDir` for auto-cleanup between runs
- Rotate credentials regularly
- Audit CI artifacts for leaked cookies
- Use `secure: true` cookies in production, `secure: false` for localhost testing

## Sources

- **Kept:** [Playwright Authentication Docs](https://playwright.dev/docs/auth) — Primary source, covers all official patterns
- **Kept:** [Playwright Global Setup & Teardown](https://playwright.dev/docs/test-global-setup-teardown) — Project dependencies vs globalSetup comparison
- **Kept:** [Currents.dev Complete Guide](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide) — Advanced patterns, MFA, OAuth, CI/CD integration, security considerations
- **Kept:** [Test Double Next.js Auth Guide](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js) — Practical Next.js examples, helper functions, smoke tests
- **Kept:** [EddieHub NextAuth/Prisma Setup](https://dev.to/amandamartindev/authenticated-tests-with-playwright-prisma-postgres-and-nextauth-12pc) — Database-level auth for NextAuth

## Gaps

- **Next.js App Router specifics:** Some discussions mention issues with Next.js App Router and `cookies()` in setup, but docs are fragmented
- **SSR considerations:** How `storageState` interacts with server components in Next.js needs more research
- **Real-world large-scale patterns:** Few documented examples of 500+ test suites with auth

## Suggested Next Steps

1. Implement basic `storageState` pattern with setup project
2. Test cookie injection vs UI login for NextAuth
3. Evaluate whether per-worker auth is needed based on test isolation requirements
4. Consider API-based auth for speed if available endpoint exists
