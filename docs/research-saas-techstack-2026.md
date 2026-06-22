# Research: SaaS Tech Stack in 2026

## Summary

The consensus 2026 SaaS stack is **Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Drizzle or Prisma + PostgreSQL (Neon/Supabase) + Better Auth + Stripe + Vercel**, with **Vercel AI SDK** as the standard AI integration layer. This combination offers the best balance of developer experience, ecosystem support, scalability, and cost. The landscape has matured significantly—key shifts include Prisma dropping its Rust engine (v7), Tailwind v4 shipping a Rust-based Oxide engine, Cloudflare acquiring Astro, and Better Auth emerging as the dominant self-hosted auth solution.

---

## Findings

### 1. Frontend Frameworks: Next.js Dominates, But the Gap Is Closing

**Next.js (v15/v16)** remains the undisputed default for SaaS applications with ~67% market share among meta-frameworks. App Router with React Server Components (RSC) gives fine-grained server/client rendering control. Partial Prerendering (PPR) is approaching GA. Turbopack is now stable for production builds. **However**, developer satisfaction dropped from 68% to 55% per State of JS 2025, mainly due to complexity and Vercel coupling concerns. [Pockit](https://pockit.tools/blog/nextjs-vs-remix-vs-astro-vs-sveltekit-2026-comparison/) | [BirJob](https://www.birjob.com/blog/nextjs-vs-remix-vs-astro-2026-framework-war)

**Remix → React Router v7**: The framework merged into React Router v7, with Remix 3 being reimagined as a "batteries-included, bundler-free" framework. Excels at data-heavy apps with complex forms/mutations. Delivers ~30% faster TTFB on Cloudflare/Deno vs Next.js. Best for edge-first architectures. [AgileSoftLabs](https://www.agilesoftlabs.com/blog/2026/03/nextjs-vs-remix-vs-astro-best)

**Astro 5+**: Performance champion for content sites—LCP metrics 40–70% better than Next.js out-of-box with zero-JS default. Cloudflare acquired Astro in January 2026, fundamentally changing its trajectory. Best for content-driven sites, marketing pages, blogs. [Pockit](https://pockit.tools/blog/nextjs-vs-remix-vs-astro-vs-sveltekit-2026-comparison/)

**Recommendation**: Next.js for most SaaS apps (largest ecosystem, most hiring options). Astro for the content/marketing layer. Remix for edge-first, data-heavy apps.

---

### 2. UI Libraries: shadcn/ui Is the Default

**shadcn/ui** has become the default for new React projects with 114,500+ GitHub stars (as of May 2026). It's a copy-paste component collection built on **Radix UI primitives** and styled with **Tailwind**. You own the source code—no npm dependency, full customization. [toolchew](https://toolchew.com/en/shadcn-vs-radix/) | [StarterPick](https://starterpick.com/guides/shadcn-vs-radix-vs-headless-ui-2026)

**Radix UI**: The headless primitive layer that shadcn/ui is built on. Updates have slowed since the WorkOS acquisition. Stable but unlikely to get major new features. Use directly if building a custom design system from scratch. [DEV Community](https://dev.to/edriso/shadcn-vs-radix-vs-base-ui-which-one-should-a-junior-pick-in-2026-1jml)

**Base UI** (from MUI team): Emerging contender addressing Radix's architectural shortcomings with production backing. Worth watching. [PkgPulse](https://www.pkgpulse.com/guides/shadcn-ui-vs-base-ui-vs-radix-components-2026)

**Recommendation**: shadcn/ui for 90% of SaaS projects. It's not either/or with Radix—shadcn IS Radix + Tailwind styling.

---

### 3. Styling: Tailwind CSS v4 Is a Leap Forward

**Tailwind CSS v4** (released early 2025, now at v4.3 as of May 2026) is the biggest update in the framework's history:

- **Rust-based Oxide engine**: Full builds up to 5x faster, incremental builds 100x+ faster (microseconds).
- **CSS-first configuration**: Replaced `tailwind.config.js` with native CSS `@theme` directives.
- **Zero-config setup**: Automatic content detection, no `content` array needed.
- **Modern CSS**: Built on cascade layers, `@property`, `color-mix()`, container queries.
- **v4.3** (May 2026): Added scrollbar utilities, new color palettes (mauve, olive, mist, taupe), first-class webpack plugin, logical property utilities. [Tailwind Blog](https://tailwindcss.com/blog/tailwindcss-v4-3) | [eastondev.com](https://eastondev.com/blog/en/posts/dev/20260325-tailwind-css-v4-features/)

**Recommendation**: Tailwind v4 is the only serious choice for utility-first CSS in SaaS. Migration from v3 is straightforward with their upgrade tool.

---

### 4. Backend / API Layer: Hono Rising, tRPC Established

**tRPC** pioneered end-to-end type safety for TypeScript monorepos. Deep React Query integration, huge ecosystem. Best for Next.js fullstack apps where frontend and backend share a TypeScript codebase. tRPC v11 is the current version. [supastarter](https://supastarter.dev/blog/hono-vs-trpc-vs-orpc-api-comparison)

**Hono** is the rising star: ultra-fast, lightweight HTTP framework using Web Standard APIs. Runs on Cloudflare Workers, Deno, Bun, and Node.js with the same code. **Hono RPC** adds type-safe client without code generation. Under 7KB. Best for: edge-first APIs, multi-runtime deployments, REST-compatible APIs. [FreeCodeCamp](https://www.freecodecamp.org/news/type-safety-without-code-generation-using-trpc-and-hono/) | [DEV Community](https://dev.to/raxxostudios/hono-the-tiny-framework-that-runs-my-entire-backend-i19)

**oRPC**: Modern challenger combining tRPC-like DX with built-in OpenAPI output and standard schema support (Zod, Valibot, ArkType). Worth evaluating for new projects. [PkgPulse](https://www.pkgpulse.com/guides/orpc-vs-trpc-vs-hono-rpc-type-safe-apis-2026)

| Feature         | Hono           | tRPC          | oRPC          |
| --------------- | -------------- | ------------- | ------------- |
| Type            | HTTP framework | RPC framework | RPC framework |
| OpenAPI         | Via middleware | Via plugin    | Built-in      |
| REST-compatible | Yes            | No            | Yes           |
| Edge-native     | Yes            | No            | Yes           |
| Bundle size     | ~7KB           | Larger        | Medium        |

**Recommendation**: Hono for new SaaS projects (especially edge/Cloudflare). tRPC for pure Next.js monorepos. Consider oRPC if you need OpenAPI compatibility.

---

### 5. Databases: PostgreSQL Is the Correct Default

**PostgreSQL** is the universal recommendation—95% of SaaS applications should use it. It offers relational integrity, JSONB flexibility, Row-Level Security (RLS) for multi-tenancy, and pgvector for AI embeddings—all in one engine. Postgres 17 is now LTS. [AgileSoftLabs](https://www.agilesoftlabs.com/blog/2026/03/best-saas-tech-stack-architecture-2026)

**Neon**: Serverless PostgreSQL with scale-to-zero, branching workflows (Copy-on-Write), and sub-second branch creation. Acquired by Databricks in May 2025 for ~$1B. Lower storage costs, open-source backing. Best for dev/preview environments and cost-conscious startups. [getautonoma](https://getautonoma.com/blog/neon-vs-planetscale) | [UpVerdict](https://upverdict.com/t/planetscale-vs-neon-which-serverless-database-wins-for-2026)

**PlanetScale**: Built on Vitess (MySQL sharding). Now also supports Postgres. Brought back free tier (Hobby, 1GB) in 2026. Best for horizontal sharding at massive scale. [ProPicked](https://propicked.com/blog/best-database-2026-postgres-mysql-planetscale-supabase-neon-turso)

**Supabase**: PostgreSQL + Auth + Realtime + Storage + Edge Functions in one platform. Postgres 17 support launched. Best for rapid prototyping and teams wanting a full BaaS. [HyperNest](https://hypernestlabs.com/insights/startup-tech-stack-guide-2026)

**Recommendation**: Postgres via **Neon** (serverless, branching, cost-effective) or **Supabase** (full BaaS with auth/RLS). PlanetScale only if you have MySQL legacy or extreme sharding needs.

---

### 6. ORMs: Drizzle vs Prisma — Both Are Production-Ready

**Prisma v7** (late 2025): The biggest change in Prisma's history—deleted the Rust query engine, now pure TypeScript. Cold starts dropped, edge deployments got simpler. One of the main criticisms ("Prisma is too heavy for Cloudflare Workers") just evaporated. Schema-first approach with `.prisma` DSL, generated client, and the deepest migration tooling. [Pockit](https://pockit.tools/blog/drizzle-orm-vs-prisma-2026-comparison/) | [Encore](https://encore.dev/articles/drizzle-vs-prisma)

**Drizzle v1.0**: SQL-first TypeScript library. ~7KB minified core. Schema defined in TypeScript files. New relational query builder and improved type-checking. Best for edge/serverless (tiny bundles). [Cadence](https://cadence.withremote.ai/blog/drizzle-vs-prisma) | [ECOSIRE](https://ecosire.com/blog/drizzle-orm-vs-prisma-2026-comparison)

| Dimension         | Drizzle                        | Prisma                                                    |
| ----------------- | ------------------------------ | --------------------------------------------------------- |
| Philosophy        | SQL-first, code-first          | Schema-first, managed                                     |
| Bundle size       | ~7KB                           | Larger (was Rust, now TS)                                 |
| Migration tooling | Good (Drizzle Kit)             | Excellent (mature ecosystem)                              |
| Edge performance  | Excellent                      | Good (improved in v7)                                     |
| Learning curve    | SQL knowledge needed           | More abstracted                                           |
| Multi-DB support  | Postgres, MySQL, SQLite, Turso | Postgres, MySQL, SQLite, MongoDB, SQL Server, CockroachDB |

**Recommendation**: **Drizzle** for new projects (especially edge/serverless, smaller teams, SQL-savvy devs). **Prisma** for larger teams wanting managed migrations and maximum abstraction. Both are excellent—this is a style preference, not a quality gap.

---

### 7. Authentication: Better Auth Is the New Default

**Better Auth** has emerged as the dominant self-hosted auth solution for TypeScript SaaS:

- TypeScript-first, framework-agnostic, plugin-driven architecture
- Built-in: email/password, OAuth, magic links, 2FA, passkeys, organizations
- Self-hosted (no vendor lock-in), MIT-licensed, free
- First-class multi-tenancy support
- Easiest setup of the three options [LogRocket](https://blog.logrocket.com/best-auth-library-nextjs-2026/) | [Makerkit](https://makerkit.dev/blog/tutorials/better-auth-vs-clerk)

**Clerk**: Fastest path to polished production auth with hosted UI components. Free tier updated to 50,000 monthly retained users. Gets expensive at scale. Best for teams that want zero auth infrastructure work. [supastarter](https://supastarter.dev/blog/better-auth-vs-nextauth-vs-clerk)

**Auth.js v5** (formerly NextAuth): Established, stable, provider-driven OAuth flows. Larger ecosystem. Less batteries-included than Better Auth. Safest conventional answer for Next.js OAuth-centric apps. [APIScout](https://apiscout.dev/guides/better-auth-vs-nextauth-vs-clerk-2026)

| Feature        | Better Auth         | Clerk            | Auth.js v5          |
| -------------- | ------------------- | ---------------- | ------------------- |
| Type           | Self-hosted library | Hosted service   | Self-hosted library |
| Open source    | Yes (MIT)           | No               | Yes                 |
| Pricing        | Free                | Free tier → paid | Free                |
| Organizations  | Built-in            | Built-in         | Manual              |
| Passkeys       | Built-in            | Built-in         | Manual              |
| Vendor lock-in | None                | High             | None                |

**Recommendation**: **Better Auth** for new SaaS projects (self-hosted, feature-complete, free, no lock-in). **Clerk** for rapid prototyping when budget allows. **Auth.js** if already integrated or OAuth-only needs.

---

### 8. Payments: Stripe vs Lemon Squeezy

**Stripe** owns the SaaS payments market. 2.9% + $0.30 per transaction. You are the merchant—you handle tax compliance (or use Stripe Tax 2.0, now in 60+ countries). Deepest API, best DX, most integrations. Best for US-heavy customer base, >$10k MRR, teams wanting full control. [StarterPick](https://starterpick.com/guides/stripe-vs-lemon-squeezy-saas-2026)

**Lemon Squeezy**: Merchant of Record model—handles all global VAT/GST/sales tax. 5% + $0.50 per transaction. **Stripe acquired Lemon Squeezy in July 2024**; it still operates as a separate product. Best for solo devs, global customers, zero tax compliance burden. [Cadence](https://cadence.withremote.ai/blog/stripe-vs-lemon-squeezy) | [APIScout](https://apiscout.dev/guides/lemon-squeezy-vs-stripe-api-2026)

**Polar.sh**: Open-source friendly, developer-focused. Mentioned as a viable alternative by some practitioners. [HouseofMVPs](https://houseofmvps.com/blog/mvp/startup-tech-stack-2026)

**Recommendation**: **Stripe** for most SaaS (better DX, lower fees, more control). **Lemon Squeezy** for indie/solo SaaS selling globally who want zero tax headaches. Start with Lemon Squeezy, migrate to Stripe past ~$10k MRR.

---

### 9. Deployment: Vercel for Next.js, Cloudflare for Everything Else

**Vercel**: Best-in-class Next.js integration (they build it). Git-to-deploy pipeline. Fluid Compute for 1.2-5x faster server rendering. Pricing gets expensive at scale ($20/user/month Pro). Standard functions run on AWS Lambda; Edge Runtime available. [Cadence](https://cadence.withremote.ai/blog/vercel-vs-cloudflare-pages)

**Cloudflare**: 330+ global PoPs. Workers run V8 isolates with sub-5ms cold starts and $0.30/M requests. At P99, Cloudflare is 3.3x faster than Vercel for edge functions. Dramatically cheaper at scale (marketing site: $5/mo vs $70/mo). Acquired Astro in January 2026. [SQLAgent](https://sqlagent.app/blog/cloudflare-vs-vercel) | [TechPlained](https://www.techplained.com/cloudflare-vs-vercel-vs-netlify)

| Dimension                  | Vercel                            | Cloudflare                |
| -------------------------- | --------------------------------- | ------------------------- |
| PoPs/regions               | 18 + Edge Middleware              | 330+ cities               |
| Cold start (p95)           | 0ms (Edge) / 247ms (Serverless)   | 0ms                       |
| Marketing site (2M visits) | ~$70/mo                           | ~$5/mo                    |
| SaaS (50K users)           | ~$226/mo                          | ~$47/mo                   |
| Next.js support            | Native (they build it)            | Improving (OpenNext)      |
| Lock-in risk               | Higher (Vercel-specific features) | Lower (Web Standard APIs) |

**Recommendation**: **Vercel** for Next.js SaaS apps where DX and Next.js features matter most. **Cloudflare** for cost-sensitive, high-traffic, or edge-first deployments. Many teams use both: Vercel for the app, Cloudflare for edge APIs.

---

### 10. AI Integration: Vercel AI SDK Is the Standard

**Vercel AI SDK** (v6, released Dec 2025) is the dominant TypeScript AI toolkit:

- Unified API for generating text, structured objects, tool calls, and streaming
- Multi-provider support (OpenAI, Anthropic, Google, etc.) — switch with one line
- **AI SDK Core**: Unified model interface
- **AI SDK UI**: Framework-specific hooks (React, Vue, Svelte)
- Agent support with ToolLoopAgent, tool execution approval, MCP protocol support
- 24,100+ GitHub stars [ai-sdk.dev](https://ai-sdk.dev/) | [Vercel KB](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)

**Vercel AI Gateway**: Model routing, fallbacks, and runtime feature flags for production AI apps. [Developers Digest](https://www.developersdigest.tech/blog/vercel-agentic-infrastructure-stack)

**Alternatives**: LangChain (heavier, more abstract), OpenAI SDK directly (single-provider), Inngest (for AI workflows/agents with durable execution).

**Recommendation**: **Vercel AI SDK** for most TypeScript SaaS AI integrations. Framework-agnostic despite the Vercel name. Use AI Gateway for multi-model production deployments.

---

## Recommended Stack Summary

| Layer               | Recommendation                | Runner-up                    |
| ------------------- | ----------------------------- | ---------------------------- |
| **Framework**       | Next.js 16 (App Router, RSC)  | SvelteKit                    |
| **Language**        | TypeScript                    | —                            |
| **UI Components**   | shadcn/ui (built on Radix)    | Base UI                      |
| **Styling**         | Tailwind CSS v4               | —                            |
| **API/Backend**     | Hono (RPC)                    | tRPC (Next.js monorepo)      |
| **Database**        | PostgreSQL (Neon or Supabase) | PlanetScale (MySQL/sharding) |
| **ORM**             | Drizzle                       | Prisma v7                    |
| **Auth**            | Better Auth                   | Clerk (managed)              |
| **Payments**        | Stripe                        | Lemon Squeezy (MoR)          |
| **Deployment**      | Vercel                        | Cloudflare Workers           |
| **AI**              | Vercel AI SDK v6              | LangChain                    |
| **Email**           | Resend                        | —                            |
| **Monorepo**        | Turborepo + pnpm workspaces   | —                            |
| **Background Jobs** | BullMQ / Inngest              | —                            |
| **Monitoring**      | Sentry + PostHog              | —                            |

---

## Sources

### Kept

- [The Best SaaS Stack in 2026 — Makerkit](https://makerkit.dev/blog/saas/saas-stack-2026) — Opinionated, detailed layer-by-layer picks
- [Startup Tech Stack 2026: What I Actually Pick — HouseofMVPs](https://houseofmvps.com/blog/mvp/startup-tech-stack-2026) — Real-world practitioner perspective after 50+ MVPs
- [Next.js vs Remix vs Astro vs SvelteKit 2026 — Pockit](https://pockit.tools/blog/nextjs-vs-remix-vs-astro-vs-sveltekit-2026-comparison/) — Comprehensive framework comparison with benchmark data
- [Best SaaS Tech Stack Architecture 2026 — AgileSoftLabs](https://www.agilesoftlabs.com/blog/2026/03/best-saas-tech-stack-architecture-2026) — Architecture-focused, multi-tenancy advice
- [Drizzle vs Prisma 2026 — Pockit](https://pockit.tools/blog/drizzle-orm-vs-prisma-2026-comparison/) — Honest ORM comparison post-Prisma-v7
- [Drizzle vs Prisma 2026 — Encore](https://encore.dev/articles/drizzle-vs-prisma) — Clean side-by-side from framework team
- [Better Auth vs Clerk vs Auth.js 2026 — PkgPulse](https://www.pkgpulse.com/guides/better-auth-vs-clerk-vs-authjs-2026) — Comprehensive auth comparison with download data
- [Better Auth vs Clerk vs NextAuth — LogRocket](https://blog.logrocket.com/best-auth-library-nextjs-2026/) — Tested all major auth libraries
- [Stripe vs Lemon Squeezy — Cadence](https://cadence.withremote.ai/blog/stripe-vs-lemon-squeezy) — Detailed cost analysis for indie SaaS
- [Vercel vs Cloudflare 2026 — SQLAgent](https://sqlagent.app/blog/cloudflare-vs-vercel) — Latency benchmarks, pricing comparison
- [Cloudflare vs Vercel vs Netlify 2026 — TechPlained](https://www.techplained.com/cloudflare-vs-vercel-vs-netlify) — Side-by-side pricing at different scales
- [Neon vs PlanetScale 2026 — getautonoma](https://getautonoma.com/blog/neon-vs-planetscale) — Architectural differences explained
- [Tailwind CSS v4.3 — Tailwind Blog](https://tailwindcss.com/blog/tailwindcss-v4-3) — Official release notes
- [Vercel AI SDK — ai-sdk.dev](https://ai-sdk.dev/) — Official docs
- [Hono vs tRPC vs oRPC — supastarter](https://supastarter.dev/blog/hono-vs-trpc-vs-orpc-api-comparison) — Clean API layer comparison table

### Dropped

- Multiple SEO-heavy comparison sites with near-identical content and no unique data
- Stale pre-2026 articles that predate key changes (Prisma v7, Tailwind v4, Astro acquisition)
- Vendor marketing pages with no independent analysis

---

## Gaps

1. **SvelteKit production data**: While mentioned as a runner-up, production SaaS SvelteKit adoption numbers are hard to find. The ecosystem is smaller but developer satisfaction is high.
2. **oRPC maturity**: Emerging as a tRPC alternative with OpenAPI, but limited production case studies available.
3. **Lemon Squeezy post-acquisition trajectory**: Since Stripe's acquisition, long-term roadmap clarity is uncertain. Worth monitoring.
4. **Neon post-Databricks acquisition**: May shift pricing/features. Need to watch for changes in the Databricks/Lakebase era.
5. **AI agent infrastructure**: The Vercel AI SDK v6 agent features are new (Dec 2025). Production hardening is ongoing. Alternative agent frameworks (LangGraph, CrewAI) are evolving rapidly.

---

## Supervisor coordination

No supervisor contact needed. Research complete.
