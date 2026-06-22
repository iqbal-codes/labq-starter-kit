# Database Layer Analysis

## Files Retrieved

1. **`packages/db/src/schema/auth.ts`** (entire file) — Core DB schema: 4 tables (user, session, account, verification) with relations for Better Auth.
2. **`packages/db/src/schema/index.ts`** (1 line) — Re-exports auth schema.
3. **`packages/db/src/index.ts`** (entire file) — Drizzle client factory (`createDb()`).
4. **`packages/db/drizzle.config.ts`** (entire file) — Drizzle Kit config (pg dialect, schema path, migration output).
5. **`packages/db/package.json`** — Dependencies (drizzle-orm 0.45.1, pg 8.17.1, drizzle-kit 0.31.8 dev).
6. **`packages/auth/src/index.ts`** (entire file) — Better Auth setup with Drizzle adapter.
7. **`packages/env/src/server.ts`** (entire file) — Server env schema (DATABASE_URL, BETTER_AUTH_SECRET, etc.).
8. **`packages/env/src/web.ts`** (entire file) — Web env schema (NEXT_PUBLIC_SERVER_URL).
9. **`apps/server/src/index.ts`** — Hono server with auth handler, oRPC router.
10. **`apps/server/.env`** — Example env with DATABASE_URL.
11. **`packages/api/src/context.ts`** — Request context (auth session retrieval).
12. **`packages/api/src/index.ts`** — oRPC public/protected procedures.
13. **`packages/api/src/routers/index.ts`** — Example router (healthCheck, privateData).
14. **`apps/web/src/lib/auth-client.ts`** — Better Auth client on the frontend.
15. **`README.md`** — Project docs referencing Drizzle + PostgreSQL.

## Key Code

### Schema (`packages/db/src/schema/auth.ts`)

Four tables follow Better Auth's expected schema:

- **`user`** — `id`, `name`, `email` (unique), `emailVerified`, `image`, `createdAt`, `updatedAt`
- **`session`** — `id`, `expiresAt`, `token` (unique), `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId` (FK → user.id, cascade delete). Indexed on `userId`.
- **`account`** — `id`, `accountId`, `providerId`, `userId` (FK → user.id, cascade delete), `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt`. Indexed on `userId`.
- **`verification`** — `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`. Indexed on `identifier`.

Relations defined via Drizzle `relations()`:

- **user** → has many `sessions` and `accounts`
- **session** → belongs to one `user`
- **account** → belongs to one `user`

All tables use `text("id").primaryKey()` (Better Auth generates opaque string IDs).

