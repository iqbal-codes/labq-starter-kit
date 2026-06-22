# Research: API vs UI Authentication in Playwright E2E Tests

## Summary

API-based authentication is the recommended default for Playwright E2E tests—it's approximately **50-100x faster** than UI-based login (50-100ms vs 2-5 seconds) and significantly more reliable because it eliminates flakiness from DOM interactions, page load variability, and UI changes. UI-based authentication should be reserved for dedicated auth flow tests that explicitly verify the login experience.

## Findings

1. **API authentication is dramatically faster** — A full UI login page load with all assets and rendering takes 2–5 seconds, while an API login call takes 50–100ms. At CI scale with hundreds of tests, this difference translates to hours of saved compute time. [Source](https://dev.to/dmitrymeaqa/why-your-playwright-tests-fail-in-ci-and-never-locally-3c68)

2. **UI login is the most common source of test flakiness** — Login flows involve multiple redirects, dynamic page loading, and waiting for DOM readiness. Any variability in network speed, CDN latency, or analytics script blocking causes timeouts. UI-based auth compounds these issues across large test suites. [Source](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)

3. **Recommended pattern: Authenticate once via API, reuse via storageState** — Playwright's setup project pattern authenticates once using the `request` fixture (API call), saves browser state (cookies + localStorage) to a JSON file, and reuses that state across all tests. This gives you the speed of API auth with the browser context of UI auth. [Source](https://playwright.dev/docs/auth)

4. **storageState pattern covers cookies, localStorage, and IndexedDB** — The standard `page.context().storageState({ path })` saves cookies and localStorage by default. Since Playwright 1.51, you can pass `indexedDB: true` to also capture IndexedDB-based authentication. Note that sessionStorage is never saved. [Source](https://playwright.dev/docs/auth)

5. **Use UI-based auth only in dedicated auth flow tests** — You should test the login UI explicitly in one or two dedicated tests, but feature tests should assume authentication works and use pre-authenticated state. This separation keeps auth tests focused and feature tests fast. [Source](https://dev.to/kate_astrid/how-we-halved-our-playwright-e2e-suite-mg6)

6. **UI authentication breaks in parallel CI environments** — When tests run in parallel, multiple workers sharing a single UI-based login session create race conditions: session conflicts, token expiration during long runs, and account lockouts. Per-worker API authentication with unique accounts solves this. [Source](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)

7. **UI login is fragile to frontend changes** — A "Cookie Consent" banner added to the login page, a reCAPTCHA gate, or a changed input selector breaks every test that calls `loginViaUI()`. API authentication is resilient to UI-only changes. [Source](https://medium.com/@slavik.pashanin/eliminating-authentication-overhead-in-playwright-automation-63b9dee61ddd)

8. **Hybrid approach is optimal for most tests** — The "hybrid test" pattern (setup via API, assertions via UI) is recommended as the default for 80% of end-to-end tests: API calls handle authentication and data setup, real browser handles user-facing interactions and assertions. [Source](https://stevekinney.com/courses/self-testing-ai-agents/api-and-ui-hybrid-tests)

## Sources

- **Kept**: [Authentication | Playwright](https://playwright.dev/docs/auth) — Official docs with definitive patterns for setup projects, storageState, and API authentication
- **Kept**: [Testing Authentication with Playwright: The Complete Guide](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide) — Comprehensive guide covering scaling issues, parallel execution, MFA, OAuth, and session management
- **Kept**: [Why Your Playwright Tests Fail in CI](https://dev.to/dmitrymeaqa/why-your-playwright-tests-fail-in-ci-and-never-locally-3c68) — Practical CI debugging with explicit API vs UI performance numbers (50ms vs 5s)
- **Dropped**: [How We Made Our E2E Tests 12x Faster](https://dev.to/alexneamtu/how-we-made-our-e2e-tests-12x-faster-51pm) — Valuable case study but redundant with other sources on the speed gains
- **Dropped**: [API vs UI Testing: Efficient Hybrid Approach](https://devot.team/blog/api-vs-ui-testing) — More conceptual than practical; covered better by other sources

## Gaps

- **Edge cases for complex auth systems**: OAuth PKCE flows, magic link email interception, and SSO/SAML testing require additional infrastructure (mock OAuth servers, test IdPs like Keycloak) and weren't fully compared for reliability in this research
- **Performance benchmarks specific to authentication**: While speed differences are well-documented qualitatively, specific benchmark data (e.g., exact time savings across different suite sizes) varies across sources

## Recommendation

**Default to API-based authentication** using Playwright's `request` fixture in a setup project. Use `storageState` to persist the authenticated session across all tests. Reserve UI-based login for dedicated auth flow tests that explicitly verify the login page behavior.

```typescript
// auth.setup.ts
test("authenticate", async ({ request }) => {
	await request.post("/api/login", {
		data: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD },
	});
	await request.storageState({ path: "playwright/.auth/user.json" });
});
```

Then reference this state in your Playwright config:

```typescript
// playwright.config.ts
{
  name: 'chromium',
  use: { storageState: 'playwright/.auth/user.json' },
  dependencies: ['auth-setup']
}
```
