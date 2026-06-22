# Research: SaaS Starter Kits & Modern Stack in 2026

## Summary

The 2026 SaaS consensus stack has converged on **Next.js 16 + React 19 + TypeScript + PostgreSQL (via Supabase or Neon) + Tailwind CSS 4 + Shadcn UI + Turborepo**, deployed on Vercel. The best starter kits (MakerKit, Supastarter, ixartz/SaaS-Boilerplate, ShipFast, thefrontkit, BoxyHQ) all share this foundation and add pre-built authentication, Stripe billing, multi-tenancy, and RBAC. The ORM choice has split between **Drizzle** (preferred for edge/serverless, smaller bundle) and **Prisma** (preferred for larger teams, richer tooling). State management has converged on **TanStack Query for server state + Zustand for client state**. Testing defaults to **Playwright** for E2E with best practices around user-facing locators, fixtures, and CI sharding. CI/CD runs on **GitHub Actions** with Turborepo remote caching for 60-80% faster builds.

---

## Findings

### 1. Top SaaS Starter Kits in 2026

The starter kit market has matured significantly. The best options:

| Kit                            | Price         | Stack                                                    | Best For                                        |
| ------------------------------ | ------------- | -------------------------------------------------------- | ----------------------------------------------- |
| **MakerKit**                   | $299+         | Next.js, Supabase/Firebase, Drizzle/Prisma, Stripe/Polar | B2B SaaS with full multi-tenancy, auth, billing |
| **Supastarter**                | ~$300+        | Next.js, Supabase, Better Auth, Stripe                   | B2B SaaS, AI-optimized codebase, 1,369+ users   |
| **ixartz/SaaS-Boilerplate**    | Free (OSS)    | Next.js, Tailwind, Drizzle, Clerk, Stripe, 7K+ stars     | Free open-source with active maintenance        |
| **ShipFast**                   | $199+         | Next.js, Tailwind, MongoDB/Supabase                      | Solo makers shipping fast                       |
| **thefrontkit**                | $79+          | Next.js, React, Tailwind, TypeScript                     | WCAG AA accessible, token-driven design system  |
| **BoxyHQ**                     | Free + paid   | Next.js, Tailwind, Prisma, enterprise SSO                | Enterprise SSO (SAML) requirements              |
| **nextjs/saas-starter**        | Free (Vercel) | Next.js, Postgres, Stripe, shadcn/ui, 15.8K stars        | Official Vercel reference starter               |
| **T3 Stack** (`create-t3-app`) | Free          | Next.js, tRPC, Prisma/Drizzle, Tailwind, TypeScript      | Type-safe full-stack foundation                 |
| **SaaS Yacht Club**            | Free          | Next.js 15, React 19, Better Auth, Stripe, Neon          | Free production-ready with multi-tenant arch    |