### DB Client (`packages/db/src/index.ts`)

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export function createDb() {
	return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
```

- Uses `node-postgres` driver.
- Loads schema (currently only auth tables).
- `createDb()` is a factory; a singleton `db` is also exported.

### Auth Integration (`packages/auth/src/index.ts`)

Better Auth uses the Drizzle adapter pointing at the auth schema:

```ts
betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema: schema }),
	emailAndPassword: { enabled: true },
	// ...
});
```

This means Better Auth handles all auth-related DB operations through the adapter — inserts, reads, session management. The app code never directly touches these tables.

### Environment Variables

**Server** (`packages/env/src/server.ts`):

| Variable             | Type                 | Notes                      |
| -------------------- | -------------------- | -------------------------- |
| `DATABASE_URL`       | `z.string().min(1)`  | Postgres connection string |
| `BETTER_AUTH_SECRET` | `z.string().min(32)` | Used by Better Auth        |
| `BETTER_AUTH_URL`    | `z.url()`            | Server's own URL           |
| `CORS_ORIGIN`        | `z.url()`            | Frontend origin for CORS   |
| `NODE_ENV`           | enum                 | dev/prod/test, default dev |

**Web** (`packages/env/src/web.ts`):

| Variable                 | Type      | Notes                      |
| ------------------------ | --------- | -------------------------- |
| `NEXT_PUBLIC_SERVER_URL` | `z.url()` | Server URL for auth client |

### API Context (`packages/api/src/context.ts`)

On every request, the context fetches the session via `auth.api.getSession()` using request headers. The session is available to all oRPC procedures. Protected procedures check `context.session?.user`.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    apps/web                          │
│  (Next.js) auth-client.ts ←→ auth.handler           │
└──────────┬──────────────────────────────────────────┘
           │ HTTP (fetch)
           ▼
┌─────────────────────────────────────────────────────┐
│                  apps/server                         │
│  (Hono)                                             │
│  ├── /api/auth/*  → auth.handler (Better Auth)     │
│  ├── /rpc/*       → RPC handler (oRPC)             │
│  └── /api-reference/* → OpenAPI handler (oRPC)     │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│              packages/auth                          │
│  createAuth() → betterAuth({                        │
│    database: drizzleAdapter(db, { schema })         │
│  })                                                 │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│               packages/db                           │
│  createDb() → drizzle(env.DATABASE_URL, { schema }) │
│  Schema: user, session, account, verification       │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│            PostgreSQL (via node-postgres)            │
│  No RLS policies. No Supabase. Plain Postgres.      │
│  No migrations generated yet.                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Auth flow**: Frontend auth client → server `/api/auth/*` → Better Auth → Drizzle adapter → PostgreSQL
2. **API flow**: Frontend fetch → server `/rpc/*` → oRPC handler → context (session from auth) → procedure handlers
3. **DB access**: Currently only `packages/auth` reads/writes the database. The app's business logic (`packages/api`) uses the session from context but has no direct DB queries yet.

## Migrations Status

- **No migration files exist** — `packages/db/src/migrations/` directory does not exist.
- The project uses `bun run db:push` (drizzle-kit push) to sync schema directly, not migrations.
- `bun run db:migrate` and `bun run db:generate` are available as scripts but unused.
- Drizzle config outputs migrations to `./src/migrations` with `postgresql` dialect.

## RLS / Supabase / Postgres Configuration

- **No RLS policies exist anywhere in the codebase.**
- **No Supabase** — The project uses plain PostgreSQL via `node-postgres` (the `pg` npm package). There is no Supabase client, no Supabase CLI, and no `supabase/` directory.
- **No custom SQL, triggers, or stored procedures.**
- **No Docker Compose** for local Postgres — the developer is expected to have a Postgres instance running.

## Constraints, Risks & Open Questions

### Constraints

- Schema is tightly coupled to Better Auth's expectations (table names, column names, key types). Deviating would break the adapter.
- No migration files = no versioned schema history. `db:push` is a direct sync that can't be rolled back.
- `createDb()` is a singleton — could be problematic in serverless or testing where you want fresh connections.

### Risks

- **No migrations in source control**: If `db:push` is the only workflow, schema changes are invisible in code review. A `db:generate` / `db:migrate` workflow should be established before production.
- **Singleton DB client**: The exported `db` singleton is created at module import time. If `DATABASE_URL` isn't set at import time (e.g., in tests), it will fail. The factory `createDb()` is safer.
- **No connection pooling**: `node-postgres` direct connection — no `pgBouncer` or `pgPool` wrapper. For serverless, this could exhaust connections.
- **No RLS**: All auth enforcement is application-level. If the DB is queried from another context (e.g., a worker script), there's no row-level security — all data is accessible.
- **Better Auth adapter owns the schema**: App code should never mutate auth tables directly.

### Open Questions

1. Is there a plan to add business-logic tables (organizations, projects, etc.)? The schema only has auth tables.
2. Should the project adopt a migration workflow (`db:generate` + `db:migrate`) before production?
3. Is connection pooling needed (e.g., `pg` pool vs. direct client)?
4. Any plans for RLS or multi-tenant row isolation as the app grows?
5. Where will business-logic queries live — in `packages/db` as query modules, or directly in `packages/api`?
6. Should `packages/db/src/schema/index.ts` export a barrel of all schemas? Currently it has a duplicate `export {}` after the wildcard re-export.

## Start Here

**`packages/db/src/schema/auth.ts`** — This is the entire database model. Everything flows from this schema: the Drizzle client, the Better Auth adapter, and the session-based auth context. If you're adding new tables or modifying auth tables, start here, then regenerate.