[Source: thefrontkit.com — Best Next.js SaaS Starter Kits in 2026](https://thefrontkit.com/blogs/best-karir-fits-2026)
[Source: adminlte.io — 13 Best Next.js SaaS Templates & Boilerplates 2026](https://adminlte.io/blog/nextjs-saas-templates/)
[Source: GitHub — nextjs/saas-starter (15.8K stars)](https://github.com/nextjs/saas-starter)
[Source: GitHub — ixartz/SaaS-Boilerplate (7K+ stars)](https://github.com/ixartz/SaaS-Boilerplate)

### 2. The Ideal 2026 SaaS Stack (Layer by Layer)

Multiple independent sources converge on the same stack recommendation:

| Layer                | Consensus Pick                 | Strong Alternative          | Notes                                            |
| -------------------- | ------------------------------ | --------------------------- | ------------------------------------------------ |
| **Framework**        | Next.js 16 (App Router, RSC)   | SvelteKit                   | React ecosystem dominance, AI tooling strength   |
| **Language**         | TypeScript                     | TypeScript                  | Non-negotiable in 2026                           |
| **Database**         | PostgreSQL (Supabase or Neon)  | PlanetScale Postgres        | Supabase bundles auth + storage + realtime       |
| **ORM**              | Drizzle (edge/serverless)      | Prisma (serverless Node)    | Drizzle: smaller bundle, no engine spin-up       |
| **Auth**             | Better Auth or Supabase Auth   | Clerk (paid)                | Better Auth: open-source, full data ownership    |
| **Payments**         | Stripe (B2B) / Polar (solo)    | Paddle                      | Stripe for enterprise, Polar for MoR             |
| **Styling**          | Tailwind CSS 4                 | —                           | CSS-in-JS is dead for SaaS (RSC incompatible)    |
| **Components**       | Shadcn UI (Base UI + Tailwind) | Park UI                     | Copy-into-codebase, not an npm dependency        |
| **Monorepo**         | Turborepo + pnpm               | Nx                          | Turborepo: minimal config, great caching         |
| **Hosting**          | Vercel                         | Cloudflare Workers, Railway | Vercel for default, Cloudflare for cost-at-scale |
| **Email**            | Resend                         | Postmark                    | React Email integration                          |
| **Analytics**        | PostHog                        | Mixpanel                    | OSS, includes session replay + feature flags     |
| **Error Monitoring** | Sentry                         | BetterStack                 | Industry standard                                |
| **Background Jobs**  | Trigger.dev or Inngest         | QStash                      | Both excellent; Trigger.dev cleaner DX           |

[Source: makerkit.dev — The Best SaaS Stack in 2026](https://makerkit.dev/blog/saas/saas-stack-2026)
[Source: starterpick.com — The Ideal SaaS Tech Stack in 2026](https://starterpick.com/guides/ideal-tech-stack-saas-2026)
[Source: outplane.com — The Modern SaaS Tech Stack in 2026](https://outplane.com/blog/saas-tech-stack-2026)
[Source: theplanettools.ai — How to Build a SaaS in 2026](https://theplanettools.ai/guides/modern-saas-stack-2026)

### 3. Monorepo Tooling: Turborepo

**Turborepo + pnpm = the 2026 monorepo standard.** Key setup:

- **Scaffold**: `npx create-turbo@latest` in 30 seconds
- **Package manager**: pnpm with `pnpm-workspace.yaml`
- **Task pipeline**: `turbo.json` with `dependsOn: ["^build"]` for topological ordering
- **Remote caching**: Free via Vercel; 60-80% CI time reduction after first run
- **Structure**: `apps/` (deployable) + `packages/` (shared: ui, database, utils, config)

**Typical Turborepo monorepo structure:**

```
my-saas/
├── apps/
│   ├── web/           # Next.js frontend
│   └── api/           # API server (Hono/Express)
├── packages/
│   ├── ui/            # Shared React components (Shadcn UI based)
│   ├── database/      # Drizzle schema + client
│   ├── auth/          # Better Auth / Supabase Auth wrappers
│   ├── billing/       # Stripe/Polar integration
│   ├── utils/         # Shared TypeScript utilities
│   └── config/        # Shared tsconfig, Biome config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Why Turborepo over Nx**: Turborepo is minimal config, Vercel-native, and right-sized for SaaS teams of 1-10 people. Nx brings heavier ceremony from the Angular ecosystem — over-engineered for most SaaS teams.

[Source: pkgpulse.com — How to Set Up a Monorepo with Turborepo in 2026](https://www.pkgpulse.com/guides/how-to-set-up-monorepo-turborepo-2026)
[Source: turbo.build — Official Turborepo docs](https://turbo.build/repo/docs)
[Source: makerkit.dev — Turborepo recommendation](https://makerkit.dev/blog/saas/saas-stack-2026)

### 4. State Management in 2026

The React state management "Redux or nothing" era is over. The 2026 consensus:

- **TanStack Query** — for **server state** (API data, caching, synchronization). Ranked #1 in State of React 2025. Handles fetching, caching, background refetching, optimistic updates.
- **Zustand** — for **client/UI state** (modals, sidebar, theme, form wizard state). 27.9M weekly npm downloads. Store-first, minimal boilerplate, no providers needed.
- **Jotai** — atom-level fine-grained re-render control (used alongside Zustand when needed).

**The 4-quadrant model**: Don't ask "Zustand or Redux?" — ask "is this state I own, or state the server owns?" Server state → TanStack Query. Client state → Zustand.

**Why Redux is no longer recommended**: Zustand has ~1/10th the bundle size, zero boilerplate (no actions/reducers/slices), and works natively with React 19 concurrent features. Redux Toolkit improved DX but the paradigm is heavier than needed for most SaaS apps.

[Source: nextfuture.io.vn — Server State vs Client State in React 2026](https://nextfuture.io.vn/blog/react-server-state-vs-client-state-guide)
[Source: nextfuture.io.vn — React State Management 2026: 7 Libraries Ranked](https://nextfuture.io.vn/blog/ultimate-guide-react-state-management-2026)
[Source: tanstack.com — TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state)

### 5. Testing: Playwright Best Practices in 2026

**Playwright is the leading E2E testing framework in 2026.** Key best practices:

1. **Use user-facing locators first**: `getByRole` → `getByLabel` → `getByText` → `getByTestId` → CSS/XPath (last resort). `getByRole` doubles as an accessibility check.
2. **Page Object Model (POM)**: Build fixtures around business actions, not raw Playwright APIs.
3. **Test isolation**: Each test should be independent. Use `test.describe` with proper setup/teardown.
4. **CI sharding**: Use `--shard=1/4` to parallelize across CI runners. Combined with Turborepo caching, this dramatically cuts feedback time.
5. **Trace Viewer**: Use before debugging flaky tests. Records full execution trace including screenshots, network, and console.
6. **Web-first assertions**: Use `expect(locator).toBeVisible()` instead of `waitForTimeout`. Playwright auto-waits for elements.
7. **Network mocking**: Mock external APIs for reliable tests. Use `page.route()` for API stubs.
8. **Fixtures over global setup**: Create custom fixtures for auth state, database seeding, and common page objects.

**Playwright in 2026 ships with AI agents, MCP servers, and a CLI that can write tests autonomously**, but the fundamentals (good locators, isolation, CI sharding) still matter most.

[Source: playwright.dev — Best Practices](https://playwright.dev/docs/best-practices)
[Source: browserstack.com — 15 Best Practices for Playwright testing in 2026](https://www.browserstack.com/guide/playwright-best-practices)
[Source: qaskills.sh — Playwright Best Practices: 25 Rules for 2026](https://qaskills.sh/blog/playwright-best-practices-2026)
[Source: getautonoma.com — Playwright Best Practices: 8 Patterns for 2026](https://getautonoma.com/blog/playwright-best-practices-2026)

### 6. CI/CD: GitHub Actions

**GitHub Actions is the default CI/CD for SaaS in 2026.** Key developments:

- **3 billion CI minutes/month** (up 64% YoY)
- **Custom runner autoscaling** (public preview): Standalone Go-based module, no Kubernetes required
- **SLSA L3 supply chain security**: Addressing tj-actions attack fallout
- **Artifact v4**: Faster upload/download for build artifacts
- **macOS-15 runners**: Available for testing iOS/macOS apps

**Typical SaaS CI/CD pipeline:**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-and-type:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: turbo lint type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: turbo test

  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: npx playwright test --shard=${{ matrix.shard }}/4

  deploy:
    needs: [lint-and-type, test, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npx vercel --prod
```

**Turborepo + GitHub Actions integration**: Set `TURBO_TOKEN` and `TURBO_TEAM` env vars for remote caching. After first run, unchanged packages serve from cache (60-80% time savings).

**2026 security focus**: Pin action versions, use `CODEOWNERS` for workflow files, audit third-party actions, enable SLSA provenance.

[Source: github.blog — GitHub Actions 2026 Security Roadmap](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/)
[Source: github.blog — GitHub Actions February 2026 Updates](https://github.blog/changelog/2026-02-05-github-actions-early-february-2026-updates/)
[Source: birjob.com — GitHub Actions in 2026](https://www.birjob.com/blog/github-actions-2026-updates)

### 7. Developer Experience (DX) Tools in 2026

The DX toolchain has shifted from ESLint + Prettier to faster, unified alternatives:

| Tool                     | Replaces                    | Why                                                                       |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| **Biome**                | ESLint + Prettier           | Rust-powered, 35x faster than Prettier, single config, lints + formats    |
| **Husky**                | Manual git hooks            | Pre-commit lint/format enforcement                                        |
| **lint-staged**          | Running linter on all files | Only lints changed files (pairs with Husky)                               |
| **TypeScript 5.x**       | —                           | Strict mode, `noUncheckedIndexedAccess`                                   |
| **Zod**                  | Manual validation           | Runtime + compile-time validation for Server Actions, API routes          |
| **Vercel AI SDK**        | —                           | Standard LLM integration layer; add from day one even without AI features |
| **Cursor / Claude Code** | —                           | AI coding tools; stack choice affects AI suggestion quality               |
| **AGENTS.md**            | —                           | AI-readable repo documentation (emerging convention)                      |

**Biome in 2026**: Replaces both ESLint and Prettier with a single Rust-powered tool. 24K+ GitHub stars, 97% Prettier compatibility, lints JS/TS/JSX/TSX/JSON/HTML/CSS/GraphQL. Migration from ESLint + Prettier is straightforward via `biome migrate eslint --write`.

**AI-codeability is now a stack selection criterion**: Stacks with larger training corpora (Next.js, React, Supabase, Drizzle, Stripe) get better AI suggestions from Cursor and Claude Code. This is a concrete advantage.

[Source: biomejs.dev — Official Biome docs](https://biomejs.dev/)
[Source: dev.to — Husky + Biome in Next.js 2026 Guide](https://dev.to/imkarmakar/how-to-set-up-husky-biome-in-a-nextjs-project-2026-guide-9jh)
[Source: makerkit.dev — AI-codeable stack recommendation](https://makerkit.dev/blog/saas/saas-stack-2026)

### 8. What the Best Starter Kits Include

Based on analysis of the top kits, a production-ready SaaS starter kit in 2026 should include:

**Authentication & Authorization:**

- Login, signup, password reset, magic links, OAuth (Google, GitHub)
- Multi-factor authentication (TOTP, passkeys)
- Multi-tenant organizations with teams, roles, invitations, RBAC
- SSO/SAML for enterprise

**Billing & Payments:**

- Stripe integration (subscriptions, usage-based, invoicing)
- Customer portal, upgrade/downgrade flows
- Webhook handling with idempotency (critical pattern)
- Optional: Polar/Paddle for Merchant of Record

**Application Foundation:**

- App shell (sidebar, topbar, responsive layout)
- Dashboard with cards, charts, tables
- Settings pages (account, billing, team, notifications)
- Design token system for theming (light/dark mode)
- WCAG AA accessibility
- i18n/internationalization

**Infrastructure:**

- Database migrations (Drizzle Kit or Prisma Migrate)
- Row-Level Security (RLS) for multi-tenant data isolation
- Email templates (React Email + Resend)
- Background job processing
- Error monitoring (Sentry)
- Analytics (PostHog)

**Developer Experience:**

- TypeScript strict mode
- Biome or ESLint + Prettier
- Husky + lint-staged for pre-commit hooks
- Turborepo monorepo with shared packages
- Playwright E2E tests
- GitHub Actions CI/CD
- Vercel deployment
- `.env.example` with all required variables documented

[Source: supastarter.dev](https://supastarter.dev/)
[Source: makerkit.dev](https://makerkit.dev/nextjs-karir-fit)
[Source: nextjs-boilerplate.com](https://nextjs-boilerplate.com/nextjs-multi-tenant-saas-boilerplate)
[Source: saasyachtclub/saas-boiler](https://github.com/saasyachtclub/saas-boiler)

### 9. Cost at Each Stage

| Service                  | $0 MRR (pre-launch) | $1K MRR         | $10K MRR         |
| ------------------------ | ------------------- | --------------- | ---------------- |
| Vercel                   | $0 (Hobby)          | $20 (Pro)       | $80-150          |
| Supabase                 | $0 (Free)           | $25 (Pro)       | $25-100          |
| Domain                   | ~$1/mo              | $1              | $1               |
| Stripe                   | 0 (fees only)       | ~$32            | ~$320            |
| Resend                   | $0 (3K/mo free)     | $20             | $20-90           |
| PostHog                  | $0 (Free)           | $0-50           | $50-200          |
| Sentry                   | $0 (Developer)      | $26             | $80-200          |
| Trigger.dev              | $0 (Free)           | $0-20           | $50-200          |
| **Total (excl. Stripe)** | **~$1/mo**          | **~$92-115/mo** | **~$306-960/mo** |

[Source: makerkit.dev — Cost breakdown](https://makerkit.dev/blog/saas/saas-stack-2026)

---

## Sources

### Kept (Primary/Authoritative)

- **MakerKit — The Best SaaS Stack in 2026** (https://makerkit.dev/blog/saas/saas-stack-2026) — Most comprehensive layer-by-layer guide; backed by hundreds of customer deployments; opinionated but well-defended
- **StarterPick — The Ideal SaaS Tech Stack in 2026** (https://starterpick.com/guides/ideal-tech-stack-saas-2026) — "Consensus stack" framing; covers anti-patterns and when to deviate
- **thefrontkit — Best Next.js SaaS Starter Kits in 2026** (https://thefrontkit.com/blogs/best-karir-fits-2026) — Updated May 2026; compares all major kits
- **PkgPulse — Turborepo Monorepo Setup 2026** (https://www.pkgpulse.com/guides/how-to-set-up-monorepo-turborepo-2026) — Practical walkthrough with real code
- **Playwright Official Best Practices** (https://playwright.dev/docs/best-practices) — Primary source for testing patterns
- **BrowserStack — Playwright Best Practices 2026** (https://www.browserstack.com/guide/playwright-best-practices) — Production-focused E2E testing patterns
- **Biome Official Docs** (https://biomejs.dev/) — Primary source for the ESLint+Prettier replacement
- **GitHub Blog — Actions 2026 Security Roadmap** (https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/) — Official CI/CD security updates
- **TanStack Query Docs** (https://tanstack.com/query/latest/docs) — Primary source for server state management
- **GitHub — nextjs/saas-starter** (https://github.com/nextjs/saas-starter) — Official Vercel reference starter (15.8K stars)
- **GitHub — t3-oss/create-t3-app** (https://github.com/t3-oss/create-t3-app) — T3 Stack CLI (26K+ stars)

### Dropped

- Various SEO-heavy comparison sites with overlapping content
- Stale sources from 2024-2025 without 2026 updates
- Paid promotional content disguised as guides

---

## Gaps

1. **Turborepo vs Nx head-to-head benchmarks**: No rigorous 2026 benchmark comparing CI times between Turborepo and Nx on equivalent monorepos. The recommendation is based on community consensus and DX rather than measured performance data.

2. **Playwright CI cost analysis**: No source quantified the cost of running Playwright tests on GitHub Actions (runner minutes) at scale. The sharding + Turborepo caching combination is recommended but cost-effectiveness varies.

3. **Better Auth maturity data**: Better Auth is heavily recommended by MakerKit but lacks independent adoption metrics (download counts, production deployment numbers) compared to Clerk or NextAuth.

4. **Edge deployment trade-offs**: The Drizzle vs Prisma split for edge vs serverless Node is well-documented, but real-world benchmarks comparing cold-start times on Vercel Edge Functions are scarce.

5. **Biome coverage gaps**: While Biome replaces ESLint for linting and Prettier for formatting, some ESLint plugins (custom rules, framework-specific rules) don't have Biome equivalents yet. Teams with heavy custom ESLint configs may need to keep ESLint for specific rules.

6. **State management in RSC world**: The interaction between Zustand/TanStack Query and React Server Components is still evolving. Server Components reduce client-side state needs, but the exact patterns for when to reach for Zustand vs keeping state server-side are not fully standardized.

---

## Supervisor Coordination

No coordination needed. Research completed successfully with comprehensive coverage across all requested topics.
